import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import QRScanner from '../../components/QRScanner/QRScanner'
import { getOrCreateCard, issueStamp } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import type { ScanResultLocationState } from '../../types/scanResult'

import homeIcon from '../../../export_for_build/icons-pack/home.svg'
import styles from './VendorScanScreen.module.css'

interface MerchantQrPayload {
  type: 'merchant'
  merchant_id?: string
}

export function VendorScanScreen() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [cameraStarted, setCameraStarted] = useState(false)
  const [scanActive, setScanActive] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [scanError, setScanError] = useState<string | null>(null)

  const goHome = () => {
    navigate('/', { replace: true })
  }

  async function handleScanResult(text: string) {
    if (!user || processing) return
    setScanError(null)
    setScanActive(false)

    let payload: MerchantQrPayload
    try {
      payload = JSON.parse(text)
    } catch {
      setScanError('Unrecognised QR code. Point at a vendor QR.')
      setScanActive(true)
      return
    }

    if (payload.type !== 'merchant' || !payload.merchant_id) {
      setScanError("Not a vendor QR. Point at the QR on the vendor's screen.")
      setScanActive(true)
      return
    }

    setProcessing(true)
    const card = await getOrCreateCard(user.id, payload.merchant_id)
    if (!card) {
      setProcessing(false)
      setScanError('Could not connect to server. Check your connection.')
      setScanActive(true)
      return
    }

    const startingCount = card.stamps_current
    const result = await issueStamp(card.id, startingCount, payload.merchant_id, user.id)
    setProcessing(false)

    if (result === null) {
      setScanError('Failed to record treat. Try again.')
      setScanActive(true)
      return
    }

    const scanResult: ScanResultLocationState = {
      merchantId: payload.merchant_id,
      vendorName: card.merchants?.name ?? 'Vendor',
      collectedCount: result.newCount - startingCount,
    }

    navigate('/qr-code-scan-prompt-login', { state: scanResult, replace: true })
  }

  function startCamera() {
    setCameraStarted(true)
    setScanActive(true)
  }

  return (
    <main className={styles.screen}>
      <header className={styles.header}>
        <button className={styles.homeButton} type="button" aria-label="Go home" onClick={goHome}>
          <img src={homeIcon} alt="" aria-hidden="true" className={styles.homeIcon} />
        </button>
        <h1 className={styles.title}>SCAN VENDOR QR CODE</h1>
      </header>

      {!cameraStarted ? (
        <button className={styles.startButton} type="button" onClick={startCamera}>
          Start camera
        </button>
      ) : (
        <QRScanner active={scanActive} onResult={handleScanResult} onError={(e) => setScanError(e.message)} />
      )}

      {processing ? (
        <div className={styles.processing}>
          <p className={styles.processingText}>Working…</p>
        </div>
      ) : null}

      {scanError ? (
        <div className={styles.errorBox}>
          <p className={styles.errorText}>{scanError}</p>
        </div>
      ) : null}
    </main>
  )
}
