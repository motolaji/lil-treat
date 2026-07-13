import styles from './ProfileIdentitySummary.module.css'

import userIcon from '../../../export_for_build/icons-pack/user-outline.svg'

type ProfileIdentitySummaryProps = {
  titleId?: string
  name: string
  email: string
  footerText?: string
  badgeText?: string
  className?: string
}

const joinClasses = (...classNames: Array<string | null | undefined | false>) =>
  classNames.filter(Boolean).join(' ')

export function ProfileIdentitySummary({
  titleId,
  name,
  email,
  footerText,
  badgeText,
  className,
}: ProfileIdentitySummaryProps) {
  return (
    <div className={joinClasses(styles.summary, className)}>
      <img className={styles.icon} src={userIcon} alt="" aria-hidden="true" />
      <h2 className={styles.name} id={titleId}>
        {name}
      </h2>
      <p className={styles.email}>{email}</p>
      {footerText ? <p className={styles.footer}>{footerText}</p> : null}
      {badgeText ? <p className={styles.badge}>{badgeText}</p> : null}
      <span className={styles.divider} aria-hidden="true" />
    </div>
  )
}
