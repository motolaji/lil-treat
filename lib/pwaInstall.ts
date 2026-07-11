export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// beforeinstallprompt fires once, early — before any component that wants to
// react to it (e.g. a post-earn nudge shown minutes later) has mounted. This
// module-level store holds the captured event so it isn't lost.
let deferredPrompt: BeforeInstallPromptEvent | null = null;

export function setDeferredInstallPrompt(e: BeforeInstallPromptEvent | null): void {
  deferredPrompt = e;
}

export function getDeferredInstallPrompt(): BeforeInstallPromptEvent | null {
  return deferredPrompt;
}

export function clearDeferredInstallPrompt(): void {
  deferredPrompt = null;
}
