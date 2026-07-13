export type DevicePlatform = 'android' | 'ios' | 'other'

type NavigatorWithPlatformHints = Navigator & {
  standalone?: boolean
  userAgentData?: {
    platform?: string
  }
}

export function getDevicePlatform(): DevicePlatform {
  if (typeof navigator === 'undefined') {
    return 'other'
  }

  const navigatorWithHints = navigator as NavigatorWithPlatformHints
  const hintedPlatform = navigatorWithHints.userAgentData?.platform?.toLowerCase() ?? ''

  if (hintedPlatform.includes('android')) {
    return 'android'
  }

  if (hintedPlatform.includes('ios')) {
    return 'ios'
  }

  const userAgent = navigator.userAgent.toLowerCase()

  if (userAgent.includes('android')) {
    return 'android'
  }

  const isAppleMobileDevice =
    /iphone|ipad|ipod/.test(userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

  return isAppleMobileDevice ? 'ios' : 'other'
}

export function isStandaloneApp(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false
  }

  const navigatorWithHints = navigator as NavigatorWithPlatformHints

  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    navigatorWithHints.standalone === true
  )
}
