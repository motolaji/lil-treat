import type { HTMLInputTypeAttribute, InputHTMLAttributes } from 'react'

import styles from './TextField.module.css'

type TextFieldVariant = 'default' | 'inverted'

type TextFieldProps = {
  id: string
  value: string
  onChange: (value: string) => void
  label?: string
  hideLabel?: boolean
  placeholder?: string
  type?: HTMLInputTypeAttribute
  errorMessage?: string
  autoComplete?: string
  inputMode?: InputHTMLAttributes<HTMLInputElement>['inputMode']
  ariaLabel?: string
  name?: string
  required?: boolean
  autoFocus?: boolean
  variant?: TextFieldVariant
  className?: string
  labelClassName?: string
  fieldClassName?: string
  inputClassName?: string
  errorClassName?: string
}

const joinClasses = (...classNames: Array<string | false | null | undefined>) =>
  classNames.filter(Boolean).join(' ')

export function TextField({
  id,
  value,
  onChange,
  label,
  hideLabel = false,
  placeholder,
  type = 'text',
  errorMessage,
  autoComplete,
  inputMode,
  ariaLabel,
  name,
  required = false,
  autoFocus = false,
  variant = 'default',
  className,
  labelClassName,
  fieldClassName,
  inputClassName,
  errorClassName,
}: TextFieldProps) {
  const errorId = errorMessage ? `${id}-error` : undefined
  const labelClasses = joinClasses(
    hideLabel ? styles.visuallyHiddenLabel : styles.label,
    labelClassName,
  )

  return (
    <div
      className={joinClasses(
        styles.root,
        errorMessage && styles.hasError,
        variant === 'inverted' && styles.inverted,
        className,
      )}
    >
      {label ? (
        <label className={labelClasses} htmlFor={id}>
          {label}
        </label>
      ) : null}

      <div className={joinClasses(styles.field, fieldClassName)}>
        <input
          id={id}
          className={joinClasses(styles.input, inputClassName)}
          type={type}
          name={name}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          inputMode={inputMode}
          required={required}
          autoFocus={autoFocus}
          aria-label={label ? undefined : ariaLabel}
          aria-invalid={errorMessage ? true : undefined}
          aria-describedby={errorId}
        />
      </div>

      {errorMessage ? (
        <p className={joinClasses(styles.error, errorClassName)} id={errorId} role="alert">
          {errorMessage}
        </p>
      ) : null}
    </div>
  )
}
