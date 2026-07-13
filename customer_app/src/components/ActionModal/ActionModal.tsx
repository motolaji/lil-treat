import { useEffect, useId, type ReactNode } from 'react'

import { useMountTransition } from '../../hooks/useMountTransition'
import styles from './ActionModal.module.css'

const MODAL_ANIMATION_DURATION_MS = 260

type ActionModalProps = {
  isOpen: boolean
  title: string
  children: ReactNode
  onClose: () => void
  primaryActionLabel: string
  onPrimaryAction?: () => void
  secondaryActionLabel?: string
  onSecondaryAction?: () => void
}

export function ActionModal({
  isOpen,
  title,
  children,
  onClose,
  primaryActionLabel,
  onPrimaryAction,
  secondaryActionLabel,
  onSecondaryAction,
}: ActionModalProps) {
  const titleId = useId()
  const bodyId = useId()
  const hasSecondaryAction = Boolean(secondaryActionLabel)
  const { shouldRender, animationClass } = useMountTransition(isOpen, MODAL_ANIMATION_DURATION_MS)

  useEffect(() => {
    if (!shouldRender) return
    const viewport = document.querySelector<HTMLElement>('[data-app-viewport]')
    const previousOverflow = viewport?.style.overflow
    const previousTouchAction = viewport?.style.touchAction
    const previousOverscrollBehavior = viewport?.style.overscrollBehavior

    if (viewport) {
      viewport.style.overflow = 'hidden'
      viewport.style.touchAction = 'none'
      viewport.style.overscrollBehavior = 'none'
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
    }

    window.addEventListener('keydown', handleEscape)

    return () => {
      if (viewport) {
        viewport.style.overflow = previousOverflow ?? ''
        viewport.style.touchAction = previousTouchAction ?? ''
        viewport.style.overscrollBehavior = previousOverscrollBehavior ?? ''
      }

      window.removeEventListener('keydown', handleEscape)
    }
  }, [onClose, shouldRender])

  if (!shouldRender) return null

  const handlePrimaryClick = () => {
    onPrimaryAction?.()
    onClose()
  }

  const handleSecondaryClick = () => {
    onSecondaryAction?.()
    onClose()
  }

  return (
    <div className={`${styles.overlay} ${styles[animationClass] ?? ''}`} role="presentation" onClick={onClose}>
      <section
        className={styles.card}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        onClick={(event) => event.stopPropagation()}
      >
        <header className={styles.header}>
          <h2 className={styles.title} id={titleId}>
            {title}
          </h2>
        </header>

        <div className={styles.body} id={bodyId}>
          {children}
        </div>

        <div className={`${styles.actions} ${hasSecondaryAction ? styles.actionsWithSecondary : styles.actionsSingle}`}>
          {hasSecondaryAction ? (
            <button className={`${styles.actionButton} ${styles.secondaryButton}`} type="button" onClick={handleSecondaryClick}>
              {secondaryActionLabel}
            </button>
          ) : null}

          <button className={`${styles.actionButton} ${styles.primaryButton}`} type="button" onClick={handlePrimaryClick} autoFocus>
            {primaryActionLabel}
          </button>
        </div>
      </section>
    </div>
  )
}
