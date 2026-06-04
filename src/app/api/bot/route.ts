import { NextRequest, NextResponse } from 'next/server';

const BOT_TOKEN = process.env.BOT_TOKEN;
const MINI_APP_URL = process.env.MINI_APP_URL;

// ── Telegram Bot API helper ───────────────────────────────────────────────────
async function sendMessage(chatId: number, text: string, replyMarkup?: object) {
  const body: Record<string, unknown> = {
    chat_id: chatId,
    text,
    parse_mode: 'MarkdownV2',
  };
  if (replyMarkup) body.reply_markup = replyMarkup;

  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  // Return the response so callers can log errors
  return res.json();
}

function escapeMarkdown(text: string): string {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, '\\$&');
}

const dashboardButton = () => ({
  inline_keyboard: [[
    { text: '🏰 Abrir Dashboard', web_app: { url: MINI_APP_URL } },
  ]],
});

// ── Webhook POST ──────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const update = await req.json();
    console.log('[bot] update:', JSON.stringify(update));

    const message = update?.message;
    if (!message) {
      console.log('[bot] no message in update, skipping');
      return NextResponse.json({ ok: true });
    }

    const chatId: number = message.chat.id;
    const text: string = message.text ?? '';
    console.log(`[bot] chat=${chatId} text="${text}"`);

    if (text.startsWith('/dashboard')) {
      const result = await sendMessage(
        chatId,
        '⚔️ *Dashboard RPG G\\&F*\nClique no botão abaixo para abrir o painel de domínios\\.',
        dashboardButton()
      );
      console.log('[bot] sendMessage result:', JSON.stringify(result));

    } else if (text.startsWith('/start')) {
      const name = escapeMarkdown(message.from?.first_name ?? 'aventureiro');
      const result = await sendMessage(
        chatId,
        `Olá, *${name}*\\! 👋\n\nSou o bot do *RPG G\\&F*\\. Use /dashboard para abrir o painel de domínios\\.`,
        dashboardButton()
      );
      console.log('[bot] sendMessage result:', JSON.stringify(result));
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[bot] webhook error:', err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

// ── GET: register webhook ─────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action') ?? 'set';
  const secret = searchParams.get('secret');

  if (secret !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ?action=info  → check current webhook status + env vars
  if (action === 'info') {
    const webhookInfo = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`
    ).then(r => r.json());

    return NextResponse.json({
      webhook: webhookInfo,
      env: {
        BOT_TOKEN: BOT_TOKEN ? `set (${BOT_TOKEN.slice(0, 6)}...)` : 'MISSING',
        MINI_APP_URL: MINI_APP_URL ?? 'MISSING',
        WEBHOOK_SECRET: process.env.WEBHOOK_SECRET ? 'set' : 'MISSING',
      },
    });
  }

  // ?action=set (default) → register the webhook
  const webhookUrl = `${MINI_APP_URL}/api/bot`;
  const res = await fetch(
    `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: webhookUrl,
        allowed_updates: ['message'],
      }),
    }
  );
  const data = await res.json();
  return NextResponse.json({ webhookUrl, ...data });
}
