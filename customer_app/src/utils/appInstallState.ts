import { isAppInstalled } from './installState'
import { isStandaloneApp } from './device'

export function isAppInstalledForCurrentUser() {
  return isStandaloneApp() || isAppInstalled()
}
