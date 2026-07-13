import { Navigate, useLocation, useNavigate } from 'react-router-dom'

import { OnPagePromptCard } from '../../components/OnPagePromptCard'
import { QrCodeScanSuccessContent } from '../../components/QrCodeScanSuccessContent'
import { brand } from '../../config/brand'
import type { ScanResultLocationState } from '../../types/scanResult'
import { isAppInstalledForCurrentUser } from '../../utils/appInstallState'

import brandIcon from '../../../export_for_build/assets/liltreat-icon-large.png'
import styles from './QrCodeScanPromptInstallScreen.module.css'

const homePath = '/'
const installPath = '/install'

type InstallScreenLocationState = {
  autoPrompt?: boolean
}

export function QrCodeScanPromptInstallScreen() {
  const navigate = useNavigate()
  const location = useLocation()
  const scanResult = (location.state as ScanResultLocationState | null) ?? undefined
  const isInstalled = isAppInstalledForCurrentUser()

  if (!scanResult || scanResult.collectedCount <= 0 || isInstalled) {
    return <Navigate to={homePath} replace />
  }

  const goHome = () => {
    navigate(homePath, { replace: true })
  }

  const goToInstallScreen = () => {
    navigate(installPath, {
      replace: true,
      state: { autoPrompt: true } satisfies InstallScreenLocationState,
    })
  }

  return (
    <main className={styles.screen}>
      <header className={styles.header}>
        <span className={styles.headerSpacer} aria-hidden="true" />
        <h1 className={styles.headerTitle}>TREAT COLLECTED</h1>
        <button
          className={styles.homeButton}
          type="button"
          aria-label={`Go to ${brand.appName} home`}
          onClick={goHome}
        >
          <img className={styles.homeIcon} src={brandIcon} alt="" aria-hidden="true" />
        </button>
      </header>

      <section className={styles.content} aria-labelledby="treat-collected-count">
        <QrCodeScanSuccessContent
          collectedCount={scanResult.collectedCount}
          vendorName={scanResult.vendorName}
          countId="treat-collected-count"
        />

        <OnPagePromptCard
          title="ADD APP SHORTCUT"
          titleId="add-app-shortcut-title"
          cardClassName={styles.promptCard}
          bodyClassName={styles.promptBody}
          primaryActionLabel="Install Now"
          onPrimaryAction={goToInstallScreen}
          secondaryActionLabel="Skip For Now"
          onSecondaryAction={goHome}
        >
          <p className={styles.promptText}>
            To add the app shortcut to your screen, tap Install now and we will try to
            automatically add it for you.
          </p>
          <p className={styles.promptText}>
            Note that for some phones, manual steps may still be required on the next screen.
          </p>
        </OnPagePromptCard>
      </section>
    </main>
  )
}
