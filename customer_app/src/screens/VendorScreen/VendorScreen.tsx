import { useEffect, useState } from 'react'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'

import { RedeemTreatModal } from '../../components/RedeemTreatModal'
import { VendorCollectTreatContent } from '../../components/VendorCollectTreatContent'
import { VendorHeroSection } from '../../components/VendorHeroSection'
import { VendorRedeemContent } from '../../components/VendorRedeemContent'
import { VendorTabBar, type VendorTab } from '../../components/VendorTabBar'
import { brand } from '../../config/brand'
import { useAuth } from '../../context/AuthContext'
import { getOrCreateCard, getMerchantRewards, type LoyaltyCard, type Reward } from '../../lib/supabase'
import { getInventoryItems, type InventoryItem } from '../../lib/inventory'
import { EXPIRY_DAYS } from '../../lib/expiry'
import { getCurrentPosition, haversineDistanceKm } from '../../lib/geo'
import type { VendorRewardView, VendorCollectItemView } from '../../types/vendor'

import candyIcon from '../../../export_for_build/assets/liltreat-icon-large.png'
import styles from './VendorScreen.module.css'

type VendorLocationState = {
  from?: string
}

const isVendorTab = (value: string | undefined): value is VendorTab =>
  value === 'redeem' || value === 'collect'

export function VendorScreen() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const { vendorId, tab, rewardId } = useParams<{ vendorId: string; tab?: string; rewardId?: string }>()
  const navigationState = location.state as VendorLocationState | null

  const [card, setCard] = useState<LoyaltyCard | null>(null)
  const [rewards, setRewards] = useState<Reward[]>([])
  const [items, setItems] = useState<InventoryItem[]>([])
  const [distanceText, setDistanceText] = useState<string | undefined>(undefined)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || !vendorId) return

    Promise.all([
      getOrCreateCard(user.id, vendorId),
      getMerchantRewards(vendorId, true),
      getInventoryItems(vendorId),
    ]).then(([loadedCard, loadedRewards, loadedItems]) => {
      setCard(loadedCard)
      setRewards(loadedRewards)
      setItems(loadedItems.filter((item) => item.treats_value > 0))
      setLoading(false)
    })
  }, [user?.id, vendorId])

  // Separate effect: distance depends on the card (for merchant lat/lng), so
  // it runs once the card has loaded rather than racing the fetch above.
  useEffect(() => {
    if (!card?.merchants?.lat || !card?.merchants?.lng) return
    const merchantLat = card.merchants.lat
    const merchantLng = card.merchants.lng

    getCurrentPosition()
      .then((coords) => {
        const distanceKm = haversineDistanceKm(coords, { lat: merchantLat, lng: merchantLng })
        setDistanceText(distanceKm < 1 ? `${Math.round(distanceKm * 1000)}m away` : `${distanceKm.toFixed(1)}km away`)
      })
      .catch(() => undefined)
  }, [card?.merchants?.lat, card?.merchants?.lng])

  if (loading) {
    return (
      <main className={styles.loadingScreen}>
        <p className={styles.loadingText}>Loading…</p>
      </main>
    )
  }

  if (!vendorId || !card) {
    return <Navigate to="/" replace />
  }

  if (!tab || !isVendorTab(tab)) {
    return <Navigate to={`/vendor/${vendorId}/redeem`} replace state={location.state} />
  }

  const activeTab: VendorTab = tab

  if (rewardId && activeTab !== 'redeem') {
    return <Navigate to={`/vendor/${vendorId}/${activeTab}`} replace state={location.state} />
  }

  const rewardViews: VendorRewardView[] = rewards.map((reward) => ({
    id: reward.id,
    title: reward.label,
    description: reward.description ?? '',
    collectedCount: card.stamps_current,
    requiredCount: reward.cost,
    actionLabel: card.stamps_current >= reward.cost ? 'REDEEM NOW' : undefined,
  }))

  const activeReward = rewardId
    ? rewardViews.find((reward) => reward.id === rewardId && Boolean(reward.actionLabel)) ?? null
    : null
  const activeRewardRow = activeReward ? rewards.find((r) => r.id === activeReward.id) ?? null : null

  if (rewardId && !activeReward) {
    return <Navigate to={`/vendor/${vendorId}/redeem`} replace state={location.state} />
  }

  const vendorName = card.merchants?.name ?? 'Vendor'
  const collectItems: VendorCollectItemView[] = items.map((item) => ({
    id: item.id,
    name: item.name,
    treatCount: item.treats_value,
    imageUrl: item.image_url,
    categoryIds: ['all'],
    showInAll: true,
  }))
  const collectCategories = [{ id: 'all', label: 'All items' }]

  const treatUnitCollectedLabel = `${brand.treatUnitPlural} Collected`
  const collectColumnLabel = brand.treatUnitPlural.toUpperCase()
  const redeemDescription = `Below are the big treats you can redeem from ${vendorName}`
  const collectDescription = `Below is a list of items from ${vendorName} and the amount of ${brand.treatUnitPlural} you get for purchasing each`
  const collectPanelSubtitle = `${brand.treatUnitPlural} you earn for each purchase`

  const goHome = () => {
    navigate('/', { replace: true })
  }

  const goBack = () => {
    if (navigationState?.from) {
      navigate(navigationState.from, { replace: true })
      return
    }

    navigate('/', { replace: true })
  }

  const selectTab = (nextTab: VendorTab) => {
    navigate(`/vendor/${vendorId}/${nextTab}`, {
      replace: true,
      state: location.state,
    })
  }

  const openRewardModal = (id: string) => {
    navigate(`/vendor/${vendorId}/redeem/${id}`, {
      replace: true,
      state: location.state,
    })
  }

  const closeRewardModal = () => {
    navigate(`/vendor/${vendorId}/redeem`, {
      replace: true,
      state: location.state,
    })
  }

  return (
    <main className={styles.screen}>
      <VendorHeroSection
        vendor={{
          displayName: vendorName.toUpperCase(),
          distanceText: distanceText ?? 'Distance unavailable',
          collectedCount: card.stamps_current,
          expiryDays: EXPIRY_DAYS,
        }}
        vendorLogoSrc={card.merchants?.logo_url ?? candyIcon}
        vendorLogoAlt={`${vendorName} logo`}
        appName={brand.appName}
        treatUnitPlural={brand.treatUnitPlural}
        onBack={goBack}
        onHome={goHome}
      />

      <section className={styles.panelSection}>
        <div className={styles.panelContent} aria-hidden={Boolean(activeReward)}>
          <VendorTabBar
            activeTab={activeTab}
            collectLabel={collectColumnLabel}
            onTabChange={selectTab}
          />

          {activeTab === 'redeem' ? (
            <VendorRedeemContent
              description={redeemDescription}
              rewards={rewardViews}
              treatUnitLabel={treatUnitCollectedLabel}
              onRewardAction={(reward) => openRewardModal(reward.id)}
            />
          ) : (
            <VendorCollectTreatContent
              description={collectDescription}
              collectHeadingLabel={brand.treatUnitPlural}
              collectPanelSubtitle={collectPanelSubtitle}
              categories={collectCategories}
              items={collectItems}
            />
          )}
        </div>
      </section>

      {activeReward && activeRewardRow && user ? (
        <RedeemTreatModal
          vendorName={vendorName}
          rewardName={activeReward.title}
          treatCost={activeReward.requiredCount}
          treatUnitPlural={brand.treatUnitPlural}
          loyaltyCardId={card.id}
          userId={user.id}
          merchantId={vendorId}
          rewardId={activeRewardRow.id}
          onClose={closeRewardModal}
        />
      ) : null}
    </main>
  )
}
