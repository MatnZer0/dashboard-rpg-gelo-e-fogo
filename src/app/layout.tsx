import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import './globals.css';

const TelegramInit = dynamic(() => import('@/components/TelegramInit'), { ssr: false });

export const metadata: Metadata = {
  title: 'Dashboard RPG G&F',
  description: 'Painel de administração de domínios — RPG G&F',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="color-scheme" content="dark" />
        {/* Telegram Mini Apps meta */}
        <meta name="telegram-mini-app" content="true" />
      </head>
      <body>
        <TelegramInit />
        {children}
      </body>
    </html>
  );
}
