# Dashboard RPG G&F — Telegram Mini App

A Telegram Mini App built with **Next.js 14** and deployable on **Vercel**.  
Displays domain administration data (Domínios) for a tabletop RPG campaign.

---

## ✏️ Updating the Data

**Just replace the CSV file.** That's it.

The file lives at:
```
data/dominios.csv
```

Edit it in Excel, Google Sheets, LibreOffice, or any text editor — then commit and push.  
Vercel will automatically rebuild and redeploy with the new data.

**Rules to keep in mind:**
- Keep the header row exactly as-is (column names must not change)
- `Turno_Feito` must be either `Sim` or `Não`
- `Turno` must be a number (0, 1, 2, …)
- Empty cells are fine — they'll show as `—` in the dashboard
- You can add new domains (new `Nome` values) or new turns freely

---

## Features

- 🗺️ **Domínio dropdown** — lists all domains found in the CSV
- ⏱️ **Turno dropdown** — shows only turns where `Turno_Feito = "Sim"`, auto-selects the most recent
- 📊 **Live data panel** — updates when either dropdown changes
- 📜 **RPG parchment & gold theme** with medieval typography
- 📱 **Mobile-first** — designed for Telegram's WebView
- 🔧 **Telegram SDK** — graceful degradation when opened outside Telegram

---

## Project Structure

```
data/
  dominios.csv          ← ✏️  EDIT THIS FILE to update dashboard data

src/
  app/
    layout.tsx          ← Root layout, loads TelegramInit
    page.tsx            ← Server component: reads CSV → passes to Dashboard
    globals.css         ← Minimal global reset
  components/
    Dashboard.tsx       ← Client component: dropdowns + data display
    TelegramInit.tsx    ← Telegram SDK init (client-only)
  lib/
    data.ts             ← Server-only: CSV file reader & parser
    types.ts            ← Shared types & pure helper functions
```

---

## Quick Start (Local Dev)

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> The Telegram SDK logs a warning when running outside Telegram — expected, everything still works.

---

## Deploy to Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/rpg-dashboard.git
git push -u origin main
```

### 2. Connect to Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New → Project**
2. Import your GitHub repository
3. Keep all defaults (Next.js is auto-detected)
4. Click **Deploy**

Your app is live at `https://your-project.vercel.app`

**Every time you push a new `dominios.csv`, Vercel rebuilds automatically.**

---

## Register as a Telegram Mini App

1. Message **@BotFather** on Telegram
2. `/newbot` → follow prompts → save your `BOT_TOKEN`
3. `/newapp` → choose your bot → paste your Vercel URL
4. Optionally create a direct link: `t.me/your_bot/app`

---

## Tech Stack

| Tool | Purpose |
|------|---------|
| Next.js 14 (App Router) | Framework |
| TypeScript | Type safety |
| `@telegram-apps/sdk-react` | Telegram Mini App SDK |
| Vercel | Hosting & CI/CD |
