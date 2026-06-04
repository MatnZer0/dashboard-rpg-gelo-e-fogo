# Dashboard RPG G&F — Telegram Mini App

A Telegram Mini App built with **Next.js 14** and deployed on **Vercel**.  
Includes a built-in bot webhook — no separate server needed.

---

## ✏️ Updating the Data

Replace `data/dominios.csv` and push. Vercel rebuilds automatically.

**Rules:** keep header names intact, `Turno_Feito` = `Sim` or `Não`, `Turno` = number. Empty cells are fine.

---

## Project Structure

```
data/
  dominios.csv                  ← ✏️ edit this to update dashboard data

src/
  app/
    api/bot/route.ts            ← Telegram webhook (POST) + setup (GET)
    layout.tsx
    page.tsx
    globals.css
  components/
    Dashboard.tsx
    TelegramInit.tsx
  lib/
    data.ts                     ← server-only CSV reader
    types.ts                    ← shared types & helpers
```

---

## Deploy & Bot Setup

### 1. Push to GitHub & deploy on Vercel

```bash
git init && git add . && git commit -m "init"
git remote add origin https://github.com/YOUR/repo.git
git push -u origin main
```

Import the repo on [vercel.com](https://vercel.com). Next.js is auto-detected.

### 2. Add environment variables on Vercel

Go to your project → **Settings → Environment Variables** and add:

| Name | Value |
|------|-------|
| `BOT_TOKEN` | Your token from @BotFather |
| `MINI_APP_URL` | `https://your-project.vercel.app` (no trailing slash) |
| `WEBHOOK_SECRET` | Any random string (generate one below) |

Generate a secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Redeploy after saving the variables.

### 3. Register the webhook (once)

After deploying, open this URL in your browser once:
```
https://your-project.vercel.app/api/bot?secret=YOUR_WEBHOOK_SECRET
```

You should get `{"ok":true,"result":true,"description":"Webhook was set"}`.  
Telegram will now send all bot updates to your Vercel app.

### 4. BotFather settings

**Allow the bot to read group messages:**
> @BotFather → `/mybots` → your bot → **Bot Settings → Group Privacy → Turn off**

**Register commands (shows autocomplete in Telegram):**
> @BotFather → `/mybots` → your bot → **Edit Bot → Edit Commands** → paste:
> ```
> dashboard - Abrir o Dashboard RPG G&F
> start - Iniciar o bot
> ```

**Link the Mini App:**
> @BotFather → `/mybots` → your bot → **Bot Settings → Mini Apps → Main App** → paste your Vercel URL

---

## Local Development

```bash
cp .env.example .env.local   # fill in your values
npm install
npm run dev
```

> The webhook route won't receive Telegram updates locally (Telegram can't reach localhost).  
> Use [ngrok](https://ngrok.com) to expose your local server if you want to test it:
> ```bash
> ngrok http 3000
> # then register the webhook with your ngrok URL
> ```

---

## Commands

| Command | Works in | What it does |
|---------|----------|-------------|
| `/start` | Private chat | Greeting + dashboard button |
| `/dashboard` | Groups & private chats | Dashboard button |
