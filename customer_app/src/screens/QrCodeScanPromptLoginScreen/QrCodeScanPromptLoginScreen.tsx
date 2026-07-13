import { Navigate, useLocation, useNavigate } from 'react-router-dom'

import { OnPagePromptCard } from '../../components/OnPagePromptCard'
import { QrCodeScanSuccessContent } from '../../components/QrCodeScanSuccessContent'
import { brand } from '../../config/brand'
import { useAuth } from '../../context/AuthContext'
import type { ScanResultLocationState } from '../../types/scanResult'
import { isAppInstalledForCurrentUser } from '../../utils/appInstallState'

import cautionIcon from '../../../export_for_build/icons-pack/caution.svg'
import brandIcon from '../../../export_for_build/assets/liltreat-icon-large.png'
import styles from './QrCodeScanPromptLoginScreen.module.css'

const homePath = '/'
const loginPath = '/login'
const qrCodeScanPromptInstallPath = '/qr-code-scan-prompt-install'
const qrCodeScanPromptLoginPath = '/qr-code-scan-prompt-login'

type LoginRedirectState = {
  redirectTo?: string
  redirectState?: ScanResultLocationState
}

export function QrCodeScanPromptLoginScreen() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAnonymous, loading } = useAuth()
  const scanResult = (location.state as ScanResultLocationState | null) ?? undefined
  const isInstalled = isAppInstalledForCurrentUser()
  const showLoginPrompt = isAnonymous

  if (loading) return null

  if (!scanResult || scanResult.collectedCount <= 0) {
    return <Navigate to={homePath} replace />
  }

  if (!isAnonymous && !isInstalled) {
    return (
      <Navigate
        to={qrCodeScanPromptInstallPath}
        replace
        state={scanResult satisfies ScanResultLocationState}
      />
    )
  }

  const goHome = () => {
    navigate(homePath, { replace: true })
  }

  const goToLogin = () => {
    const loginState: LoginRedirectState = {
      redirectTo: qrCodeScanPromptLoginPath,
      redirectState: scanResult,
    }

    navigate(loginPath, {
      replace: true,
      state: loginState,
    })
  }

  const goToInstallPrompt = () => {
    if (isInstalled) {
      goHome()
      return
    }

    navigate(qrCodeScanPromptInstallPath, {
      replace: true,
      state: scanResult satisfies ScanResultLocationState,
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

        {showLoginPrompt ? (
          <OnPagePromptCard
            title="AVOID LOSING TREATS"
            titleId="avoid-losing-treats-title"
            headerIconSrc={cautionIcon}
            cardClassName={styles.promptCard}
            headerClassName={styles.promptHeader}
            iconClassName={styles.promptIcon}
            bodyClassName={styles.promptBody}
            primaryActionLabel="Login"
            onPrimaryAction={goToLogin}
            secondaryActionLabel="Skip For Now"
            onSecondaryAction={goToInstallPrompt}
          >
            <p className={styles.promptText}>
              By default we will try to store all your collected {brand.treatUnitPlural} directly
              in your browser.
            </p>

            <p className={styles.promptText}>
              However, your phone can decide to clear all your {brand.treatUnitPlural} at any
              time. To avoid this we recommend that you login to avoid losing your hard earned{' '}
              {brand.treatUnitPlural}.
            </p>
          </OnPagePromptCard>
        ) : null}
      </section>
    </main>
  )
}
