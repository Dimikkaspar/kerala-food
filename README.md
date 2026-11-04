# 🐘 Malayalam Learning WebApp

Duolingo-style app for learning Malayalam, integrated as a Telegram WebApp.

## Features

- **4 learning modes**: Flashcards, Quiz, Typing, Audio
- **60+ phrases** across 6 categories: Greetings, Food, Numbers, Daily, Directions, Shopping
- **Gamification**: XP, streaks, hearts (lives)
- **Bilingual interface**: Russian / English
- **Manglish support**: Malayalam written in Latin script
- **Speech synthesis**: Listen to Malayalam pronunciation
- **Telegram WebApp**: Learn directly from the bot chat

## Try it

🤖 Telegram: [@KeralaFood_bot](https://t.me/KeralaFood_bot)

🌐 Web: [dimikkaspar.github.io/kerala-food](https://dimikkaspar.github.io/kerala-food/)

## Tech Stack

- Pure HTML / CSS / JS (no frameworks)
- Telegram WebApp SDK
- Web Speech API
- GitHub Pages (auto-deploy via Actions)
- JSON phrase database

## Adding Phrases

Edit `webapp/data/phrases.json`. Each phrase:

```json
{
  "id": 61,
  "cat": "greetings",
  "ml": "മലയാളം text",
  "mg": "manglish transliteration",
  "ru": "Русский перевод",
  "en": "English translation",
  "lvl": 1
}
```

Categories: `greetings`, `food`, `numbers`, `daily`, `directions`, `shopping`

## License

MIT

