# 🚀 DayFlow — Telegram Mini App (Умный Органайзер & AI-Ассистент)

Премиальный Telegram Mini App: расписание пар и встреч, список задач с приоритетами, трекер дней рождения с обратным отсчетом, чат для срочных вопросов и интеллектуальный балансировщик дня.

---

## 🛠 Технологии
- **Frontend:** React 19 + TypeScript + Vite
- **Styling:** Vanilla CSS (Dark Glassmorphism, Neon Glow)
- **Telegram WebApp SDK:** тактильный отклик (Haptic Feedback), themeParams
- **Деплой:** GitHub Actions ➔ GitHub Pages (или Vercel)

---

## 🤖 Как подключить Mini App к Telegram Боту (@BotFather):

1. Открой в Telegram бота **[@BotFather](https://t.me/BotFather)**.
2. Отправь команду: `/newbot` (или выбери существующего через `/mybots`).
3. Введи имя и username для бота (например, `DayFlowAssistantBot`).
4. Настрой Web App / Menu Button:
   - Отправь команду `/newapp` (или `/setmenubutton`).
   - Выбери своего бота.
   - Введи название: `DayFlow`.
   - Введи описание: `Умный органайзер дня и AI-помощник`.
   - Загрузи иконку 640x360 (если просит).
   - В поле **Web App URL** укажи ссылку на деплой:
     `https://<твой-логин-github>.github.io/<имя-репозитория>/` (или ссылку с Vercel).
   - Укажи short name (например, `app`).
5. Готово! Теперь в твоем боте появится кнопка **«Запустить DayFlow»** в нижнем меню, открывающая приложение во весь экран.

---

## 💻 Локальный запуск
```bash
npm install
npm run dev
```
Откройте: `http://localhost:5175/`
