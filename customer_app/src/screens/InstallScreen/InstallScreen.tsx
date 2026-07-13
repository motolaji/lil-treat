import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { HelpTopicCard } from '../../components/HelpTopicCard'
import { brand } from '../../config/brand'
import { getInstallGuide } from '../../mocks/install'
import { setAppInstalled } from '../../utils/installState'
import { isAppInstalledForCurrentUser } from '../../utils/appInstallState'
import { getDevicePlatform, type DevicePlatform } from '../../utils/device'
import {
  promptForInstall,
  subscribeInstallPromptAvailability,
  type InstallPromptOutcome,
} from '../../utils/installPrompt'

import backIcon from '../../../export_for_build/icons-pack/back.svg'
import downloadIcon from '../../../export_for_build/icons-pack/download(1).svg'
import candyIcon from '../../../export_for_build/assets/liltreat-icon-large.png'
import styles from './InstallScreen.module.css'

type InstallStatusCopy = {
  title: string
  description: string
  note: string
}

type InstallLocationState = {
  autoPrompt?: boolean
}

const getInstallStatusCopy = (
  platform: DevicePlatform,
  isInstalled: boolean,
  canPromptInstall: boolean,
): InstallStatusCopy => {
  if (isInstalled) {
    return {
      title: `${brand.appName} is already on this device`,
      description: `This device is already opening ${brand.appName} like an app.`,
      note: `Look for the ${brand.appName} icon on your home screen the next time you want to open it quickly.`,
    }
  }

  if (canPromptInstall) {
    return {
      title: `Install ${brand.appName} automatically`,
      description: `Your device is ready to add ${brand.appName} straight from this screen.`,
      note: 'Tap Install now and confirm the browser prompt to finish adding it.',
    }
  }

  if (platform === 'ios') {
    return {
      title: `Add ${brand.appName} to your home screen`,
      description: `On iPhone and iPad, ${brand.appName} is usually added from Safari's Share menu.`,
      note: 'Follow the steps below. This works best when the page is open in Safari.',
    }
  }

  if (platform === 'android') {
    return {
      title: `Add ${brand.appName} to your home screen`,
      description: `We just tried to show you an installation prompt for ${brand.appName}.`,
      note: 'If you did not see an automatic install prompt, use the manual steps below instead.',
    }
  }

  return {
    title: `Install ${brand.appName} on your phone`,
    description: `We could not confidently detect an Android or iPhone device, so we are showing the general mobile steps.`,
    note: 'If possible, open this page on your phone and follow the matching Add to Home Screen or Install App flow.',
  }
}

const getPromptFeedback = (outcome: InstallPromptOutcome) => {
  if (outcome === 'accepted') {
    return `${brand.appName} is being added to your device.`
  }

  if (outcome === 'dismissed') {
    return 'Install prompt dismissed. You can still use the manual steps below at any time.'
  }

  return 'Automatic install is not available right now. Please use the manual steps below instead.'
}

export function InstallScreen() {
  const navigate = useNavigate()
  const location = useLocation()
  const installState = (location.state as InstallLocationState | null) ?? null
  const [platform, setPlatform] = useState<DevicePlatform>('other')
  const [isInstalled, setIsInstalled] = useState(false)
  const [canPromptInstall, setCanPromptInstall] = useState(false)
  const [promptFeedback, setPromptFeedback] = useState<string | null>(null)
  const [hasAttemptedAutoPrompt, setHasAttemptedAutoPrompt] = useState(false)

  useEffect(() => {
    setPlatform(getDevicePlatform())
    setIsInstalled(isAppInstalledForCurrentUser())

    const unsubscribe = subscribeInstallPromptAvailability(setCanPromptInstall)
    const mediaQuery = window.matchMedia('(display-mode: standalone)')
    const legacyMediaQuery = mediaQuery as MediaQueryList & {
      addListener?: (listener: (event: MediaQueryListEvent) => void) => void
      removeListener?: (listener: (event: MediaQueryListEvent) => void) => void
    }
    const handleDisplayModeChange = () => {
      setIsInstalled(isAppInstalledForCurrentUser())
    }
    const handleAppInstalled = () => {
      setAppInstalled(true)
      setIsInstalled(true)
    }

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleDisplayModeChange)
    } else {
      legacyMediaQuery.addListener?.(handleDisplayModeChange)
    }

    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      unsubscribe()

      if (typeof mediaQuery.removeEventListener === 'function') {
        mediaQuery.removeEventListener('change', handleDisplayModeChange)
      } else {
        legacyMediaQuery.removeListener?.(handleDisplayModeChange)
      }

      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const installGuide = useMemo(() => getInstallGuide(platform), [platform])
  const installStatusCopy = useMemo(
    () => getInstallStatusCopy(platform, isInstalled, canPromptInstall),
    [platform, isInstalled, canPromptInstall],
  )

  const handleInstallAttempt = useCallback(async () => {
    const outcome = await promptForInstall()
    setPromptFeedback(getPromptFeedback(outcome))

    if (outcome === 'accepted') {
      setAppInstalled(true)
      setIsInstalled(true)
    }
  }, [])

  useEffect(() => {
    if (
      !installState?.autoPrompt ||
      hasAttemptedAutoPrompt ||
      isInstalled ||
      !canPromptInstall
    ) {
      return
    }

    setHasAttemptedAutoPrompt(true)
    void handleInstallAttempt()
  }, [canPromptInstall, handleInstallAttempt, hasAttemptedAutoPrompt, installState?.autoPrompt, isInstalled])

  const goHome = () => {
    navigate('/', { replace: true })
  }

  return (
    <main className={styles.screen}>
      <header className={styles.header}>
        <button
          className={styles.headerButton}
          type="button"
          aria-label="Back to home"
          onClick={goHome}
        >
          <img className={styles.backIcon} src={backIcon} alt="" aria-hidden="true" />
        </button>

        <h1 className={styles.headerTitle}>INSTALL</h1>

        <button
          className={styles.headerButton}
          type="button"
          aria-label={`Go to ${brand.appName} home`}
          onClick={goHome}
        >
          <img className={styles.homeIcon} src={candyIcon} alt="" aria-hidden="true" />
        </button>
      </header>

      <section className={styles.contentSection} aria-labelledby="install-screen-title">
        <div className={styles.contentInner}>
          <div className={styles.sectionHeading}>
            <h2 className={styles.commonHeading} id="install-screen-title">
              Install {brand.appName}
            </h2>
            <span className={styles.sectionDivider} aria-hidden="true" />
          </div>

          <div className={styles.topicStack}>
            <HelpTopicCard
              markerLabel="1"
              title={installStatusCopy.title}
              description={installStatusCopy.description}
              action={
                canPromptInstall && !isInstalled ? (
                  <button
                    className={styles.actionPill}
                    type="button"
                    aria-label={`Install ${brand.appName} now`}
                    onClick={handleInstallAttempt}
                  >
                    <span>Install now</span>
                    <img className={styles.actionIcon} src={downloadIcon} alt="" aria-hidden="true" />
                  </button>
                ) : undefined
              }
            >
              <div className={styles.statusDetails}>
                <span className={styles.deviceBadge}>{installGuide.deviceBadgeLabel}</span>
                <p className={styles.noteText}>{installStatusCopy.note}</p>
                {promptFeedback ? <p className={styles.feedbackText}>{promptFeedback}</p> : null}
              </div>
            </HelpTopicCard>

            <span className={styles.topicDivider} aria-hidden="true" />

            <HelpTopicCard
              markerLabel="2"
              title={installGuide.stepsTitle}
              description={installGuide.stepsDescription}
            >
              <ol className={styles.stepsList}>
                {installGuide.steps.map((step, index) => (
                  <li className={styles.stepItem} key={step.id}>
                    <span className={styles.stepNumber}>{index + 1}.</span>
                    <p className={styles.stepText}>
                      <strong>{step.emphasis}</strong> {step.remainder}
                    </p>
                  </li>
                ))}
              </ol>
            </HelpTopicCard>

            <span className={styles.topicDivider} aria-hidden="true" />

            <HelpTopicCard
              markerLabel="3"
              title={installGuide.tipsTitle}
              description={installGuide.tipsDescription}
            >
              <ol className={styles.tipsList}>
                {installGuide.tips.map((tip, index) => (
                  <li className={styles.tipItem} key={tip.id}>
                    <span className={styles.tipNumber}>{index + 1}.</span>
                    <p className={styles.tipText}>
                      <strong>{tip.emphasis}</strong> {tip.remainder}
                    </p>
                  </li>
                ))}
              </ol>
            </HelpTopicCard>
          </div>
        </div>
      </section>
    </main>
  )
}
