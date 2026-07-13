import type { ReactNode } from 'react'

import styles from './HelpTopicCard.module.css'

type HelpTopicCardProps = {
  title: string
  description: string
  markerLabel?: string
  action?: ReactNode
  children?: ReactNode
}

export function HelpTopicCard({ title, description, markerLabel, action, children }: HelpTopicCardProps) {
  return (
    <article className={styles.card}>
      <div className={styles.headingRow}>
        <span
          className={markerLabel ? styles.markerNumber : styles.marker}
          aria-hidden="true"
        >
          {markerLabel ?? null}
        </span>
        <h3 className={styles.title}>{title}</h3>
      </div>

      <p className={styles.description}>{description}</p>

      {children ? <div className={styles.details}>{children}</div> : null}
      {action ? <div className={styles.actionRow}>{action}</div> : null}
    </article>
  )
}
