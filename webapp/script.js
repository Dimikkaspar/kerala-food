/* ===== Malayalam Learning App — Duolingo-style ===== */
(function(){
'use strict';

/* ── i18n ── */
const I18N = {
  ru: {
    heroSub:'Учи малаялам играя', checkBtn:'ПРОВЕРИТЬ', continueBtn:'ПРОДОЛЖИТЬ',
    resultsTitle:'Урок завершён!', accuracy:'Точность', correct:'Верно',
    streakDays:'Дней подряд', nextBtn:'ДАЛЕЕ',
    qFlash:'Нажми на карточку, чтобы перевернуть', qQuiz:'Выбери правильный перевод',
    qType:'Напиши перевод на манглиш', qAudio:'Послушай и выбери перевод',
    greetings:'Приветствия', food:'Еда', numbers:'Числа',
    daily:'Ежедневные', directions:'Направления', shopping:'Покупки',
    phrases:'фраз', completed:'Пройдено'
  },
  en: {
    heroSub:'Learn Malayalam by playing', checkBtn:'CHECK', continueBtn:'CONTINUE',
    resultsTitle:'Lesson Complete!', accuracy:'Accuracy', correct:'Correct',
    streakDays:'Day streak', nextBtn:'NEXT',
    qFlash:'Tap the card to flip it', qQuiz:'Choose the correct translation',
    qType:'Type the manglish translation', qAudio:'Listen and choose the translation',
    greetings:'Greetings', food:'Food', numbers:'Numbers',
    daily:'Daily', directions:'Directions', shopping:'Shopping',
    phrases:'phrases', completed:'Completed'
  }
};

const CATS = [
  {id:'greetings', emoji:'👋', lvl:1},
  {id:'food',      emoji:'🍛', lvl:1},
  {id:'numbers',   emoji:'🔢', lvl:1},
  {id:'daily',     emoji:'💬', lvl:2},
  {id:'directions',emoji:'🗺️', lvl:2},
  {id:'shopping',  emoji:'🛒', lvl:2}
];

const MODES = ['flash','quiz','type','audio'];
const LESSON_SIZE = 10;
const XP_PER_CORRECT = 10;
const MAX_HEARTS = 5;

/* ── State ── */
let state = load('ml_state', {
  xp: 0, streak: 0, hearts: MAX_HEARTS, lang: 'ru',
  progress: {}, lastDate: null
});
let phrases = [];
let lesson = null; // { questions:[], idx:0, score:0, selectedAnswer:null, answered:false }

/* ── Storage ── */
function load(k, def) {
  try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : def; }
  catch(e) { return def; }
}
function save() {
  try { localStorage.setItem('ml_state', JSON.stringify(state)); } catch(e) {}
}

/* ── Telegram WebApp ── */
const tg = window.Telegram && window.Telegram.WebApp;
function haptic(type) {
  try { if(tg) tg.HapticFeedback.impactOccurred(type || 'light'); } catch(e) {}
}

/* ── Init ── */
async function init() {
  if(tg) { tg.ready(); tg.expand(); }
  checkStreak();
  await loadPhrases();
  applyLang();
  renderHome();
}

async function loadPhrases() {
  try {
    const r = await fetch('data/phrases.json');
    phrases = await r.json();
  } catch(e) {
    console.error('Failed to load phrases', e);
    phrases = [];
  }
}

function checkStreak() {
  const today = new Date().toISOString().slice(0,10);
  if(!state.lastDate) { state.streak = 0; }
  else if(state.lastDate === today) { /* same day */ }
  else {
    const last = new Date(state.lastDate);
    const diff = Math.floor((new Date(today) - last) / 86400000);
    if(diff > 1) state.streak = 0;
  }
  if(state.hearts < MAX_HEARTS) {
    const today2 = new Date().toISOString().slice(0,10);
    if(state.lastDate !== today2) state.hearts = MAX_HEARTS;
  }
  save();
}

/* ── i18n ── */
function t(key) { return (I18N[state.lang] || I18N.ru)[key] || key; }

function applyLang() {
  document.getElementById('lang-toggle').textContent = state.lang.toUpperCase();
  document.querySelectorAll('[data-i]').forEach(el => {
    const k = el.getAttribute('data-i');
    if(I18N[state.lang] && I18N[state.lang][k]) el.textContent = I18N[state.lang][k];
  });
}

function toggleLang() {
  state.lang = state.lang === 'ru' ? 'en' : 'ru';
  save(); applyLang(); renderHome();
}

/* ── Screens ── */
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function goHome() {
  showScreen('screen-home');
  renderHome();
}

/* ── Home ── */
function renderHome() {
  document.getElementById('streak-val').textContent = state.streak;
  document.getElementById('xp-val').textContent = state.xp;
  document.getElementById('hearts-home').textContent = state.hearts;

  const grid = document.getElementById('categories-grid');
  const lk = state.lang === 'ru' ? 'ru' : 'en';

  // Unlock logic: level 1 always unlocked; level 2 unlocked when any level 1 cat has progress >= 5
  const lvl1Done = CATS.filter(c => c.lvl === 1).some(c => (state.progress[c.id]||0) >= 5);

  grid.innerHTML = CATS.map(cat => {
    const count = phrases.filter(p => p.cat === cat.id).length;
    const prog = state.progress[cat.id] || 0;
    const pct = count ? Math.min(100, Math.round(prog / count * 100)) : 0;
    const unlocked = cat.lvl === 1 || lvl1Done;
    const done = pct >= 100;

    return `<div class="cat-card ${unlocked ? 'unlocked' : 'locked'}" onclick="${unlocked ? `startLesson('${cat.id}')` : ''}">
      ${!unlocked ? '<div class="cat-lock">🔒</div>' : ''}
      ${done ? '<div class="cat-check">✓</div>' : ''}
      <div class="cat-emoji">${cat.emoji}</div>
      <div class="cat-name">${t(cat.id)}</div>
      <div class="cat-count">${count} ${t('phrases')}${prog > 0 ? ' · ' + t('completed') + ' ' + pct + '%' : ''}</div>
      <div class="cat-progress"><div class="cat-progress-fill" style="width:${pct}%"></div></div>
    </div>`;
  }).join('');
}

/* ── Lesson Engine ── */
function startLesson(catId) {
  if(state.hearts <= 0) { state.hearts = MAX_HEARTS; save(); }

  const pool = phrases.filter(p => p.cat === catId);
  if(pool.length < 4) return;

  // Pick up to LESSON_SIZE phrases, shuffled
  const picked = shuffle([...pool]).slice(0, LESSON_SIZE);
  const questions = picked.map(phrase => {
    const mode = MODES[Math.floor(Math.random() * MODES.length)];
    let options = null;
    if(mode === 'quiz' || mode === 'audio') {
      const wrongs = shuffle(pool.filter(p => p.id !== phrase.id)).slice(0,3);
      const lk = state.lang === 'ru' ? 'ru' : 'en';
      options = shuffle([
        { text: phrase[lk], correct: true },
        ...wrongs.map(w => ({ text: w[lk], correct: false }))
      ]);
    }
    return { phrase, mode, options };
  });

  lesson = { questions, idx: 0, score: 0, selectedAnswer: null, answered: false, catId };
  showScreen('screen-lesson');
  renderQuestion();
}

function renderQuestion() {
  if(!lesson) return;
  const q = lesson.questions[lesson.idx];
  const total = lesson.questions.length;
  const lk = state.lang === 'ru' ? 'ru' : 'en';

  // Progress
  const pct = (lesson.idx / total) * 100;
  document.getElementById('lesson-progress').style.width = pct + '%';
  document.getElementById('progress-text').textContent = `${lesson.idx}/${total}`;

  // Hearts
  const hd = document.getElementById('hearts-display');
  hd.innerHTML = '';
  for(let i = 0; i < MAX_HEARTS; i++) {
    const s = document.createElement('span');
    s.className = 'heart' + (i >= state.hearts ? ' lost' : '');
    s.textContent = '❤️';
    hd.appendChild(s);
  }

  // Reset
  lesson.selectedAnswer = null;
  lesson.answered = false;
  const btn = document.getElementById('check-btn');
  btn.disabled = true;
  btn.textContent = t('checkBtn');
  btn.className = 'check-btn';
  btn.onclick = checkAnswer;
  hideFeedback();

  const area = document.getElementById('question-area');

  if(q.mode === 'flash') {
    area.innerHTML = `
      <p class="q-prompt">${t('qFlash')}</p>
      <div class="flashcard" id="flashcard" onclick="toggleFlash()">
        <div class="flashcard-inner">
          <div class="flash-front">
            <div class="flash-ml">${q.phrase.ml}</div>
            <div class="flash-mg">${q.phrase.mg}</div>
            <button class="audio-btn" onclick="event.stopPropagation();speak('${q.phrase.ml}')">🔊</button>
          </div>
          <div class="flash-back">
            <div class="flash-trans">${q.phrase[lk]}</div>
            <div class="flash-hint">${q.phrase.mg}</div>
          </div>
        </div>
      </div>`;
    // Auto-enable check for flashcard (no wrong answer possible)
    btn.disabled = false;
    lesson.selectedAnswer = '__flash__';

  } else if(q.mode === 'quiz') {
    area.innerHTML = `
      <p class="q-prompt">${t('qQuiz')}</p>
      <div class="flash-ml" style="font-size:1.8rem;margin-bottom:4px">${q.phrase.ml}</div>
      <div class="flash-mg" style="color:var(--green);font-style:italic;margin-bottom:12px">${q.phrase.mg}</div>
      <button class="audio-btn" onclick="speak('${q.phrase.ml}')" style="margin-bottom:16px">🔊</button>
      <div class="options-grid" id="options-grid">
        ${q.options.map((o,i) => `<button class="option-btn" data-idx="${i}" onclick="selectOption(${i})">${o.text}</button>`).join('')}
      </div>`;

  } else if(q.mode === 'audio') {
    area.innerHTML = `
      <p class="q-prompt">${t('qAudio')}</p>
      <button class="audio-btn" onclick="speak('${q.phrase.ml}')" id="audio-main">🔊</button>
      <div class="options-grid" id="options-grid" style="margin-top:20px">
        ${q.options.map((o,i) => `<button class="option-btn" data-idx="${i}" onclick="selectOption(${i})">${o.text}</button>`).join('')}
      </div>`;
    // Auto-play audio
    setTimeout(() => speak(q.phrase.ml), 400);

  } else if(q.mode === 'type') {
    area.innerHTML = `
      <p class="q-prompt">${t('qType')}</p>
      <div class="flash-ml" style="font-size:1.8rem;margin-bottom:4px">${q.phrase.ml}</div>
      <div style="color:var(--text2);font-size:0.85rem;margin-bottom:8px">${q.phrase[lk]}</div>
      <button class="audio-btn" onclick="speak('${q.phrase.ml}')" style="margin-bottom:16px">🔊</button>
      <div class="typing-wrap">
        <input type="text" class="typing-input" id="typing-input"
          placeholder="manglish..." autocomplete="off" autocapitalize="off"
          oninput="onTyping()">
        <div class="typing-hint">💡 ${q.phrase.mg.charAt(0)}${'·'.repeat(q.phrase.mg.length-1)}</div>
      </div>`;
    setTimeout(() => {
      const inp = document.getElementById('typing-input');
      if(inp) inp.focus();
    }, 300);
  }
}

/* ── Interactions ── */
window.toggleFlash = function() {
  const fc = document.getElementById('flashcard');
  if(fc) fc.classList.toggle('flipped');
  haptic('light');
};

window.selectOption = function(idx) {
  if(lesson.answered) return;
  lesson.selectedAnswer = idx;
  document.querySelectorAll('.option-btn').forEach((b,i) => {
    b.classList.toggle('selected', i === idx);
  });
  document.getElementById('check-btn').disabled = false;
  haptic('light');
};

window.onTyping = function() {
  const inp = document.getElementById('typing-input');
  if(!inp) return;
  lesson.selectedAnswer = inp.value.trim();
  document.getElementById('check-btn').disabled = !inp.value.trim();
};

function checkAnswer() {
  if(!lesson || lesson.answered) { nextQuestion(); return; }
  lesson.answered = true;

  const q = lesson.questions[lesson.idx];
  const lk = state.lang === 'ru' ? 'ru' : 'en';
  let isCorrect = false;

  if(q.mode === 'flash') {
    isCorrect = true; // Flashcards are always "correct" (learning mode)

  } else if(q.mode === 'quiz' || q.mode === 'audio') {
    const chosen = q.options[lesson.selectedAnswer];
    isCorrect = chosen && chosen.correct;
    // Highlight options
    document.querySelectorAll('.option-btn').forEach((b,i) => {
      b.classList.remove('selected');
      if(q.options[i].correct) b.classList.add('correct');
      else if(i === lesson.selectedAnswer && !isCorrect) b.classList.add('wrong');
    });

  } else if(q.mode === 'type') {
    const answer = (lesson.selectedAnswer || '').toLowerCase().replace(/[^a-z0-9\s?]/g,'').trim();
    const correct = q.phrase.mg.toLowerCase().replace(/[^a-z0-9\s?]/g,'').trim();
    isCorrect = answer === correct;
    const inp = document.getElementById('typing-input');
    if(inp) inp.classList.add(isCorrect ? 'correct' : 'wrong');
  }

  if(isCorrect) {
    lesson.score++;
    showFeedback(true, '');
    haptic('light');
    showXpPopup('+' + XP_PER_CORRECT);
  } else {
    state.hearts = Math.max(0, state.hearts - 1);
    showFeedback(false, q.phrase[lk] + ' = ' + q.phrase.mg);
    haptic('heavy');
    save();
  }

  const btn = document.getElementById('check-btn');
  btn.textContent = t('nextBtn');
  btn.disabled = false;
  btn.className = 'check-btn ' + (isCorrect ? 'next' : 'next-wrong');
  btn.onclick = nextQuestion;
}

function nextQuestion() {
  lesson.idx++;
  if(lesson.idx >= lesson.questions.length || state.hearts <= 0) {
    finishLesson();
  } else {
    renderQuestion();
  }
}

function finishLesson() {
  const earned = lesson.score * XP_PER_CORRECT;
  state.xp += earned;
  const today = new Date().toISOString().slice(0,10);
  if(state.lastDate !== today) {
    state.streak++;
    state.lastDate = today;
  }
  // Progress: count unique phrases answered correctly
  state.progress[lesson.catId] = Math.max(state.progress[lesson.catId]||0, lesson.score);
  save();

  document.getElementById('result-xp').textContent = '+' + earned;
  const accuracy = lesson.questions.length ? Math.round(lesson.score / lesson.questions.length * 100) : 0;
  document.getElementById('result-accuracy').textContent = accuracy + '%';
  document.getElementById('result-correct').textContent = lesson.score + '/' + lesson.questions.length;
  document.getElementById('result-streak').textContent = state.streak;

  showScreen('screen-results');
  applyLang();
}

/* ── Feedback ── */
function showFeedback(correct, text) {
  const fb = document.getElementById('feedback-bar');
  fb.className = 'feedback-bar show ' + (correct ? 'correct' : 'wrong');
  fb.innerHTML = correct
    ? '<div class="feedback-text">✓ ' + (state.lang==='ru'?'Правильно!':'Correct!') + '</div>'
    : '<div class="feedback-text">✕ ' + (state.lang==='ru'?'Неправильно':'Wrong') + '</div><div class="feedback-answer">' + text + '</div>';
}

function hideFeedback() {
  const fb = document.getElementById('feedback-bar');
  fb.className = 'feedback-bar';
  fb.innerHTML = '';
}

/* ── XP Popup ── */
function showXpPopup(text) {
  const el = document.createElement('div');
  el.className = 'xp-popup show';
  el.textContent = text;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 900);
}

/* ── Speech ── */
window.speak = function(text) {
  if(!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'ml-IN';
  u.rate = 0.85;
  window.speechSynthesis.speak(u);
};

/* ── Helpers ── */
function shuffle(arr) {
  for(let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/* ── Expose for onclick handlers ── */
window.toggleLang = toggleLang;
window.startLesson = startLesson;
window.goHome = goHome;
window.checkAnswer = checkAnswer;

/* ── Start ── */
init();

})();
