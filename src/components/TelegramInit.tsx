'use client';

import { useEffect } from 'react';

export default function TelegramInit() {
  useEffect(() => {
    // Dynamically import to avoid SSR issues
    import('@telegram-apps/sdk-react').then(({ init, miniApp, backButton }) => {
      try {
        init();
        if (miniApp.mountSync.isAvailable()) {
          miniApp.mountSync();
        }
        if (backButton.mount.isAvailable()) {
          backButton.mount();
          backButton.hide();
        }
      } catch (err) {
        console.info('Telegram SDK: running outside Telegram environment', err);
      }
    }).catch(() => {
      console.info('Telegram SDK not available');
    });

    // Telegram Desktop WebView identifies itself with this user agent string.
    // Only apply the wheel fix inside Telegram — not on Vercel or mobile.
    const isTelegramDesktop = navigator.userAgent.includes('TelegramDesktop');
    if (!isTelegramDesktop) return;

    // Telegram Desktop intercepts wheel events at the app level before they
    // reach the WebView's scroll container. We stop propagation and manually
    // scroll instead, which bypasses Telegram's interception.
    const handleWheel = (e: WheelEvent) => {
      e.stopPropagation();
      window.scrollBy({ top: e.deltaY, left: e.deltaX, behavior: 'instant' });
    };
    window.addEventListener('wheel', handleWheel, { capture: true });

    return () => window.removeEventListener('wheel', handleWheel, { capture: true });
  }, []);

  return null;
}