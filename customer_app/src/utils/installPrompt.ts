export type InstallPromptOutcome = 'accepted' | 'dismissed' | 'unavailable'

type BeforeInstallPromptChoice = {
  outcome: 'accepted' | 'dismissed'
  platform: string
}

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<BeforeInstallPromptChoice>
}

let deferredPrompt: BeforeInstallPromptEvent | null = null
let isInitialized = false
const availabilitySubscribers = new Set<(isAvailable: boolean) => void>()

const notifyAvailabilitySubscribers = () => {
  const isAvailable = deferredPrompt !== null
  availabilitySubscribers.forEach((subscriber) => {
    subscriber(isAvailable)
  })
}

export function initializeInstallPromptCapture() {
  if (isInitialized || typeof window === 'undefined') {
    return
  }

  isInitialized = true

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    deferredPrompt = event as BeforeInstallPromptEvent
    notifyAvailabilitySubscribers()
  })

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null
    notifyAvailabilitySubscribers()
  })
}

export function subscribeInstallPromptAvailability(
  subscriber: (isAvailable: boolean) => void,
) {
  initializeInstallPromptCapture()
  availabilitySubscribers.add(subscriber)
  subscriber(deferredPrompt !== null)

  return () => {
    availabilitySubscribers.delete(subscriber)
  }
}

export async function promptForInstall(): Promise<InstallPromptOutcome> {
  initializeInstallPromptCapture()

  if (!deferredPrompt) {
    return 'unavailable'
  }

  const promptEvent = deferredPrompt
  deferredPrompt = null
  notifyAvailabilitySubscribers()

  try {
    await promptEvent.prompt()
    const userChoice = await promptEvent.userChoice
    return userChoice.outcome
  } catch {
    return 'unavailable'
  }
}
