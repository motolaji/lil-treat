import { useEffect, useState } from 'react'

import { ActionModal } from '../ActionModal'
import QRDisplay from '../QRDisplay/QRDisplay'
import { withExpiry } from '../../lib/qrExpiry'
import { formatTreats } from '../../lib/format'

import styles from './RedeemTreatModal.module.css'

type RedeemTreatModalProps = {
  vendorName: string
  rewardName: string
  treatCost: number
  treatUnitPlural: string
  loyaltyCardId: string
  userId: string
  merchantId: string
  rewardId: string
  onClose: () => void
  onDone?: () => void
  onExit?: () => void
}

export function RedeemTreatModal({
  vendorName,
  rewardName,
  treatCost,
  treatUnitPlural,
  loyaltyCardId,
  userId,
  merchantId,
  rewardId,
  onClose,
  onDone,
  onExit,
}: RedeemTreatModalProps) {
  const [payload, setPayload] = useState('')

  // Regenerate periodically so leaving the modal open doesn't let the QR go
  // stale — only a screenshotted/exported copy expires (see lib/qrExpiry.ts).
  // This exact shape is what vendor_app's ScanScreen already parses via
  // redeemReward — no changes needed on that side.
  useEffect(() => {
    function refresh() {
      setPayload(JSON.stringify(withExpiry({
        type: 'redeem',
        loyalty_card_id: loyaltyCardId,
        user_id: userId,
        merchant_id: merchantId,
        reward_id: rewardId,
      })))
    }

    refresh()
    const interval = setInterval(refresh, 60_000)
    return () => clearInterval(interval)
  }, [loyaltyCardId, userId, merchantId, rewardId])

  return (
    // This modal is gated by nullable *data* (a selected reward) at the call
    // site, not a plain boolean — so it's parent-unmounted like before rather
    // than kept alive for an exit animation (which would need the reward data
    // to survive past the moment it's cleared). isOpen is always true here;
    // entrance animation still plays, exit is instant as it was previously.
    <ActionModal
      isOpen
      title="REDEEM TREAT"
      onClose={onClose}
      primaryActionLabel="Done"
      secondaryActionLabel="Exit"
      onPrimaryAction={onDone}
      onSecondaryAction={onExit}
    >
      <p className={styles.message}>
        Show the below QR code to the <strong>{vendorName}</strong> vendor to redeem your{' '}
        <strong>{rewardName}</strong>. This will cost {formatTreats(treatCost)} {treatUnitPlural}
      </p>

      <div className={styles.qrWrap}>
        {payload ? <QRDisplay value={payload} size={220} /> : null}
      </div>
    </ActionModal>
  )
}
