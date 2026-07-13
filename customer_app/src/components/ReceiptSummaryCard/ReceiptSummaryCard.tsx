import styles from './ReceiptSummaryCard.module.css'

import { ReceiptCardContent } from '../ReceiptCardContent'
import { VendorCardLayout } from '../VendorCardLayout'

type ReceiptSummaryCardProps = {
  vendorName: string
  logoSrc: string
  logoAlt: string
  purchaseDate: string
  collectedCount: number
  amountSpent: string
  treatUnitLabel: string
  actionLabel: string
  onAction?: () => void
}

export function ReceiptSummaryCard({
  vendorName,
  logoSrc,
  logoAlt,
  purchaseDate,
  collectedCount,
  amountSpent,
  treatUnitLabel,
  actionLabel,
  onAction,
}: ReceiptSummaryCardProps) {
  return (
    <VendorCardLayout
      title={vendorName}
      logoSrc={logoSrc}
      logoAlt={logoAlt}
      actionLabel={actionLabel}
      onAction={onAction}
      background="white"
      headingLevel="h2"
      className={styles.card}
      buttonAriaLabel={`${actionLabel} for ${vendorName}`}
    >
      <ReceiptCardContent
        purchaseDate={purchaseDate}
        collectedCount={collectedCount}
        amountSpent={amountSpent}
        treatUnitLabel={treatUnitLabel}
      />
    </VendorCardLayout>
  )
}
