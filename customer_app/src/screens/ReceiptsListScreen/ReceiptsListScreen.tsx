import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { ReceiptDetailModal } from '../../components/ReceiptDetailModal'
import { ReceiptSummaryCard } from '../../components/ReceiptSummaryCard'
import { SearchFilterRow } from '../../components/SearchFilterRow'
import {
  SortFilterModal,
  hasActiveSortFilterSelection,
  type SortFilterModalConfig,
  type SortFilterModalSelection,
} from '../../components/SortFilterModal'
import { brand } from '../../config/brand'
import { useAuth } from '../../context/AuthContext'
import { getUserReceipts } from '../../lib/supabase'
import type { ReceiptView } from '../../types/receipt'

import backIcon from '../../../export_for_build/icons-pack/back.svg'
import receiptIcon from '../../../export_for_build/icons-pack/receipt.svg'
import candyIcon from '../../../export_for_build/assets/liltreat-icon-large.png'
import styles from './ReceiptsListScreen.module.css'

// No vendor-category filter here — receipts only join the merchant's name,
// not its category (dropping this filter is a deliberate scope trim, same
// reasoning as the collect-tab category drop on the Vendor screen).
const receiptsFilterConfig: SortFilterModalConfig = {
  sortOptions: [
    {
      sortOptionKey: 'mostRecent',
      sortOptionLabel: 'Most Recent Purchase First',
    },
    {
      sortOptionKey: 'highestSpend',
      sortOptionLabel: 'Highest Spend First',
    },
  ],
  filterOptions: [
    {
      filterOptionKey: 'spendRange',
      filterOptionLabel: 'Filter by purchase amount',
      filterOptionValues: [
        { filterOptionValueKey: 'under10', filterOptionValueLabel: 'Under £10' },
        { filterOptionValueKey: 'tenPlus', filterOptionValueLabel: '£10 and above' },
      ],
    },
  ],
}

const defaultReceiptsFilterSelection: SortFilterModalSelection = {
  sortOption: null,
  filterOptions: {
    spendRange: null,
  },
}

const parseReceiptAmount = (amountSpent: string) => Number.parseFloat(amountSpent.replace(/[^\d.]/g, ''))

const joinClasses = (...classNames: Array<string | false | null | undefined>) =>
  classNames.filter(Boolean).join(' ')

export function ReceiptsListScreen() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [receipts, setReceipts] = useState<ReceiptView[]>([])
  const [searchValue, setSearchValue] = useState('')
  const [selectedReceiptId, setSelectedReceiptId] = useState<string | null>(null)
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)
  const [filterSelection, setFilterSelection] = useState<SortFilterModalSelection>(
    defaultReceiptsFilterSelection,
  )

  useEffect(() => {
    if (!user) return
    getUserReceipts(user.id).then((rows) => {
      setReceipts(rows.map((receipt): ReceiptView => {
        const createdAt = new Date(receipt.created_at)
        const vendorName = receipt.merchants?.name ?? 'Vendor'

        return {
          id: receipt.id,
          vendorId: receipt.merchant_id,
          vendorName,
          vendorDisplayName: vendorName,
          logoSrc: candyIcon,
          logoAlt: `${vendorName} logo`,
          purchaseDate: createdAt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          purchaseDateLong: createdAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
          purchaseTime: createdAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
          collectedCount: receipt.total_treats_earned,
          amountSpent: `£${receipt.total_amount.toFixed(2)}`,
          actionLabel: 'VIEW RECEIPT',
          items: receipt.line_items.map((item, index) => ({
            id: `${receipt.id}-${index}`,
            name: item.name,
            cost: `£${(item.qty * item.unit_price).toFixed(2)}`,
            treatCount: item.line_treats,
          })),
        }
      }))
    })
  }, [user?.id])

  const visibleReceipts = useMemo(() => {
    const normalizedQuery = searchValue.trim().toLowerCase()
    const spendRangeFilter = filterSelection.filterOptions.spendRange

    const filteredReceipts = receipts.filter((receipt) => {
      const searchableText = `${receipt.vendorName} ${receipt.purchaseDate} ${receipt.amountSpent}`.toLowerCase()
      const matchesSearch = normalizedQuery ? searchableText.includes(normalizedQuery) : true
      const spendAmount = parseReceiptAmount(receipt.amountSpent)
      const matchesSpendRange =
        spendRangeFilter === 'under10'
          ? spendAmount < 10
          : spendRangeFilter === 'tenPlus'
            ? spendAmount >= 10
            : true

      return matchesSearch && matchesSpendRange
    })

    const sortedReceipts = [...filteredReceipts]

    if (filterSelection.sortOption === 'mostRecent') {
      sortedReceipts.sort(
        (leftReceipt, rightReceipt) =>
          Date.parse(rightReceipt.purchaseDateLong) - Date.parse(leftReceipt.purchaseDateLong),
      )
    }

    if (filterSelection.sortOption === 'highestSpend') {
      sortedReceipts.sort(
        (leftReceipt, rightReceipt) =>
          parseReceiptAmount(rightReceipt.amountSpent) - parseReceiptAmount(leftReceipt.amountSpent),
      )
    }

    return sortedReceipts
  }, [filterSelection, receipts, searchValue])

  const activeReceipt = useMemo(
    () => receipts.find((receipt) => receipt.id === selectedReceiptId) ?? null,
    [receipts, selectedReceiptId],
  )

  const goHome = () => {
    navigate('/', { replace: true })
  }

  const closeModal = () => {
    setSelectedReceiptId(null)
  }

  return (
    <main className={styles.screen}>
      <header className={styles.header}>
        <button
          className={styles.headerButton}
          type="button"
          aria-label="Back to home"
          onClick={goHome}
        >
          <img className={styles.backIcon} src={backIcon} alt="" aria-hidden="true" />
        </button>

        <div className={styles.headerTitleWrap}>
          <img className={styles.receiptIcon} src={receiptIcon} alt="" aria-hidden="true" />
          <h1 className={styles.headerTitle}>RECEIPTS</h1>
        </div>

        <button
          className={styles.headerButton}
          type="button"
          aria-label={`Go to ${brand.appName} home`}
          onClick={goHome}
        >
          <img className={styles.homeIcon} src={candyIcon} alt="" aria-hidden="true" />
        </button>
      </header>

      <section className={joinClasses(styles.body, activeReceipt && styles.bodyModalOpen)}>
        <div aria-hidden={Boolean(activeReceipt)}>
          <p className={styles.description}>
            Your past purchases for all vendors are included below. Note, your receipt may not
            include all the items purchased, just the items you collected{' '}
            {brand.treatUnitPlural.toLowerCase()} for
          </p>

          <SearchFilterRow
            inputId="receipts-search"
            className={styles.searchRow}
            textFieldClassName={styles.searchFieldWrap}
            fieldClassName={styles.searchField}
            inputClassName={styles.searchInput}
            filterButtonClassName={styles.filterButton}
            filterIconClassName={styles.filterIcon}
            label="Search receipts"
            value={searchValue}
            onChange={setSearchValue}
            onFilterClick={() => setIsFilterModalOpen(true)}
            filterAriaLabel="Filter receipts"
            isFilterActive={hasActiveSortFilterSelection(filterSelection)}
          />

          <section className={styles.receiptsSection} aria-labelledby="receipts-list-heading">
            <h2 className={styles.visuallyHidden} id="receipts-list-heading">
              Receipt list
            </h2>

            <div className={styles.receiptsStack}>
              {visibleReceipts.map((receipt) => (
                <ReceiptSummaryCard
                  key={receipt.id}
                  vendorName={receipt.vendorName}
                  logoSrc={receipt.logoSrc}
                  logoAlt={receipt.logoAlt}
                  purchaseDate={receipt.purchaseDate}
                  collectedCount={receipt.collectedCount}
                  amountSpent={receipt.amountSpent}
                  treatUnitLabel={`${brand.treatUnitPlural} Collected`}
                  actionLabel={receipt.actionLabel}
                  onAction={() => setSelectedReceiptId(receipt.id)}
                />
              ))}

              {visibleReceipts.length === 0 ? (
                <p className={styles.emptyMessage}>No receipts match your search yet.</p>
              ) : null}
            </div>
          </section>
        </div>

        {activeReceipt ? (
          <ReceiptDetailModal
            receipt={activeReceipt}
            treatUnitColumnLabel={brand.treatUnitSingular.toUpperCase()}
            onClose={closeModal}
          />
        ) : null}

        <SortFilterModal
          isOpen={isFilterModalOpen}
          config={receiptsFilterConfig}
          initialSelection={filterSelection}
          onApply={setFilterSelection}
          onClose={() => setIsFilterModalOpen(false)}
        />
      </section>
    </main>
  )
}
