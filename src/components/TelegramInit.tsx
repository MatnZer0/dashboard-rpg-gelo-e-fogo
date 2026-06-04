'use client';

import { useEffect } from 'react';

export default function TelegramInit() {
  useEffect(() => {
    // Telegram Desktop WebView captures wheel events before they reach the page,
    // breaking normal mouse scroll. Forward them manually.
    const handleWheel = (e: WheelEvent) => {
      window.scrollBy({ top: e.deltaY, behavior: 'instant' });
    };
    window.addEventListener('wheel', handleWheel, { passive: true });

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
        // Running outside Telegram — graceful degradation
        console.info('Telegram SDK: running outside Telegram environment', err);
      }
    }).catch(() => {
      console.info('Telegram SDK not available');
    });

    return () => window.removeEventListener('wheel', handleWheel);
  }, []);

  return null;
}