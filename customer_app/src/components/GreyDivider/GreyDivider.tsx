import styles from './GreyDivider.module.css'

type GreyDividerProps = {
  className?: string
}

export function GreyDivider({ className }: GreyDividerProps) {
  const dividerClassName = [styles.divider, className].filter(Boolean).join(' ')

  return <span className={dividerClassName} aria-hidden="true" />
}
