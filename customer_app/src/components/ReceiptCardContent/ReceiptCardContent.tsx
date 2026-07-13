import styles from './ReceiptCardContent.module.css'

type ReceiptCardContentProps = {
  purchaseDate: string
  collectedCount: number
  amountSpent: string
  treatUnitLabel: string
}

export function ReceiptCardContent({
  purchaseDate,
  collectedCount,
  amountSpent,
  treatUnitLabel,
}: ReceiptCardContentProps) {
  return (
    <dl className={styles.detailsList}>
      <div className={styles.detailRow}>
        <dt className={styles.detailLabel}>Date:</dt>
        <dd className={styles.detailValue}>{purchaseDate}</dd>
      </div>

      <div className={styles.detailRow}>
        <dt className={styles.detailLabel}>{treatUnitLabel}:</dt>
        <dd className={styles.detailValue}>{collectedCount}</dd>
      </div>

      <div className={styles.detailRow}>
        <dt className={styles.detailLabel}>Amount Spent:</dt>
        <dd className={styles.detailValue}>{amountSpent}</dd>
      </div>
    </dl>
  )
}
