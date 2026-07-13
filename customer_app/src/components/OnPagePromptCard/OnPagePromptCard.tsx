import { type CSSProperties, type ReactNode } from 'react'

import styles from './OnPagePromptCard.module.css'

type OnPagePromptCardProps = {
  title: string
  titleId?: string
  headerIconSrc?: string
  headerIconAlt?: string
  children: ReactNode
  primaryActionLabel: string
  onPrimaryAction?: () => void
  secondaryActionLabel?: string
  onSecondaryAction?: () => void
  cardClassName?: string
  headerClassName?: string
  iconClassName?: string
  titleClassName?: string
  bodyClassName?: string
  actionsClassName?: string
  primaryButtonClassName?: string
  secondaryButtonClassName?: string
}

const classNames = (...names: Array<string | false | null | undefined>) =>
  names.filter(Boolean).join(' ')

export function OnPagePromptCard({
  title,
  titleId,
  headerIconSrc,
  headerIconAlt,
  children,
  primaryActionLabel,
  onPrimaryAction,
  secondaryActionLabel,
  onSecondaryAction,
  cardClassName,
  headerClassName,
  iconClassName,
  titleClassName,
  bodyClassName,
  actionsClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
}: OnPagePromptCardProps) {
  const isDecorativeIcon = !headerIconAlt
  const headerIconStyle = headerIconSrc
    ? ({ '--prompt-icon-mask': `url("${headerIconSrc}")` } as CSSProperties)
    : undefined

  return (
    <section className={classNames(styles.card, cardClassName)} aria-labelledby={titleId}>
      <header className={classNames(styles.header, headerClassName)}>
        {headerIconSrc ? (
          <span
            className={classNames(styles.icon, iconClassName)}
            role={isDecorativeIcon ? undefined : 'img'}
            aria-label={isDecorativeIcon ? undefined : headerIconAlt}
            aria-hidden={isDecorativeIcon}
            style={headerIconStyle}
          />
        ) : null}
        <h2 className={classNames(styles.title, titleClassName)} id={titleId}>
          {title}
        </h2>
      </header>

      <div className={classNames(styles.body, bodyClassName)}>{children}</div>

      <div className={classNames(styles.actions, actionsClassName)}>
        {secondaryActionLabel ? (
          <button
            className={classNames(styles.secondaryButton, secondaryButtonClassName)}
            type="button"
            onClick={onSecondaryAction}
          >
            {secondaryActionLabel}
          </button>
        ) : null}
        <button
          className={classNames(styles.primaryButton, primaryButtonClassName)}
          type="button"
          onClick={onPrimaryAction}
        >
          {primaryActionLabel}
        </button>
      </div>
    </section>
  )
}
