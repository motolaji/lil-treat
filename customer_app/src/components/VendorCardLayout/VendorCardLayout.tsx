import type { CSSProperties, ElementType, ReactNode } from 'react'

import { getCardTheme, type CardBackground } from './cardTheme'
import styles from './VendorCardLayout.module.css'

type VendorCardLayoutProps = {
  title: string
  logoSrc: string
  logoAlt: string
  actionLabel: string
  onAction?: () => void
  background: CardBackground
  progressPercent?: number
  buttonAriaLabel?: string
  headingLevel?: 'h2' | 'h3'
  headerAdornment?: ReactNode
  children: ReactNode
  className?: string
  contentClassName?: string
  bodyClassName?: string
  titleClassName?: string
  logoPaneClassName?: string
  logoClassName?: string
  actionButtonClassName?: string
}

const joinClasses = (...classNames: Array<string | false | null | undefined>) =>
  classNames.filter(Boolean).join(' ')

export function VendorCardLayout({
  title,
  logoSrc,
  logoAlt,
  actionLabel,
  onAction,
  background,
  progressPercent,
  buttonAriaLabel,
  headingLevel = 'h3',
  headerAdornment,
  children,
  className,
  contentClassName,
  bodyClassName,
  titleClassName,
  logoPaneClassName,
  logoClassName,
  actionButtonClassName,
}: VendorCardLayoutProps) {
  const TitleTag = headingLevel as ElementType
  const theme = getCardTheme(progressPercent, background)
  const style = {
    '--card-accent-color': theme.accentColor,
    '--card-border-color': theme.borderColor,
    '--card-shadow-color': theme.shadowColor,
    '--card-background-color': theme.cardBackground,
    '--card-logo-pane-background': theme.logoPaneBackground,
    '--card-text-primary': theme.textPrimary,
    '--card-text-secondary': theme.textSecondary,
    '--card-button-text-color': theme.buttonTextColor,
    '--card-expiry-color': theme.expiryColor,
    '--card-location-icon-filter': theme.locationIconFilter,
  } as CSSProperties

  return (
    <article className={joinClasses(styles.card, className)} style={style}>
      {onAction ? (
        <button
          className={styles.cardOverlayButton}
          type="button"
          aria-label={buttonAriaLabel ?? `${actionLabel} for ${title}`}
          onClick={onAction}
        />
      ) : null}

      <div className={joinClasses(styles.logoPane, logoPaneClassName)}>
        <img className={joinClasses(styles.logo, logoClassName)} src={logoSrc} alt={logoAlt} />
      </div>

      <div className={joinClasses(styles.content, contentClassName)}>
        <div className={styles.headerRow}>
          <TitleTag className={joinClasses(styles.title, titleClassName)}>{title}</TitleTag>
          {headerAdornment ? <span className={styles.headerAdornment}>{headerAdornment}</span> : null}
        </div>

        <div className={joinClasses(styles.body, bodyClassName)}>{children}</div>

        <button
          className={joinClasses(styles.actionButton, actionButtonClassName)}
          type="button"
          onClick={onAction}
          disabled={!onAction}
        >
          {actionLabel}
        </button>
      </div>
    </article>
  )
}
