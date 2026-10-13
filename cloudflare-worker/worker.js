/**
 * Cloudflare Worker: Безопасный серверный шлюз для Telegram-бота @DayFlowHelper_bot
 * 
 * Токен бота хранится в защищенных секретах Cloudflare (BOT_TOKEN)
 * Клиент не знает токен, а обращается к эндпоинту Worker'а: POST /
 * Body: { "chatId": "6444258914", "text": "🔔 Напоминание..." }
 */
export default {
  async fetch(request, env) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed. Use POST.' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const botToken = env.BOT_TOKEN;
    if (!botToken) {
      return new Response(JSON.stringify({ error: 'BOT_TOKEN is not configured in Worker secrets.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    try {
      const body = await request.json();
      const { chatId, text } = body || {};

      if (!chatId || !text) {
        return new Response(JSON.stringify({ error: 'Missing chatId or text' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: text,
          parse_mode: 'HTML',
          disable_web_page_preview: true,
        }),
      });

      const tgData = await tgRes.json();
      if (!tgData.ok) {
        return new Response(JSON.stringify({ error: tgData.description || 'Telegram API error' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message || 'Worker server error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  },
};
