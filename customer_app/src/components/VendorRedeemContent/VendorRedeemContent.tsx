import { useEffect, useId, useMemo, useState } from 'react'

import { brand } from '../../config/brand'
import { type VendorRewardView } from '../../types/vendor'
import { SearchFilterRow } from '../SearchFilterRow'
import {
  SortFilterModal,
  hasActiveSortFilterSelection,
  type SortFilterModalConfig,
  type SortFilterModalSelection,
} from '../SortFilterModal'
import { VendorRewardCard } from '../VendorRewardCard'
import styles from './VendorRedeemContent.module.css'

type VendorRedeemContentProps = {
  description: string
  rewards: VendorRewardView[]
  treatUnitLabel: string
  onRewardAction?: (reward: VendorRewardView) => void
}

const rewardFilterConfig: SortFilterModalConfig = {
  sortOptions: [
    {
      sortOptionKey: 'leastToRedeem',
      sortOptionLabel: `Least ${brand.treatUnitPlural} to Redeem Big Treat`,
    },
    {
      sortOptionKey: 'mostCollected',
      sortOptionLabel: `Most ${brand.treatUnitPlural} Collected First`,
    },
  ],
  filterOptions: [
    {
      filterOptionKey: 'rewardStatus',
      filterOptionLabel: 'Filter by reward status',
      filterOptionValues: [
        { filterOptionValueKey: 'readyNow', filterOptionValueLabel: 'Ready to redeem' },
        { filterOptionValueKey: 'almostThere', filterOptionValueLabel: '80+ treats collected' },
        { filterOptionValueKey: 'stillCollecting', filterOptionValueLabel: 'Under 80 treats collected' },
      ],
    },
  ],
}

const defaultRewardFilterSelection: SortFilterModalSelection = {
  sortOption: null,
  filterOptions: {
    rewardStatus: null,
  },
}

export function VendorRedeemContent({
  description,
  rewards,
  treatUnitLabel,
  onRewardAction,
}: VendorRedeemContentProps) {
  const [searchValue, setSearchValue] = useState('')
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)
  const [filterSelection, setFilterSelection] = useState<SortFilterModalSelection>(
    defaultRewardFilterSelection,
  )
  const searchInputId = useId()

  useEffect(() => {
    setSearchValue('')
    setFilterSelection(defaultRewardFilterSelection)
    setIsFilterModalOpen(false)
  }, [rewards])

  const visibleRewards = useMemo(() => {
    const normalizedQuery = searchValue.trim().toLowerCase()
    const rewardStatusFilter = filterSelection.filterOptions.rewardStatus

    const filteredRewards = rewards.filter((reward) => {
      const searchableText = `${reward.title} ${reward.description}`.toLowerCase()
      const matchesSearch = normalizedQuery ? searchableText.includes(normalizedQuery) : true
      const matchesStatus =
        rewardStatusFilter === 'readyNow'
          ? reward.collectedCount >= reward.requiredCount
          : rewardStatusFilter === 'almostThere'
            ? reward.collectedCount >= 80 && reward.collectedCount < reward.requiredCount
            : rewardStatusFilter === 'stillCollecting'
              ? reward.collectedCount < 80
              : true

      return matchesSearch && matchesStatus
    })

    const sortedRewards = [...filteredRewards]

    if (filterSelection.sortOption === 'leastToRedeem') {
      sortedRewards.sort((leftReward, rightReward) => {
        const leftRemainingTreats = leftReward.requiredCount - leftReward.collectedCount
        const rightRemainingTreats = rightReward.requiredCount - rightReward.collectedCount

        return leftRemainingTreats - rightRemainingTreats
      })
    }

    if (filterSelection.sortOption === 'mostCollected') {
      sortedRewards.sort((leftReward, rightReward) => rightReward.collectedCount - leftReward.collectedCount)
    }

    return sortedRewards
  }, [filterSelection, rewards, searchValue])

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
        label="Search for big treat"
        value={searchValue}
        onChange={setSearchValue}
        onFilterClick={() => setIsFilterModalOpen(true)}
        placeholder="Search for big treat"
        filterAriaLabel="Filter vendor rewards"
        isFilterActive={hasActiveSortFilterSelection(filterSelection)}
      />

      <div className={styles.rewardList}>
        {visibleRewards.map((reward) => (
          <VendorRewardCard
            key={reward.id}
            title={reward.title}
            description={reward.description}
            collectedCount={reward.collectedCount}
            requiredCount={reward.requiredCount}
            treatUnitLabel={treatUnitLabel}
            actionLabel={reward.actionLabel}
            onAction={reward.actionLabel ? () => onRewardAction?.(reward) : undefined}
          />
        ))}

        {visibleRewards.length === 0 ? (
          <p className={styles.emptyMessage}>No big treats match your search yet.</p>
        ) : null}
      </div>

      <SortFilterModal
        isOpen={isFilterModalOpen}
        config={rewardFilterConfig}
        initialSelection={filterSelection}
        onApply={setFilterSelection}
        onClose={() => setIsFilterModalOpen(false)}
      />
    </>
  )
}
