import { brand } from '../config/brand'
import type { DevicePlatform } from '../utils/device'

export type InstallStep = {
  id: string
  emphasis: string
  remainder: string
}

export type InstallGuide = {
  deviceBadgeLabel: string
  stepsTitle: string
  stepsDescription: string
  steps: InstallStep[]
  tipsTitle: string
  tipsDescription: string
  tips: InstallStep[]
}

const androidGuide: InstallGuide = {
  deviceBadgeLabel: 'Android detected',
  stepsTitle: `Add ${brand.appName} on Android`,
  stepsDescription: `Save ${brand.appName} to your home screen so it opens more like an app the next time you need it.`,
  steps: [
    {
      id: 'android-menu',
      emphasis: 'Open the browser menu',
      remainder: 'Tap the three-dot browser menu, usually in the top-right corner.',
    },
    {
      id: 'android-install',
      emphasis: 'Choose Install app',
      remainder: 'If you see Add to Home screen instead, that works too.',
    },
    {
      id: 'android-confirm',
      emphasis: 'Confirm the install',
      remainder: `Tap Install or Add and ${brand.appName} will appear on your home screen.`,
    },
  ],
  tipsTitle: 'If Android does not show an install option',
  tipsDescription: 'The wording can vary a little from browser to browser.',
  tips: [
    {
      id: 'android-tip-chrome',
      emphasis: 'Try Chrome first',
      remainder: 'Chrome usually shows the clearest Install app or Add to Home screen option.',
    },
    {
      id: 'android-tip-refresh',
      emphasis: 'Reload this page once',
      remainder: 'Some browsers do not offer the shortcut option until the page has fully loaded.',
    },
    {
      id: 'android-tip-fallback',
      emphasis: 'Use the manual add option',
      remainder: 'Even without a full install prompt, most Android browsers can still save a shortcut to your home screen.',
    },
  ],
}

const iosGuide: InstallGuide = {
  deviceBadgeLabel: 'iPhone / iPad detected',
  stepsTitle: `Add ${brand.appName} on iPhone or iPad`,
  stepsDescription: `On iOS, ${brand.appName} is usually added from Safari's share menu.`,
  steps: [
    {
      id: 'ios-share',
      emphasis: 'Open the Share menu in Safari',
      remainder: 'Tap the Share button at the bottom or top of the screen.',
    },
    {
      id: 'ios-home-screen',
      emphasis: 'Choose Add to Home Screen',
      remainder: 'Scroll the actions list until you find Add to Home Screen.',
    },
    {
      id: 'ios-confirm',
      emphasis: 'Tap Add',
      remainder: `${brand.appName} will be saved to your home screen as an app shortcut.`,
    },
  ],
  tipsTitle: 'If iPhone or iPad does not show the option',
  tipsDescription: 'The install shortcut is usually available from Safari rather than other iOS browsers.',
  tips: [
    {
      id: 'ios-tip-safari',
      emphasis: 'Open the page in Safari',
      remainder: 'Add to Home Screen is most reliable from Safari on iPhone and iPad.',
    },
    {
      id: 'ios-tip-scroll',
      emphasis: 'Scroll the share actions',
      remainder: 'The Add to Home Screen action may be lower in the Share sheet list.',
    },
    {
      id: 'ios-tip-installed',
      emphasis: 'Check your home screen first',
      remainder: `If ${brand.appName} is already there, you can launch it directly from the icon.`,
    },
  ],
}

const fallbackGuide: InstallGuide = {
  deviceBadgeLabel: 'Device not detected',
  stepsTitle: `Install ${brand.appName} on a phone`,
  stepsDescription: `If you are on Android or iPhone, use the browser menu to install or add ${brand.appName} to your home screen.`,
  steps: [
    {
      id: 'fallback-open-mobile',
      emphasis: 'Open this page on your phone',
      remainder: 'The install flow works best on Android phones and iPhones.',
    },
    {
      id: 'fallback-menu',
      emphasis: 'Look for Install app or Add to Home Screen',
      remainder: 'That option is usually inside the browser menu or share menu.',
    },
    {
      id: 'fallback-confirm',
      emphasis: 'Confirm the shortcut or install',
      remainder: `${brand.appName} should then appear on your home screen for faster access.`,
    },
  ],
  tipsTitle: 'If you still cannot install it',
  tipsDescription: 'A shortcut may not be available on every device or browser.',
  tips: [
    {
      id: 'fallback-tip-supported',
      emphasis: 'Try a supported mobile browser',
      remainder: 'Safari on iPhone/iPad and Chrome on Android usually work best for saving the app.',
    },
    {
      id: 'fallback-tip-bookmark',
      emphasis: 'Bookmark the page for now',
      remainder: `You can still save ${brand.appName} in your browser even when an install shortcut is unavailable.`,
    },
  ],
}

export function getInstallGuide(platform: DevicePlatform): InstallGuide {
  if (platform === 'android') {
    return androidGuide
  }

  if (platform === 'ios') {
    return iosGuide
  }

  return fallbackGuide
}
