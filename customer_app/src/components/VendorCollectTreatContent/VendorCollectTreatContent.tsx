import { Fragment, useEffect, useId, useMemo, useRef, useState } from 'react'

import { type VendorCollectItemView } from '../../types/vendor'
import { GreyDivider } from '../GreyDivider'
import { SearchFilterRow } from '../SearchFilterRow'
import {
  SortFilterModal,
  hasActiveSortFilterSelection,
  type SortFilterModalConfig,
  type SortFilterModalSelection,
} from '../SortFilterModal'

import leftChevronIcon from '../../../export_for_build/icons-pack/left-chevron.svg'
import rightChevronIcon from '../../../export_for_build/icons-pack/right-chevron.svg'
import treatTokenIcon from '../../../export_for_build/assets/liltreat-black-and-white-icon.svg'
import styles from './VendorCollectTreatContent.module.css'

type VendorCollectTreatContentProps = {
  description: string
  collectHeadingLabel: string
  collectPanelSubtitle: string
  categories: { id: string; label: string }[]
  items: VendorCollectItemView[]
}

const collectCategoryScrollDistance = 140

const createCollectFilterSelection = (categoryId: string): SortFilterModalSelection => ({
  sortOption: null,
  filterOptions: {
    collectCategory: categoryId,
  },
})

const formatCollectItemName = (name: string) =>
  name
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase())

export function VendorCollectTreatContent({
  description,
  collectHeadingLabel,
  collectPanelSubtitle,
  categories,
  items,
}: VendorCollectTreatContentProps) {
  const [searchValue, setSearchValue] = useState('')
  const [activeCollectCategoryId, setActiveCollectCategoryId] = useState(categories[0]?.id ?? 'all')
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)
  const [filterSelection, setFilterSelection] = useState<SortFilterModalSelection>(() =>
    createCollectFilterSelection(categories[0]?.id ?? 'all'),
  )
  const searchInputId = useId()
  const headingId = useId()
  const categoryRailRef = useRef<HTMLDivElement | null>(null)
  const defaultCategoryId = categories[0]?.id ?? 'all'

  useEffect(() => {
    setSearchValue('')
    setActiveCollectCategoryId(defaultCategoryId)
    setFilterSelection(createCollectFilterSelection(defaultCategoryId))
    setIsFilterModalOpen(false)
    categoryRailRef.current?.scrollTo({ left: 0 })
  }, [defaultCategoryId, categories, items])

  const activeCollectCategory =
    categories.find((category) => category.id === activeCollectCategoryId) ?? categories[0]

  const collectFilterConfig = useMemo<SortFilterModalConfig>(
    () => ({
      sortOptions: [
        {
          sortOptionKey: 'highestTreats',
          sortOptionLabel: 'Highest Treat Amount First',
        },
        {
          sortOptionKey: 'lowestTreats',
          sortOptionLabel: 'Lowest Treat Amount First',
        },
        {
          sortOptionKey: 'alphabetical',
          sortOptionLabel: 'Alphabetical Order',
        },
      ],
      filterOptions: [
        {
          filterOptionKey: 'collectCategory',
          filterOptionLabel: 'Filter by item category',
          filterOptionValues: categories.map((category) => ({
            filterOptionValueKey: category.id,
            filterOptionValueLabel: category.label,
          })),
        },
      ],
    }),
    [categories],
  )

  const visibleCollectItems = useMemo(() => {
    const normalizedQuery = searchValue.trim().toLowerCase()
    const categoryId = activeCollectCategory?.id ?? defaultCategoryId
    const categoryItems =
      categoryId === 'all'
        ? items.filter((item) => item.showInAll !== false)
        : items.filter((item) => item.categoryIds.includes(categoryId))

    const filteredItems = normalizedQuery
      ? categoryItems.filter((item) => item.name.toLowerCase().includes(normalizedQuery))
      : categoryItems

    const sortedItems = [...filteredItems]

    if (filterSelection.sortOption === 'highestTreats') {
      sortedItems.sort((leftItem, rightItem) => rightItem.treatCount - leftItem.treatCount)
    }

    if (filterSelection.sortOption === 'lowestTreats') {
      sortedItems.sort((leftItem, rightItem) => leftItem.treatCount - rightItem.treatCount)
    }

    if (filterSelection.sortOption === 'alphabetical') {
      sortedItems.sort((leftItem, rightItem) => leftItem.name.localeCompare(rightItem.name))
    }

    return sortedItems
  }, [activeCollectCategory, defaultCategoryId, filterSelection.sortOption, items, searchValue])

  const emptyCollectMessage =
    activeCollectCategory?.id === 'all'
      ? 'No items match your search yet.'
      : `No ${activeCollectCategory?.label.toLowerCase()} items match your search yet.`

  const scrollCollectCategories = (direction: 'left' | 'right') => {
    categoryRailRef.current?.scrollBy({
      left: direction === 'left' ? -collectCategoryScrollDistance : collectCategoryScrollDistance,
      behavior: 'smooth',
    })
  }

  return (
    <>
      <p className={styles.description}>{description}</p>

      <SearchFilterRow
        inputId={searchInputId}
        className={styles.searchRow}
        textFieldClassName={styles.searchFieldWrap}
        fieldClassName={styles.searchField}
        inputClassName={styles.searchInput}
        filterButtonClassName={styles.filterButton}
        filterIconClassName={styles.filterIcon}
        label="Search by item name"
        value={searchValue}
        onChange={setSearchValue}
        onFilterClick={() => setIsFilterModalOpen(true)}
        placeholder="Search by item name"
        filterAriaLabel="Filter vendor items"
        isFilterActive={hasActiveSortFilterSelection(filterSelection)}
      />

      <section className={styles.collectSection} aria-labelledby={headingId}>
        <h2 className={styles.visuallyHidden} id={headingId}>
          Collect {collectHeadingLabel}
        </h2>

        <div className={styles.collectPanel}>
          <div className={styles.collectPanelHeader}>
            <p className={styles.collectPanelTitle}>ITEMS YOU CAN COLLECT</p>
            <p className={styles.collectPanelSubtitle}>{collectPanelSubtitle}</p>
          </div>

          <div className={styles.collectCategoryRow}>
            <button
              className={styles.categoryScrollButton}
              type="button"
              aria-label="Scroll collect categories left"
              onClick={() => scrollCollectCategories('left')}
            >
              <img className={styles.categoryScrollIcon} src={leftChevronIcon} alt="" aria-hidden="true" />
            </button>

            <div className={styles.collectCategoryRail} ref={categoryRailRef}>
              {categories.map((category) => {
                const isActive = activeCollectCategory?.id === category.id

                return (
                  <button
                    key={category.id}
                    className={`${styles.categoryChip} ${isActive ? styles.categoryChipActive : ''}`}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => {
                      setActiveCollectCategoryId(category.id)
                      setFilterSelection((currentSelection) => ({
                        ...currentSelection,
                        filterOptions: {
                          ...currentSelection.filterOptions,
                          collectCategory: category.id,
                        },
                      }))
                    }}
                  >
                    {category.label}
                  </button>
                )
              })}
            </div>

            <button
              className={styles.categoryScrollButton}
              type="button"
              aria-label="Scroll collect categories right"
              onClick={() => scrollCollectCategories('right')}
            >
              <img className={styles.categoryScrollIcon} src={rightChevronIcon} alt="" aria-hidden="true" />
            </button>
          </div>

          {visibleCollectItems.length > 0 ? (
            <div className={styles.collectRows}>
              <GreyDivider className={styles.collectDivider} />

              {visibleCollectItems.map((item, index) => (
                <Fragment key={item.id}>
                  <div className={styles.collectItemRow}>
                    <span className={styles.collectItemName}>{formatCollectItemName(item.name)}</span>
                    <span className={styles.collectItemCountBadge}>
                      <span className={styles.collectItemCount}>{item.treatCount}</span>
                      <img className={styles.collectTreatIcon} src={treatTokenIcon} alt="" aria-hidden="true" />
                    </span>
                  </div>

                  {index < visibleCollectItems.length - 1 ? <GreyDivider className={styles.collectDivider} /> : null}
                </Fragment>
              ))}
            </div>
          ) : (
            <div className={styles.collectEmptyStateWrap}>
              <GreyDivider className={styles.collectDivider} />
              <div className={styles.collectEmptyState}>
                <p className={styles.emptyMessage}>{emptyCollectMessage}</p>
              </div>
            </div>
          )}
        </div>
      </section>

      <SortFilterModal
        isOpen={isFilterModalOpen}
        config={collectFilterConfig}
        initialSelection={filterSelection}
        onApply={(selection) => {
          const nextCategoryId = selection.filterOptions.collectCategory ?? defaultCategoryId
          setFilterSelection(selection)
          setActiveCollectCategoryId(nextCategoryId)
        }}
        onClose={() => setIsFilterModalOpen(false)}
      />
    </>
  )
}
