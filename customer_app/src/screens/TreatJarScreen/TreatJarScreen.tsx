import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { SearchFilterRow } from '../../components/SearchFilterRow'
import {
  SortFilterModal,
  hasActiveSortFilterSelection,
  type SortFilterModalConfig,
  type SortFilterModalSelection,
} from '../../components/SortFilterModal'
import { TreatCard } from '../../components/TreatCard'
import { brand } from '../../config/brand'
import { useAuth } from '../../context/AuthContext'
import {
  getMerchants,
  getUserCards,
  getRewardsForMerchants,
  type Merchant,
  type LoyaltyCard,
  type Reward,
} from '../../lib/supabase'
import { cheapestActiveCost } from '../../lib/rewards'
import { getCurrentPosition, haversineDistanceKm, type Coordinates } from '../../lib/geo'
import type { HomeTreatCard } from '../../types/treatCard'

import backIcon from '../../../export_for_build/icons-pack/back.svg'
import locationIcon from '../../../export_for_build/icons-pack/location.svg'
import candyIcon from '../../../export_for_build/assets/liltreat-icon-large.png'
import jarArt from '../../../export_for_build/assets/jar-art.svg'
import styles from './TreatJarScreen.module.css'

const treatJarFilterConfig: SortFilterModalConfig = {
  sortOptions: [
    {
      sortOptionKey: 'closestVendor',
      sortOptionLabel: 'Closest Vendor First',
    },
    {
      sortOptionKey: 'leastTreatsToRedeem',
      sortOptionLabel: `Least ${brand.treatUnitPlural} to Redeem Big Treat`,
    },
  ],
  filterOptions: [
    {
      filterOptionKey: 'vendorType',
      filterOptionLabel: 'Filter by vendor type',
      filterOptionValues: [
        { filterOptionValueKey: 'drinks', filterOptionValueLabel: 'Drinks' },
        { filterOptionValueKey: 'food', filterOptionValueLabel: 'Food' },
        { filterOptionValueKey: 'retail', filterOptionValueLabel: 'Retail' },
        { filterOptionValueKey: 'other', filterOptionValueLabel: 'Other' },
      ],
    },
    {
      filterOptionKey: 'vendorDistance',
      filterOptionLabel: 'Filter by vendor distance',
      filterOptionValues: [
        { filterOptionValueKey: 'under1km', filterOptionValueLabel: '< 1km away' },
        { filterOptionValueKey: 'under5km', filterOptionValueLabel: '< 5km away' },
      ],
    },
  ],
}

const defaultTreatJarFilterSelection: SortFilterModalSelection = {
  sortOption: null,
  filterOptions: {
    vendorType: null,
    vendorDistance: null,
  },
}

const matchesDistanceFilter = (distanceKm: number | undefined, distanceFilter: string | null | undefined) => {
  if (!distanceFilter) return true
  if (distanceKm === undefined) return false
  if (distanceFilter === 'under1km') return distanceKm < 1
  if (distanceFilter === 'under5km') return distanceKm < 5
  return true
}

export function TreatJarScreen() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [searchValue, setSearchValue] = useState('')
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)
  const [filterSelection, setFilterSelection] = useState<SortFilterModalSelection>(
    defaultTreatJarFilterSelection,
  )
  const [merchants, setMerchants] = useState<Merchant[]>([])
  const [userCards, setUserCards] = useState<LoyaltyCard[]>([])
  const [rewardsByMerchant, setRewardsByMerchant] = useState<Record<string, Reward[]>>({})
  const [coords, setCoords] = useState<Coordinates | null>(null)

  const treatUnitCollectedLabel = `${brand.treatUnitPlural} Collected`

  useEffect(() => {
    getMerchants().then(async (allMerchants) => {
      setMerchants(allMerchants)
      const rewardsMap = await getRewardsForMerchants(allMerchants.map((m) => m.id))
      setRewardsByMerchant(rewardsMap)
    })

    getCurrentPosition().then(setCoords).catch(() => setCoords(null))
  }, [])

  useEffect(() => {
    if (!user) return
    getUserCards(user.id).then(setUserCards)
  }, [user?.id])

  const treatJarCards = useMemo<Array<HomeTreatCard & { distanceKm?: number; category: string | null }>>(() => {
    return merchants.map((merchant) => {
      const rewards = rewardsByMerchant[merchant.id] ?? []
      const requiredCount = cheapestActiveCost(rewards)
      const existingCard = userCards.find((c) => c.merchant_id === merchant.id)
      const collectedCount = existingCard?.stamps_current ?? 0
      const isReady = collectedCount >= requiredCount
      const distanceKm = coords && merchant.lat != null && merchant.lng != null
        ? haversineDistanceKm(coords, { lat: merchant.lat, lng: merchant.lng })
        : undefined

      return {
        id: merchant.id,
        vendorId: merchant.id,
        vendorName: merchant.name,
        logoSrc: merchant.logo_url ?? candyIcon,
        logoAlt: `${merchant.name} logo`,
        collectedCount,
        requiredCount,
        actionLabel: isReady ? 'REDEEM BIG TREAT' : 'VIEW BIG TREATS',
        background: 'white',
        locationText: distanceKm !== undefined
          ? (distanceKm < 1 ? `${Math.round(distanceKm * 1000)}m` : `${distanceKm.toFixed(1)}km`)
          : undefined,
        distanceKm,
        category: merchant.category,
      }
    })
  }, [merchants, rewardsByMerchant, userCards, coords])

  const visibleCards = useMemo(() => {
    const normalizedQuery = searchValue.trim().toLowerCase()
    const vendorTypeFilter = filterSelection.filterOptions.vendorType
    const vendorDistanceFilter = filterSelection.filterOptions.vendorDistance

    const filteredCards = treatJarCards.filter((card) => {
      const matchesSearch = normalizedQuery
        ? card.vendorName.toLowerCase().includes(normalizedQuery)
        : true
      const matchesVendorType = vendorTypeFilter ? card.category === vendorTypeFilter : true
      const matchesVendorDistance = matchesDistanceFilter(card.distanceKm, vendorDistanceFilter)

      return matchesSearch && matchesVendorType && matchesVendorDistance
    })

    const sortedCards = [...filteredCards]

    if (filterSelection.sortOption === 'closestVendor') {
      sortedCards.sort(
        (leftCard, rightCard) =>
          (leftCard.distanceKm ?? Number.POSITIVE_INFINITY) - (rightCard.distanceKm ?? Number.POSITIVE_INFINITY),
      )
    }

    if (filterSelection.sortOption === 'leastTreatsToRedeem') {
      sortedCards.sort((leftCard, rightCard) => {
        const leftRemainingTreats = leftCard.requiredCount - leftCard.collectedCount
        const rightRemainingTreats = rightCard.requiredCount - rightCard.collectedCount

        return leftRemainingTreats - rightRemainingTreats
      })
    }

    return sortedCards
  }, [filterSelection, searchValue, treatJarCards])

  const goHome = () => {
    navigate('/', { replace: true })
  }

  const goToVendor = (vendorId: string) => {
    navigate(`/vendor/${vendorId}/redeem`, {
      state: { from: '/treat-jar' },
    })
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

        <h1 className={styles.headerTitle}>TREAT JAR</h1>

        <button
          className={styles.headerButton}
          type="button"
          aria-label={`Go to ${brand.appName} home`}
          onClick={goHome}
        >
          <img className={styles.homeIcon} src={candyIcon} alt="" aria-hidden="true" />
        </button>
      </header>

      <section className={styles.introSection}>
        <p className={styles.description}>
          Explore your treat jar to discover vendors you may want to shop with
        </p>

        <SearchFilterRow
          inputId="treat-jar-search"
          className={styles.searchRow}
          textFieldClassName={styles.searchFieldWrap}
          fieldClassName={styles.searchField}
          inputClassName={styles.searchInput}
          filterButtonClassName={styles.filterButton}
          filterIconClassName={styles.filterIcon}
          label="Search vendors by name"
          value={searchValue}
          onChange={setSearchValue}
          onFilterClick={() => setIsFilterModalOpen(true)}
          placeholder="Search for vendor's name"
          filterAriaLabel="Filter vendors"
          isFilterActive={hasActiveSortFilterSelection(filterSelection)}
        />
      </section>

      <section className={styles.cardsSection} aria-labelledby="treat-jar-vendors-heading">
        <h2 className={styles.visuallyHidden} id="treat-jar-vendors-heading">
          Treat jar vendors
        </h2>

        <div className={styles.cardsScroller}>
          <div className={styles.cardsStack}>
            {visibleCards.map((card) => (
              <TreatCard
                key={card.id}
                vendorName={card.vendorName}
                logoSrc={card.logoSrc}
                logoAlt={card.logoAlt}
                collectedCount={card.collectedCount}
                requiredCount={card.requiredCount}
                treatUnitLabel={treatUnitCollectedLabel}
                expiryText={card.expiryText}
                actionLabel={card.actionLabel}
                background={card.background}
                locationText={card.locationText}
                locationIconSrc={locationIcon}
                onAction={() => goToVendor(card.vendorId)}
              />
            ))}
          </div>
        </div>

        <div className={styles.jarArtWrap} aria-hidden="true">
          <img className={styles.jarArt} src={jarArt} alt="" />
          <span className={styles.jarLabel}>TREAT JAR</span>
        </div>
      </section>

      <SortFilterModal
        isOpen={isFilterModalOpen}
        config={treatJarFilterConfig}
        initialSelection={filterSelection}
        onApply={setFilterSelection}
        onClose={() => setIsFilterModalOpen(false)}
      />
    </main>
  )
}
