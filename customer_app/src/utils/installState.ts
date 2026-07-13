// Tracks whether this device/browser has installed the PWA. Not tied to a
// specific user — it's a device-local fact, so localStorage (not Supabase)
// is the right place for it. Replaces the old in-memory mocks/user.ts flag,
// which reset on every reload.
const KEY = 'liltreat_app_installed'

export function isAppInstalled(): boolean {
  return localStorage.getItem(KEY) === 'true'
}

export function setAppInstalled(installed: boolean): void {
  if (installed) {
    localStorage.setItem(KEY, 'true')
  } else {
    localStorage.removeItem(KEY)
  }
}
