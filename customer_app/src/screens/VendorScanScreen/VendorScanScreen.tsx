import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import QRScanner from '../../components/QRScanner/QRScanner'
import { getOrCreateCard, issueStamp, type EarnLineItem } from '../../lib/supabase'
import { getInventoryItems, sellQty } from '../../lib/inventory'
import { isExpired } from '../../lib/qrExpiry'
import { useAuth } from '../../context/AuthContext'
import type { ScanResultLocationState } from '../../types/scanResult'

import homeIcon from '../../../export_for_build/icons-pack/home.svg'
import styles from './VendorScanScreen.module.css'

interface MerchantQrPayload {
  type: 'merchant'
  merchant_id?: string
}

interface SalePayload {
  type: 'sale'
  merchant_id?: string
  line_items?: EarnLineItem[]
  exp?: number
}

type ScanPayload = MerchantQrPayload | SalePayload

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

    let payload: ScanPayload
    try {
      payload = JSON.parse(text)
    } catch {
      setScanError('Unrecognised QR code. Point at a vendor QR.')
      setScanActive(true)
      return
    }

    if (payload.type === 'sale') {
      const merchantId = payload.merchant_id
      const lineItems = payload.line_items
      if (!merchantId || !lineItems || lineItems.length === 0) {
        setScanError("Not a vendor QR. Point at the QR on the vendor's screen.")
        setScanActive(true)
        return
      }
      if (isExpired(payload)) {
        setScanError('This QR has expired — ask the vendor to generate a new one.')
        setScanActive(true)
        return
      }

      setProcessing(true)
      const card = await getOrCreateCard(user.id, merchantId)
      if (!card) {
        setProcessing(false)
        setScanError('Could not connect to server. Check your connection.')
        setScanActive(true)
        return
      }

      const startingCount = card.stamps_current
      const result = await issueStamp(card.id, startingCount, merchantId, user.id, { lineItems })
      setProcessing(false)

      if (result === null) {
        setScanError('Failed to record treat. Try again.')
        setScanActive(true)
        return
      }

      // Best-effort stock decrement, mirrors vendor_app's ScanScreen — a
      // failure here doesn't undo the already-issued treats. sellQty needs
      // each item's *current* stock_qty, which isn't in the QR payload, so
      // fetch a fresh snapshot of the merchant's inventory first.
      const currentItems = await getInventoryItems(merchantId)
      await Promise.all(
        lineItems.map((li) => {
          const currentQty = currentItems.find((item) => item.id === li.inventory_item_id)?.stock_qty ?? 0
          return sellQty(li.inventory_item_id, merchantId, currentQty, li.qty)
        }),
      )

      const scanResult: ScanResultLocationState = {
        merchantId,
        vendorName: card.merchants?.name ?? 'Vendor',
        collectedCount: result.newCount - startingCount,
      }

      navigate('/qr-code-scan-prompt-login', { state: scanResult, replace: true })
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
