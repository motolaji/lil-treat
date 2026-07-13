import { brand } from '../../config/brand'

import brandIcon from '../../../export_for_build/assets/liltreat-icon-large.png'
import styles from './QrCodeScanSuccessContent.module.css'

type QrCodeScanSuccessContentProps = {
  collectedCount: number
  vendorName: string
  countId?: string
  className?: string
  iconClassName?: string
  countClassName?: string
  summaryClassName?: string
}

const classNames = (...names: Array<string | false | null | undefined>) =>
  names.filter(Boolean).join(' ')

export function QrCodeScanSuccessContent({
  collectedCount,
  vendorName,
  countId,
  className,
  iconClassName,
  countClassName,
  summaryClassName,
}: QrCodeScanSuccessContentProps) {
  return (
    <div className={classNames(styles.root, className)}>
      <img
        className={classNames(styles.icon, iconClassName)}
        src={brandIcon}
        alt={`${brand.appName} candy icon`}
      />

      <p className={classNames(styles.count, countClassName)} id={countId}>
        +{collectedCount}
      </p>

      <p className={classNames(styles.summary, summaryClassName)}>
        {brand.treatUnitPlural} collected from <strong>{vendorName}</strong>
      </p>
    </div>
  )
}
