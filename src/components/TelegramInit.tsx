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
        // Running outside Telegram — graceful degradation
        console.info('Telegram SDK: running outside Telegram environment', err);
      }
    }).catch(() => {
      console.info('Telegram SDK not available');
    });
  }, []);

  return null;
}
