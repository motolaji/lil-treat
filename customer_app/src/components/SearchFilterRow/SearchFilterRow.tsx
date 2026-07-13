import type { HTMLInputTypeAttribute } from 'react'

import { FilterButton } from '../FilterButton'
import { TextField } from '../TextField'
import styles from './SearchFilterRow.module.css'

type SearchFilterRowProps = {
  inputId: string
  value: string
  onChange: (value: string) => void
  label?: string
  hideLabel?: boolean
  placeholder?: string
  type?: HTMLInputTypeAttribute
  filterAriaLabel?: string
  onFilterClick?: () => void
  isFilterActive?: boolean
  className?: string
  textFieldClassName?: string
  fieldClassName?: string
  inputClassName?: string
  filterButtonClassName?: string
  filterIconClassName?: string
  errorMessage?: string
}

const joinClasses = (...classNames: Array<string | false | null | undefined>) =>
  classNames.filter(Boolean).join(' ')

export function SearchFilterRow({
  inputId,
  value,
  onChange,
  label = 'Search',
  hideLabel = true,
  placeholder,
  type = 'search',
  filterAriaLabel = 'Open filters',
  onFilterClick,
  isFilterActive = false,
  className,
  textFieldClassName,
  fieldClassName,
  inputClassName,
  filterButtonClassName,
  filterIconClassName,
  errorMessage,
}: SearchFilterRowProps) {
  return (
    <div className={joinClasses(styles.row, className)}>
      <TextField
        id={inputId}
        className={joinClasses(styles.textField, textFieldClassName)}
        label={label}
        hideLabel={hideLabel}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete="off"
        ariaLabel={label}
        fieldClassName={fieldClassName}
        inputClassName={inputClassName}
        errorMessage={errorMessage}
      />

      <FilterButton
        className={joinClasses(styles.filterButton, filterButtonClassName)}
        iconClassName={joinClasses(styles.filterIcon, filterIconClassName)}
        ariaLabel={filterAriaLabel}
        onClick={onFilterClick}
        isActive={isFilterActive}
      />
    </div>
  )
}
