import { NextRequest, NextResponse } from 'next/server';

// ── Telegram Bot API helper ───────────────────────────────────────────────────
async function sendMessage(chatId: number, text: string, replyMarkup?: object) {
  const body: Record<string, unknown> = {
    chat_id: chatId,
    text,
    parse_mode: 'MarkdownV2',
  };
  if (replyMarkup) body.reply_markup = replyMarkup;

  const res = await fetch(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

function escapeMarkdown(text: string): string {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, '\\$&');
}

// In private chats: web_app button opens instantly with no warning.
// In groups: send the t.me link as plain text — Telegram auto-renders it as
// a rich "LAUNCH" preview card, no warning popup on repeat opens.
function buildReply(chatType: string): { text: string; replyMarkup?: object } {
  const telegramAppLink = process.env.TELEGRAM_APP_LINK!;
  const miniAppUrl = process.env.MINI_APP_URL!;

  if (chatType === 'private') {
    return {
      text: '⚔️ *Dashboard RPG G\\&F*',
      replyMarkup: {
        inline_keyboard: [[
          { text: '🏰 Abrir Dashboard', web_app: { url: miniAppUrl } },
        ]],
      },
    };
  }

  // Group: just the link as text — Telegram renders the Launch card automatically
  return {
    text: escapeMarkdown(telegramAppLink),
  };
}

// ── Webhook POST ──────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const update = await req.json();
    console.log('[bot] update:', JSON.stringify(update));

    const message = update?.message;
    if (!message) return NextResponse.json({ ok: true });

    const chatId: number = message.chat.id;
    const chatType: string = message.chat.type;
    const text: string = message.text ?? '';
    console.log(`[bot] chat=${chatId} type=${chatType} text="${text}"`);

    if (text.startsWith('/dashboard')) {
      const { text: msgText, replyMarkup } = buildReply(chatType);
      const result = await sendMessage(chatId, msgText, replyMarkup);
      console.log('[bot] sendMessage result:', JSON.stringify(result));

    } else if (text.startsWith('/start')) {
      const name = escapeMarkdown(message.from?.first_name ?? 'aventureiro');
      const { text: msgText, replyMarkup } = buildReply(chatType);
      const greeting = `Olá, *${name}*\\! 👋\n\nSou o bot do *RPG G\\&F*\\. Use /dashboard para abrir o painel de domínios\\.\n\n${msgText}`;
      const result = await sendMessage(chatId, greeting, replyMarkup);
      console.log('[bot] sendMessage result:', JSON.stringify(result));
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[bot] webhook error:', err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

// ── GET: webhook management ───────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action') ?? 'set';
  const secret = searchParams.get('secret');

  if (secret !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (action === 'info') {
    const webhookInfo = await fetch(
      `https://api.telegram.org/bot${process.env.BOT_TOKEN}/getWebhookInfo`
    ).then(r => r.json());
    return NextResponse.json({
      webhook: webhookInfo,
      env: {
        BOT_TOKEN: process.env.BOT_TOKEN ? `set (${process.env.BOT_TOKEN.slice(0, 6)}...)` : 'MISSING',
        MINI_APP_URL: process.env.MINI_APP_URL ?? 'MISSING',
        TELEGRAM_APP_LINK: process.env.TELEGRAM_APP_LINK ?? 'MISSING',
        WEBHOOK_SECRET: process.env.WEBHOOK_SECRET ? 'set' : 'MISSING',
      },
    });
  }

  // action=set (default)
  const webhookUrl = `${process.env.MINI_APP_URL}/api/bot`;
  const res = await fetch(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: webhookUrl, allowed_updates: ['message'] }),
  });
  const data = await res.json();
  return NextResponse.json({ webhookUrl, ...data });
}