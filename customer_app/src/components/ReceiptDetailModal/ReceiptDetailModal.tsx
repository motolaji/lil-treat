import { type ReceiptView } from '../../types/receipt'

import { ActionModal } from '../ActionModal'
import { formatTreats } from '../../lib/format'
import styles from './ReceiptDetailModal.module.css'

type ReceiptDetailModalProps = {
  receipt: ReceiptView
  treatUnitColumnLabel: string
  onClose: () => void
}

export function ReceiptDetailModal({ receipt, treatUnitColumnLabel, onClose }: ReceiptDetailModalProps) {
  return (
    // Gated by nullable *data* (a selected receipt) at the call site, not a
    // plain boolean — parent-unmounted like before rather than kept alive for
    // an exit animation. isOpen is always true here; entrance animation still
    // plays, exit is instant as it was previously.
    <ActionModal isOpen title={`RECEIPT FOR ${receipt.purchaseDate}`} onClose={onClose} primaryActionLabel="CLOSE">
      <div className={styles.metaBlock}>
        <p className={styles.metaLine}>
          <span className={styles.metaLabel}>Vendor Name:</span> {receipt.vendorDisplayName}
        </p>
        <p className={styles.metaLine}>
          <span className={styles.metaLabel}>Date:</span> {receipt.purchaseDateLong}
        </p>
        <p className={styles.metaLine}>
          <span className={styles.metaLabel}>Time:</span> {receipt.purchaseTime}
        </p>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table} aria-label={`Receipt items from ${receipt.vendorDisplayName}`}>
          <colgroup>
            <col />
            <col className={styles.costColumn} />
            <col className={styles.treatColumn} />
          </colgroup>
          <thead>
            <tr>
              <th className={styles.headerCell} scope="col">
                ITEM
              </th>
              <th className={styles.headerCell} scope="col">
                COST
              </th>
              <th className={styles.headerCell} scope="col">
                {treatUnitColumnLabel}
              </th>
            </tr>
          </thead>
          <tbody>
            {receipt.items.map((item) => (
              <tr className={styles.row} key={item.id}>
                <td className={styles.itemCell}>
                  <span className={styles.itemNameWrap}>
                    <span className={styles.itemBullet} aria-hidden="true" />
                    <span className={styles.itemName}>{item.qty > 1 ? `${item.qty} × ${item.name}` : item.name}</span>
                  </span>
                </td>
                <td className={styles.valueCell}>{item.cost}</td>
                <td className={styles.valueCell}>{formatTreats(item.treatCount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ActionModal>
  )
}
