// Основные фразы для приложения
const phrases = {
    ru: [
        { manglish: "Privet", malayalam: "ഹായ്", translation: "Привет" },
        { manglish: "Spasibo", malayalam: "നന്ദി", translation: "Спасибо" },
        { manglish: "Pozhaluysta", malayalam: "ദയവായി", translation: "Пожалуйста" },
        { manglish: "Kak dela?", malayalam: "എങ്ങനെയാണ്?", translation: "Как дела?" },
        { manglish: "Xorosho", malayalam: "നല്ലത്", translation: "Хорошо" },
        { manglish: "Do svidaniya", malayalam: "വിട", translation: "До свидания" },
        { manglish: "Pomogi", malayalam: "സഹായിക്കുക", translation: "Помоги" },
        { manglish: "Izvinite", malayalam: "ക്ഷമിക്കണം", translation: "Извините" },
        { manglish: "Kak zovut?", malayalam: "എന്താണ് നിങ്ങളുടെ പേര്?", translation: "Как вас зовут?" },
        { manglish: "Mne nravitsa", malayalam: "ഞാൻ ഇഷ്ടപ്പെടുന്നു", translation: "Мне нравится" }
    ],
    en: [
        { manglish: "Hello", malayalam: "ഹായ്", translation: "Hello" },
        { manglish: "Thank you", malayalam: "നന്ദി", translation: "Thank you" },
        { manglish: "Please", malayalam: "ദയവായി", translation: "Please" },
        { manglish: "How are you?", malayalam: "എങ്ങനെയാണ്?", translation: "How are you?" },
        { manglish: "Good", malayalam: "നല്ലത്", translation: "Good" },
        { manglish: "Goodbye", malayalam: "വിട", translation: "Goodbye" },
        { manglish: "Help", malayalam: "സഹായിക്കുക", translation: "Help" },
        { manglish: "Sorry", malayalam: "ക്ഷമിക്കണം", translation: "Sorry" },
        { manglish: "What's your name?", malayalam: "എന്താണ് നിങ്ങളുടെ പേര്?", translation: "What's your name?" },
        { manglish: "I like it", malayalam: "ഞാൻ ഇഷ്ടപ്പെടുന്നു", translation: "I like it" }
    ],
    ml: [
        { manglish: "ഹായ്", malayalam: "ഹായ്", translation: "ഹായ്" },
        { manglish: "നന്ദി", malayalam: "നന്ദി", translation: "നന്ദി" },
        { manglish: "ദയവായി", malayalam: "ദയവായി", translation: "ദയവായി" },
        { manglish: "എങ്ങനെയാണ്?", malayalam: "എങ്ങനെയാണ്?", translation: "എങ്ങനെയാണ്?" },
        { manglish: "നല്ലത്", malayalam: "നല്ലത്", translation: "നല്ലത്" },
        { manglish: "വിട", malayalam: "വിട", translation: "വിട" },
        { manglish: "സഹായിക്കുക", malayalam: "സഹായിക്കുക", translation: "സഹായിക്കുക" },
        { manglish: "ക്ഷമിക്കണം", malayalam: "ക്ഷമിക്കണം", translation: "ക്ഷമിക്കണം" },
        { manglish: "എന്താണ് നിങ്ങളുടെ പേര്?", malayalam: "എന്താണ് നിങ്ങളുടെ പേര്?", translation: "എന്താണ് നിങ്ങളുടെ പേര്?" },
        { manglish: "ഞാൻ ഇഷ്ടപ്പെടുന്നു", malayalam: "ഞാൻ ഇഷ്ടപ്പെടുന്നു", translation: "ഞാൻ ഇഷ്ടപ്പെടുന്നു" }
    ]
};

// Инициализация приложения
document.addEventListener('DOMContentLoaded', function() {
    const telegram = window.Telegram.WebApp;
    telegram.ready();

    // Установка начального языка
    let currentLanguage = 'ru';
    document.querySelector(`[data-lang="${currentLanguage}"]`).classList.add('active');

    // Обработчики событий
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentLanguage = this.dataset.lang;
            loadPhrase(currentLanguage);
        });
    });

    document.getElementById('start-btn').addEventListener('click', function() {
        loadPhrase(currentLanguage);
    });

    document.getElementById('next-btn').addEventListener('click', function() {
        loadPhrase(currentLanguage);
    });

    // Загрузка первой фразы
    loadPhrase(currentLanguage);
});

// Функция для загрузки фразы
function loadPhrase(lang) {
    const contentArea = document.getElementById('content');
    const randomIndex = Math.floor(Math.random() * phrases[lang].length);
    const phrase = phrases[lang][randomIndex];

    contentArea.innerHTML = `
        <div class="phrase-card">
            <h2>${phrase.manglish}</h2>
            <p>${phrase.malayalam}</p>
            <p>${phrase.translation}</p>
            <button class="speak-btn" onclick="speak('${phrase.malayalam}')">🔊</button>
        </div>
    `;
}

// Функция для синтеза речи
function speak(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ml-IN';
    window.speechSynthesis.speak(utterance);
}
