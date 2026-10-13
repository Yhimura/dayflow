// Vercel Serverless Function: Proxy для безопасной отправки сообщений от бота
// Токен бота читается строго из переменной окружения BOT_TOKEN на сервере
export default async function handler(req: any, res: any) {
  // Разрешаем CORS для запросов из Telegram Mini App
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const botToken = process.env.BOT_TOKEN;
  if (!botToken) {
    return res.status(500).json({ error: 'BOT_TOKEN is not configured in server environment' });
  }

  const { chatId, text } = req.body || {};
  if (!chatId || !text) {
    return res.status(400).json({ error: 'chatId and text are required' });
  }

  try {
    const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });

    const data = await tgRes.json();
    if (!data.ok) {
      return res.status(400).json({ error: data.description || 'Telegram API error' });
    }

    return res.status(200).json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
