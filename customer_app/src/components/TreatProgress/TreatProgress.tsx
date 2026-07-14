import type { CSSProperties } from 'react'

import { getCardProgressPercent, getCardTheme, type CardBackground } from '../VendorCardLayout'
import { formatTreats } from '../../lib/format'
import styles from './TreatProgress.module.css'

type TreatProgressProps = {
  currentCount: number
  requiredCount: number
  label: string
  background: CardBackground
  progressPercent?: number
  ariaLabel: string
  className?: string
  metricsClassName?: string
  trackClassName?: string
}

const joinClasses = (...classNames: Array<string | false | null | undefined>) =>
  classNames.filter(Boolean).join(' ')

export function TreatProgress({
  currentCount,
  requiredCount,
  label,
  background,
  progressPercent,
  ariaLabel,
  className,
  metricsClassName,
  trackClassName,
}: TreatProgressProps) {
  const resolvedProgressPercent =
    progressPercent ?? getCardProgressPercent(currentCount, requiredCount) ?? 0
  const clampedProgressPercent = Math.max(0, Math.min(100, resolvedProgressPercent))
  const theme = getCardTheme(clampedProgressPercent, background)
  const trackColor =
    background === 'black' ? 'rgba(255, 255, 255, 0.22)' : 'var(--color-grey-300)'

  const style = {
    '--progress-accent-color': theme.accentColor,
    '--progress-track-color': trackColor,
    '--progress-count-color': theme.accentColor,
    '--progress-label-color': theme.textPrimary,
  } as CSSProperties

  return (
    <div className={joinClasses(styles.root, className)} style={style}>
      <p className={joinClasses(styles.metrics, metricsClassName)}>
        <span className={styles.count}>
          {formatTreats(currentCount)}/{formatTreats(requiredCount)}
        </span>{' '}
        <span className={styles.label}>{label}</span>
      </p>

      <div
        className={joinClasses(styles.track, trackClassName)}
        role="progressbar"
        aria-label={ariaLabel}
        aria-valuemin={0}
        aria-valuemax={requiredCount}
        aria-valuenow={Math.max(0, currentCount)}
      >
        <span className={styles.fill} style={{ width: `${clampedProgressPercent}%` }} />
      </div>
    </div>
  )
}
