import type { CSSProperties } from 'react'

import giftIcon from '../../../export_for_build/icons-pack/gift.svg'
import { TreatProgress } from '../TreatProgress'
import { getCardProgressPercent, getCardTheme } from '../VendorCardLayout'
import styles from './VendorRewardCard.module.css'

type VendorRewardCardProps = {
  title: string
  description: string
  collectedCount: number
  requiredCount: number
  treatUnitLabel: string
  actionLabel?: string
  onAction?: () => void
}

const joinClasses = (...classNames: Array<string | false | null | undefined>) =>
  classNames.filter(Boolean).join(' ')

export function VendorRewardCard({
  title,
  description,
  collectedCount,
  requiredCount,
  treatUnitLabel,
  actionLabel,
  onAction,
}: VendorRewardCardProps) {
  const progressPercent = getCardProgressPercent(collectedCount, requiredCount)
  const theme = getCardTheme(progressPercent, 'white')
  const style = {
    '--reward-accent-color': theme.accentColor,
    '--reward-shadow-color': theme.shadowColor,
    '--reward-icon-background-color': `${theme.accentColor}33`,
  } as CSSProperties
  const isInteractive = Boolean(actionLabel && onAction)

  return (
    <article
      className={joinClasses(styles.card, isInteractive && styles.cardInteractive)}
      style={style}
    >
      {isInteractive ? (
        <button
          className={styles.cardOverlayButton}
          type="button"
          aria-label={`${actionLabel} for ${title}`}
          onClick={onAction}
        />
      ) : null}

      <header className={styles.header}>
        <h3 className={styles.title}>{title}</h3>
      </header>

      <div className={joinClasses(styles.body, isInteractive && styles.clickThroughContent)}>
        <div className={styles.iconWrap}>
          <span className={styles.iconBadge}>
            <img className={styles.icon} src={giftIcon} alt="" aria-hidden="true" />
          </span>
        </div>

        <div className={styles.contentColumn}>
          <p className={styles.description}>
            <span className={styles.descriptionLabel}>Description:</span> {description}
          </p>

          <TreatProgress
            className={styles.progress}
            currentCount={collectedCount}
            requiredCount={requiredCount}
            label={treatUnitLabel}
            background="white"
            progressPercent={progressPercent}
            ariaLabel={`${title} progress`}
            metricsClassName={styles.progressMetrics}
            trackClassName={styles.progressTrack}
          />

          {actionLabel ? (
            isInteractive ? (
              <span className={styles.actionButton} aria-hidden="true">
                {actionLabel}
              </span>
            ) : (
              <button
                className={styles.actionButton}
                type="button"
                aria-label={`${actionLabel} for ${title}`}
                onClick={onAction}
              >
                {actionLabel}
              </button>
            )
          ) : null}
        </div>
      </div>
    </article>
  )
}
