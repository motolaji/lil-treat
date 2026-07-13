import filterIcon from '../../../export_for_build/icons-pack/filter.svg'

import styles from './FilterButton.module.css'

type FilterButtonProps = {
  ariaLabel?: string
  onClick?: () => void
  className?: string
  iconClassName?: string
  isActive?: boolean
}

const joinClasses = (...classNames: Array<string | false | null | undefined>) =>
  classNames.filter(Boolean).join(' ')

export function FilterButton({
  ariaLabel = 'Open filters',
  onClick,
  className,
  iconClassName,
  isActive = false,
}: FilterButtonProps) {
  return (
    <button
      className={joinClasses(styles.button, isActive && styles.buttonActive, className)}
      type="button"
      aria-label={ariaLabel}
      aria-pressed={isActive}
      onClick={onClick}
    >
      <img
        className={joinClasses(styles.icon, iconClassName)}
        src={filterIcon}
        alt=""
        aria-hidden="true"
      />
    </button>
  )
}
