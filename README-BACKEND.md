# 🛡 Безопасный серверный шлюз DayFlow для Telegram-бота

Этот шлюз решает главную проблему безопасности:
> **Токен бота хранится исключительно на закрытом защищённом сервере в секретных переменных и НИКОГДА не попадает в браузеры пользователей.**

---

## ⚡️ Вариант 1: Бесплатный Cloudflare Worker (Самый быстрый, ~2 минуты)

1. Зарегистрируйтесь или войдите на [dash.cloudflare.com](https://dash.cloudflare.com/) (бесплатно, 100 000 запросов в день).
2. Перейдите в раздел **Workers & Pages** ➔ **Create application** ➔ **Create Worker**.
3. Назовите его, например, `dayflow-bot-proxy` и нажмите **Deploy**.
4. Нажмите **Edit code** и замените весь код на содержимое файла:
   👉 `cloudflare-worker/worker.js` (из этого проекта).
5. Нажмите **Deploy**.
6. Перейдите во вкладку **Settings** воркера ➔ **Variables and Secrets**:
   - Нажмите **Add variable**.
   - Type: **Secret** (зашифровано).
   - Variable name: `BOT_TOKEN`
   - Value: ваш токен от `@BotFather` (например, `8875277564:AAEUWAK7sKEuTblqKq537PuPIfegwyXTul0`).
   - Нажмите **Save and Deploy**.
7. Скопируйте адрес вашего воркера (например, `https://dayflow-bot-proxy.yourname.workers.dev`).
8. Вставьте его в Настройки DayFlow в поле **«Серверный шлюз (Proxy URL)»** (или в файл `.env` как `VITE_PROXY_URL=...`).

Готово! Теперь бот отправляет сообщения через защищенный сервер, а обычным пользователям **не нужно вводить никакие токены**.

---

## ⚡️ Вариант 2: Vercel Serverless Function

Если вы деплоите проект через [Vercel](https://vercel.com):
1. Импортируйте ваш репозиторий `Yhimura/dayflow` в Vercel.
2. В настройках проекта (**Settings ➔ Environment Variables**) добавьте:
   - Key: `BOT_TOKEN`
   - Value: ваш токен от `@BotFather`
3. В Vercel автоматически станет доступен эндпоинт `/api/notify`.
4. В приложении в поле **«Серверный шлюз (Proxy URL)»** укажите `/api/notify`.
