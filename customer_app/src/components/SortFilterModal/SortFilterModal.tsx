import { useEffect, useId, useState } from 'react'

import { useMountTransition } from '../../hooks/useMountTransition'
import dropdownIcon from '../../../export_for_build/icons-pack/dropdown.svg'
import styles from './SortFilterModal.module.css'

const MODAL_ANIMATION_DURATION_MS = 260

export type SortFilterModalSortOption = {
  sortOptionKey: string
  sortOptionLabel: string
}

export type SortFilterModalFilterOptionValue = {
  filterOptionValueKey: string
  filterOptionValueLabel: string
}

export type SortFilterModalFilterOption = {
  filterOptionKey: string
  filterOptionLabel: string
  filterOptionValues: SortFilterModalFilterOptionValue[]
}

export type SortFilterModalConfig = {
  sortOptions: SortFilterModalSortOption[]
  filterOptions: SortFilterModalFilterOption[]
}

export type SortFilterModalSelection = {
  sortOption: string | null
  filterOptions: Record<string, string | null>
}

export const hasActiveSortFilterSelection = (selection?: SortFilterModalSelection | null) =>
  Boolean(selection?.sortOption) || Object.values(selection?.filterOptions ?? {}).some(Boolean)

type SortFilterModalProps = {
  isOpen: boolean
  config: SortFilterModalConfig
  initialSelection?: SortFilterModalSelection
  onApply: (selection: SortFilterModalSelection) => void
  onClose: () => void
  title?: string
  sortLabel?: string
  primaryActionLabel?: string
  secondaryActionLabel?: string
}

const createEmptySelection = (config: SortFilterModalConfig): SortFilterModalSelection => ({
  sortOption: null,
  filterOptions: Object.fromEntries(
    config.filterOptions.map((option) => [option.filterOptionKey, null]),
  ),
})

const normalizeSelection = (
  config: SortFilterModalConfig,
  selection?: SortFilterModalSelection,
): SortFilterModalSelection => {
  const emptySelection = createEmptySelection(config)

  return {
    sortOption: selection?.sortOption ?? null,
    filterOptions: {
      ...emptySelection.filterOptions,
      ...(selection?.filterOptions ?? {}),
    },
  }
}

const selectionsMatch = (
  leftSelection: SortFilterModalSelection,
  rightSelection: SortFilterModalSelection,
) =>
  leftSelection.sortOption === rightSelection.sortOption &&
  Object.keys({
    ...leftSelection.filterOptions,
    ...rightSelection.filterOptions,
  }).every(
    (filterKey) =>
      (leftSelection.filterOptions[filterKey] ?? null) ===
      (rightSelection.filterOptions[filterKey] ?? null),
  )

export function SortFilterModal({
  isOpen,
  config,
  initialSelection,
  onApply,
  onClose,
  title = 'SORT & FILTER',
  sortLabel = 'Sort by:',
  primaryActionLabel = 'Apply Changes',
  secondaryActionLabel = 'Exit',
}: SortFilterModalProps) {
  const titleId = useId()
  const bodyId = useId()
  const [draftSelection, setDraftSelection] = useState<SortFilterModalSelection>(() =>
    normalizeSelection(config, initialSelection),
  )
  const appliedSelection = normalizeSelection(config, initialSelection)
  const hasDraftChanges = !selectionsMatch(draftSelection, appliedSelection)
  const isApplyDisabled = !hasDraftChanges
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

  const handleSortChange = (value: string) => {
    setDraftSelection((currentSelection) => ({
      ...currentSelection,
      sortOption: value || null,
    }))
  }

  const handleFilterChange = (filterKey: string, value: string) => {
    setDraftSelection((currentSelection) => ({
      ...currentSelection,
      filterOptions: {
        ...currentSelection.filterOptions,
        [filterKey]: value || null,
      },
    }))
  }

  const handleClearAll = () => {
    setDraftSelection(createEmptySelection(config))
  }

  const handleApply = () => {
    onApply(normalizeSelection(config, draftSelection))
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
          <div className={styles.clearActionRow}>
            <button className={styles.clearButton} type="button" onClick={handleClearAll}>
              Clear All
            </button>
          </div>

          {config.sortOptions.length > 0 ? (
            <fieldset className={styles.section}>
              <legend className={styles.legend}>Sort</legend>
              <label className={styles.fieldLabel} htmlFor={`${titleId}-sort`}>
                {sortLabel}
              </label>
              <select
                id={`${titleId}-sort`}
                className={`${styles.select} ${draftSelection.sortOption ? styles.selectActive : ''}`.trim()}
                value={draftSelection.sortOption ?? ''}
                onChange={(event) => handleSortChange(event.target.value)}
                style={{ backgroundImage: `url(${dropdownIcon})` }}
              >
                <option value="">Select an option</option>
                {config.sortOptions.map((option) => (
                  <option key={option.sortOptionKey} value={option.sortOptionKey}>
                    {option.sortOptionLabel}
                  </option>
                ))}
              </select>
            </fieldset>
          ) : null}

          {config.filterOptions.length > 0 ? (
            <fieldset className={styles.section}>
              <legend className={styles.legend}>Filter</legend>
              <div className={styles.filterStack}>
                {config.filterOptions.map((filterOption) => (
                  <div className={styles.filterField} key={filterOption.filterOptionKey}>
                    <label
                      className={styles.fieldLabel}
                      htmlFor={`${titleId}-${filterOption.filterOptionKey}`}
                    >
                      {filterOption.filterOptionLabel}:
                    </label>
                    <select
                      id={`${titleId}-${filterOption.filterOptionKey}`}
                      className={`${styles.select} ${draftSelection.filterOptions[filterOption.filterOptionKey] ? styles.selectActive : ''}`.trim()}
                      value={draftSelection.filterOptions[filterOption.filterOptionKey] ?? ''}
                      onChange={(event) =>
                        handleFilterChange(filterOption.filterOptionKey, event.target.value)
                      }
                      style={{ backgroundImage: `url(${dropdownIcon})` }}
                    >
                      <option value="">Select an option</option>
                      {filterOption.filterOptionValues.map((option) => (
                        <option key={option.filterOptionValueKey} value={option.filterOptionValueKey}>
                          {option.filterOptionValueLabel}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </fieldset>
          ) : null}
        </div>

        <div className={styles.actions}>
          <button className={`${styles.actionButton} ${styles.secondaryButton}`} type="button" onClick={onClose} autoFocus={isApplyDisabled}>
            {secondaryActionLabel}
          </button>
          <button
            className={`${styles.actionButton} ${styles.primaryButton} ${isApplyDisabled ? styles.primaryButtonDisabled : ''}`.trim()}
            type="button"
            onClick={handleApply}
            disabled={isApplyDisabled}
            autoFocus={!isApplyDisabled}
          >
            {primaryActionLabel}
          </button>
        </div>
      </section>
    </div>
  )
}
