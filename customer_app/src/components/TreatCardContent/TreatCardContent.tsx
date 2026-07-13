import { TreatProgress } from '../TreatProgress'
import { type CardBackground } from '../VendorCardLayout'
import styles from './TreatCardContent.module.css'

type TreatCardContentProps = {
  collectedCount: number
  requiredCount: number
  treatUnitLabel: string
  background: CardBackground
  progressPercent?: number
  expiryText?: string
  locationText?: string
  locationIconSrc?: string
  progressAriaLabel: string
}

export function TreatCardContent({
  collectedCount,
  requiredCount,
  treatUnitLabel,
  background,
  progressPercent,
  expiryText,
  locationText,
  locationIconSrc,
  progressAriaLabel,
}: TreatCardContentProps) {
  return (
    <>
      {locationText ? (
        <p className={styles.locationRow}>
          {locationIconSrc ? (
            <img className={styles.locationIcon} src={locationIconSrc} alt="" aria-hidden="true" />
          ) : null}
          <span>{locationText}</span>
        </p>
      ) : null}

      <TreatProgress
        className={styles.progressBlock}
        metricsClassName={styles.metrics}
        trackClassName={styles.progressTrack}
        currentCount={collectedCount}
        requiredCount={requiredCount}
        label={treatUnitLabel}
        background={background}
        progressPercent={progressPercent}
        ariaLabel={progressAriaLabel}
      />

      {expiryText ? <p className={styles.expiryText}>{expiryText}</p> : null}
    </>
  )
}
