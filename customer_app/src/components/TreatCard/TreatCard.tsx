import chevronIcon from '../../../export_for_build/assets/right-infill-chevron.svg'

import { TreatCardContent } from '../TreatCardContent'
import {
  VendorCardLayout,
  getCardProgressPercent,
  type CardBackground,
} from '../VendorCardLayout'
import styles from './TreatCard.module.css'

type TreatCardProps = {
  vendorName: string
  logoSrc: string
  logoAlt: string
  collectedCount: number
  requiredCount: number
  treatUnitLabel: string
  expiryText?: string
  actionLabel: string
  background: CardBackground
  locationText?: string
  locationIconSrc?: string
  onAction?: () => void
}

export function TreatCard({
  vendorName,
  logoSrc,
  logoAlt,
  collectedCount,
  requiredCount,
  treatUnitLabel,
  expiryText,
  actionLabel,
  background,
  locationText,
  locationIconSrc,
  onAction,
}: TreatCardProps) {
  const progressPercent = getCardProgressPercent(collectedCount, requiredCount)

  return (
    <VendorCardLayout
      title={vendorName}
      logoSrc={logoSrc}
      logoAlt={logoAlt}
      actionLabel={actionLabel}
      onAction={onAction}
      background={background}
      progressPercent={progressPercent}
      buttonAriaLabel={`${actionLabel} for ${vendorName}`}
      headerAdornment={
        <span
          className={styles.chevronIcon}
          aria-hidden="true"
          style={{
            WebkitMaskImage: `url(${chevronIcon})`,
            maskImage: `url(${chevronIcon})`,
          }}
        />
      }
    >
      <TreatCardContent
        collectedCount={collectedCount}
        requiredCount={requiredCount}
        treatUnitLabel={treatUnitLabel}
        background={background}
        progressPercent={progressPercent}
        expiryText={expiryText}
        locationText={locationText}
        locationIconSrc={locationIconSrc}
        progressAriaLabel={`${vendorName} progress`}
      />
    </VendorCardLayout>
  )
}
