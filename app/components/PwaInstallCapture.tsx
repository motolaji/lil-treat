'use client';

import { useEffect } from 'react';
import { setDeferredInstallPrompt, BeforeInstallPromptEvent } from '../../lib/pwaInstall';

// Mounted once at the app root — beforeinstallprompt only fires once, early,
// so it must be captured here and held for whenever a nudge wants to use it.
export default function PwaInstallCapture() {
  useEffect(() => {
    function handler(e: Event) {
      e.preventDefault();
      setDeferredInstallPrompt(e as BeforeInstallPromptEvent);
    }
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  return null;
}
