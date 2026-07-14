import { ActionModal } from '../ActionModal'
import { brand } from '../../config/brand'
import { formatTreats } from '../../lib/format'

import styles from './LogoutConfirmModal.module.css'

type LogoutConfirmModalProps = {
  isOpen: boolean
  collectedTreatCount: number
  visitedVendorCount: number
  onClose: () => void
  onConfirmLogout: () => void
}

export function LogoutConfirmModal({
  isOpen,
  collectedTreatCount,
  visitedVendorCount,
  onClose,
  onConfirmLogout,
}: LogoutConfirmModalProps) {
  return (
    <ActionModal
      isOpen={isOpen}
      title="LOGOUT"
      onClose={onClose}
      primaryActionLabel="Logout"
      onPrimaryAction={onConfirmLogout}
      secondaryActionLabel="Back to App"
    >
      <div className={styles.content}>
        <p className={styles.summary}>
          You currently have <strong>{formatTreats(collectedTreatCount)}</strong>{' '}
          {brand.treatUnitPlural} collected across <strong>{visitedVendorCount}</strong>{' '}
          vendors on this account.
        </p>

        <section className={styles.warningBlock} aria-label="Logout warning">
          <p className={styles.warningTitle}>Before you log out</p>
          <p className={styles.warningText}>
            Any new {brand.treatUnitPlural} you collect while logged out will not be added to this
            account unless you sign back in first.
          </p>
        </section>
      </div>
    </ActionModal>
  )
}
