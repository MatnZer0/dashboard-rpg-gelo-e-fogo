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

  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function escapeMarkdown(text: string): string {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, '\\$&');
}

const dashboardButton = {
  inline_keyboard: [[
    { text: '🏰 Abrir Dashboard', web_app: { url: MINI_APP_URL } },
  ]],
};

// ── Webhook handler ───────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const update = await req.json();
    const message = update?.message;
    if (!message) return NextResponse.json({ ok: true });

    const chatId: number = message.chat.id;
    const text: string = message.text ?? '';

    if (text.startsWith('/dashboard')) {
      await sendMessage(
        chatId,
        '⚔️ *Dashboard RPG G\\&F*\nClique no botão abaixo para abrir o painel de domínios\\.',
        dashboardButton
      );
    } else if (text.startsWith('/start')) {
      const name = escapeMarkdown(message.from?.first_name ?? 'aventureiro');
      await sendMessage(
        chatId,
        `Olá, *${name}*\\! 👋\n\nSou o bot do *RPG G\\&F*\\. Use /dashboard para abrir o painel de domínios\\.`,
        dashboardButton
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Webhook error:', err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

// GET /api/bot — register the webhook (call this once after deploying)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get('secret');

  if (secret !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const webhookUrl = `${MINI_APP_URL}/api/bot`;
  const res = await fetch(
    `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook?url=${encodeURIComponent(webhookUrl)}`
  );
  const data = await res.json();
  return NextResponse.json(data);
}
