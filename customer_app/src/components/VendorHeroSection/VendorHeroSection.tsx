import backIcon from '../../../export_for_build/icons-pack/back.svg'
import clockIcon from '../../../export_for_build/icons-pack/clock.svg'
import cookieJarIcon from '../../../export_for_build/icons-pack/cookie-jar-infill.svg'
import externalLinkIcon from '../../../export_for_build/icons-pack/external_link.svg'
import locationIcon from '../../../export_for_build/icons-pack/location.svg'
import shoppingStoreIcon from '../../../export_for_build/icons-pack/shopping-store.svg'
import candyIcon from '../../../export_for_build/assets/liltreat-icon-large.png'
import styles from './VendorHeroSection.module.css'

type VendorHeroSectionVendor = {
  displayName: string
  distanceText: string
  collectedCount: number
  validityDays?: number
  expiryDays: number
}

type VendorHeroSectionProps = {
  vendor: VendorHeroSectionVendor
  vendorLogoSrc: string
  vendorLogoAlt: string
  appName: string
  treatUnitPlural: string
  onBack: () => void
  onHome: () => void
}

export function VendorHeroSection({
  vendor,
  vendorLogoSrc,
  vendorLogoAlt,
  appName,
  treatUnitPlural,
  onBack,
  onHome,
}: VendorHeroSectionProps) {
  return (
    <section className={styles.heroSection}>
      <header className={styles.header}>
        <button className={styles.headerButton} type="button" aria-label="Back" onClick={onBack}>
          <img className={styles.headerIcon} src={backIcon} alt="" aria-hidden="true" />
        </button>

        <div className={styles.headerTitleWrap}>
          <img className={styles.vendorTitleIcon} src={shoppingStoreIcon} alt="" aria-hidden="true" />
          <h1 className={styles.headerTitle}>{vendor.displayName}</h1>
        </div>

        <button
          className={styles.headerButton}
          type="button"
          aria-label={`Go to ${appName} home`}
          onClick={onHome}
        >
          <img className={styles.homeIcon} src={candyIcon} alt="" aria-hidden="true" />
        </button>
      </header>

      <div className={styles.heroBody}>
        <div className={styles.logoWrap}>
          <img className={styles.vendorLogo} src={vendorLogoSrc} alt={vendorLogoAlt} />
        </div>

        <div className={styles.detailsColumn}>
          <p className={styles.locationRow}>
            <img className={styles.detailIcon} src={locationIcon} alt="" aria-hidden="true" />
            <span className={styles.distanceText}>{vendor.distanceText}</span>
            <img className={styles.externalIcon} src={externalLinkIcon} alt="" aria-hidden="true" />
          </p>

          <div>
            <p className={styles.treatsRow}>
              <img className={styles.detailIcon} src={cookieJarIcon} alt="" aria-hidden="true" />
              <span>
                {vendor.collectedCount} {treatUnitPlural} collected
              </span>
            </p>

            {vendor.validityDays !== undefined ? (
              <p className={styles.validityText}>Valid for {vendor.validityDays} days</p>
            ) : null}
          </div>

          <p className={styles.expiryRow}>
            <img className={styles.detailIcon} src={clockIcon} alt="" aria-hidden="true" />
            <span>
              {treatUnitPlural} from this vendor expire after {vendor.expiryDays} days of inactivity
            </span>
          </p>
        </div>
      </div>
    </section>
  )
}
