import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type TouchEvent,
  type WheelEvent,
  type UIEvent,
} from 'react'
import { useNavigate } from 'react-router-dom'

import { LogoutConfirmModal } from '../../components/LogoutConfirmModal'
import { MyTreatsPane, type TreatsSheetMode } from '../../components/MyTreatsPane'
import { SidebarDrawer, type SidebarDrawerItem } from '../../components/SidebarDrawer'
import { brand } from '../../config/brand'
import { mockSidebarItems } from '../../mocks/navigation'
import { useAuth } from '../../context/AuthContext'
import { supabase, getUserCards, getRewardsForMerchants, type LoyaltyCard, type Reward } from '../../lib/supabase'
import { cheapestActiveCost } from '../../lib/rewards'
import { getExpiryStatus } from '../../lib/expiry'
import type { HomeTreatCard } from '../../types/treatCard'

import closeIcon from '../../../export_for_build/icons-pack/close.svg'
import downloadIcon from '../../../export_for_build/icons-pack/download(1).svg'
import hamburgerIcon from '../../../export_for_build/icons-pack/hamburger.svg'
import helpIcon from '../../../export_for_build/icons-pack/help.svg'
import receiptIcon from '../../../export_for_build/icons-pack/receipt.svg'
import chevronIcon from '../../../export_for_build/icons-pack/right-chevron.svg'
import cookieJarIcon from '../../../export_for_build/icons-pack/cookie-jar-infill.svg'
import cookieJarOutlineIcon from '../../../export_for_build/icons-pack/cookie-jar.svg'
import logoutIcon from '../../../export_for_build/icons-pack/logout.svg'
import userIcon from '../../../export_for_build/icons-pack/user-outline.svg'
import qrScannerFrame from '../../../export_for_build/assets/qr-code-scanner-frame.svg'
import brandIcon from '../../../export_for_build/assets/liltreat-icon-large.png'
import styles from './HomeScreen.module.css'

const treatJarPath = '/treat-jar'
const receiptsPath = '/receipts'
const installPath = '/install'
const helpSupportPath = '/help-support'
const loginPath = '/login'
const profileEmailLoginPath = '/profile-email-login'
const sheetSwipeThreshold = 28

const sidebarItemIcons: Record<(typeof mockSidebarItems)[number]['iconKey'], string> = {
  treatJar: cookieJarOutlineIcon,
  receipts: receiptIcon,
  install: downloadIcon,
  helpSupport: helpIcon,
}

export function HomeScreen() {
  const navigate = useNavigate()
  const { user, email, isAnonymous } = useAuth()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false)
  const [treatsSheetMode, setTreatsSheetMode] = useState<TreatsSheetMode>('collapsed')
  const [searchValue, setSearchValue] = useState('')
  const [cards, setCards] = useState<LoyaltyCard[]>([])
  const [rewardsByMerchant, setRewardsByMerchant] = useState<Record<string, Reward[]>>({})
  const touchStartYRef = useRef<number | null>(null)
  const cardViewportRef = useRef<HTMLDivElement | null>(null)

  const treatUnitCollectedLabel = `${brand.treatUnitPlural} Collected`
  const sidebarUserNickname = !isAnonymous && user ? user.handle : 'Log in now'
  const sidebarUserEmail = !isAnonymous && email ? email : 'Not logged in'
  const isTreatsExpanded = treatsSheetMode !== 'collapsed'
  const sidebarDrawerItems: SidebarDrawerItem[] = mockSidebarItems.map((item) => ({
    id: item.id,
    label: item.label,
    iconSrc: sidebarItemIcons[item.iconKey],
  }))

  useEffect(() => {
    if (!user) return
    getUserCards(user.id).then(async (userCards) => {
      setCards(userCards)
      const rewardsMap = await getRewardsForMerchants(userCards.map((c) => c.merchant_id))
      setRewardsByMerchant(rewardsMap)
    })
  }, [user?.id])

  const treatCards = useMemo<HomeTreatCard[]>(() => cards.map((card) => {
    const rewards = rewardsByMerchant[card.merchant_id] ?? []
    const requiredCount = cheapestActiveCost(rewards)
    const isReady = card.stamps_current >= requiredCount
    const expiry = getExpiryStatus(card, rewards)
    const vendorName = card.merchants?.name ?? 'Vendor'

    return {
      id: card.id,
      vendorId: card.merchant_id,
      vendorName,
      logoSrc: card.merchants?.logo_url ?? brandIcon,
      logoAlt: `${vendorName} logo`,
      collectedCount: card.stamps_current,
      requiredCount,
      expiryText: expiry.kind === 'redeems'
        ? `Redeem within ${expiry.daysRemaining} days`
        : `Treats expire in ${expiry.daysRemaining} days`,
      actionLabel: isReady ? 'REDEEM BIG TREAT' : 'VIEW BIG TREATS',
      background: 'black',
    }
  }), [cards, rewardsByMerchant])

  const visibleTreatCards = useMemo(() => {
    const normalizedQuery = searchValue.trim().toLowerCase()

    return normalizedQuery
      ? treatCards.filter((card) => card.vendorName.toLowerCase().includes(normalizedQuery))
      : treatCards
  }, [searchValue, treatCards])

  const openSidebar = () => {
    setIsSidebarOpen(true)
  }

  const closeSidebar = () => {
    setIsSidebarOpen(false)
  }

  const goToTreatJar = () => {
    navigate(treatJarPath)
  }

  const goToVendor = (vendorId: string) => {
    navigate(`/vendor/${vendorId}/redeem`, {
      state: { from: '/' },
    })
  }

  const openClaimTreatPrompt = () => {
    navigate('/scan')
  }

  const handleSidebarItemSelect = (itemId: string) => {
    closeSidebar()

    if (itemId === 'profile') {
      if (isAnonymous) {
        navigate(loginPath)
        return
      }

      navigate(profileEmailLoginPath, {
        state: { from: '/' },
      })
      return
    }

    if (itemId === 'treat-jar') {
      navigate(treatJarPath)
      return
    }

    if (itemId === 'receipts') {
      navigate(receiptsPath)
      return
    }

    if (itemId === 'install') {
      navigate(installPath)
      return
    }

    if (itemId === 'help-support') {
      navigate(helpSupportPath)
    }
  }

  const handleLogout = () => {
    closeSidebar()
    setIsLogoutModalOpen(true)
  }

  const handleConfirmLogout = async () => {
    await supabase.auth.signOut()
    setIsLogoutModalOpen(false)
  }

  const handleCloseLogoutModal = () => {
    setIsLogoutModalOpen(false)
  }

  const expandTreatsSheet = () => {
    setTreatsSheetMode((currentMode) =>
      currentMode === 'collapsed' ? 'expanded' : currentMode,
    )
  }

  const openTreatsSearch = () => {
    setTreatsSheetMode('search')
  }

  const collapseTreatsSheet = () => {
    setTreatsSheetMode('collapsed')
    setSearchValue('')

    if (cardViewportRef.current) {
      cardViewportRef.current.scrollTop = 0
    }
  }

  const isCardViewportAtTop = () => {
    if (!cardViewportRef.current) {
      return true
    }

    return cardViewportRef.current.scrollTop <= 0
  }

  const handleTreatsWheel = (event: WheelEvent<HTMLElement>) => {
    if (!isTreatsExpanded && event.deltaY > 10) {
      expandTreatsSheet()
      return
    }

    if (
      isTreatsExpanded &&
      event.deltaY < -10 &&
      event.currentTarget === event.target &&
      isCardViewportAtTop()
    ) {
      collapseTreatsSheet()
    }
  }

  const handleTreatsTouchStart = (event: TouchEvent<HTMLElement>) => {
    touchStartYRef.current = event.changedTouches[0]?.clientY ?? null
  }

  const handleTreatsTouchEnd = (event: TouchEvent<HTMLElement>) => {
    const touchStartY = touchStartYRef.current

    if (touchStartY === null) {
      return
    }

    const touchEndY = event.changedTouches[0]?.clientY ?? touchStartY
    const swipeDistance = touchStartY - touchEndY
    touchStartYRef.current = null

    if (swipeDistance > sheetSwipeThreshold && !isTreatsExpanded) {
      expandTreatsSheet()
      return
    }

    if (swipeDistance < -sheetSwipeThreshold && isTreatsExpanded && isCardViewportAtTop()) {
      collapseTreatsSheet()
    }
  }

  const handleCardViewportScroll = (event: UIEvent<HTMLDivElement>) => {
    if (!isTreatsExpanded) {
      return
    }

    const viewport = event.currentTarget

    if (viewport.scrollTop < 0) {
      viewport.scrollTop = 0
    }
  }

  const toggleTreatsSheet = () => {
    if (isTreatsExpanded) {
      collapseTreatsSheet()
      return
    }

    expandTreatsSheet()
  }

  return (
    <main className={styles.screen}>
      <LogoutConfirmModal
        isOpen={isLogoutModalOpen}
        collectedTreatCount={cards.reduce((sum, c) => sum + c.stamps_current, 0)}
        visitedVendorCount={new Set(cards.map((c) => c.merchant_id)).size}
        onClose={handleCloseLogoutModal}
        onConfirmLogout={handleConfirmLogout}
      />

      <SidebarDrawer
        isOpen={isSidebarOpen}
        appName={brand.appName}
        brandIconSrc={brandIcon}
        userNickname={sidebarUserNickname}
        userEmail={sidebarUserEmail}
        userIconSrc={userIcon}
        closeIconSrc={closeIcon}
        chevronIconSrc={chevronIcon}
        logoutIconSrc={logoutIcon}
        items={sidebarDrawerItems}
        onClose={closeSidebar}
        onItemSelect={handleSidebarItemSelect}
        onLogout={handleLogout}
      />

      <section
        className={`${styles.topSection} ${isTreatsExpanded ? styles.topSectionExpanded : ''}`}
      >
        <header className={styles.header}>
          <button
            className={styles.iconButton}
            type="button"
            aria-label="Open navigation menu"
            aria-haspopup="dialog"
            aria-expanded={isSidebarOpen}
            aria-controls="sidebar-drawer"
            onClick={openSidebar}
          >
            <img
              className={styles.headerIcon}
              src={hamburgerIcon}
              alt=""
              aria-hidden="true"
            />
          </button>

          <div className={styles.wordmark}>
            <span className={styles.wordmarkText}>{brand.appName}</span>
            <span className={styles.wordmarkUnderline} aria-hidden="true" />
          </div>

          <button
            className={styles.jarBadge}
            type="button"
            aria-label="Open treat jar"
            onClick={goToTreatJar}
          >
            <img className={styles.jarIcon} src={cookieJarIcon} alt="" aria-hidden="true" />
          </button>
        </header>

        {!isTreatsExpanded ? (
          <section className={styles.scannerSection} aria-label="Vendor QR code prompt">
            <button
              className={styles.qrStageButton}
              type="button"
              aria-label="Claim a treat from the vendor QR scan frame"
              onClick={openClaimTreatPrompt}
            >
              <div className={styles.qrStage}>
                <img
                  className={styles.qrFrame}
                  src={qrScannerFrame}
                  alt=""
                  aria-hidden="true"
                />
                <p className={styles.scanLabel}>SCAN VENDOR QR CODE</p>
                <img
                  className={styles.brandIcon}
                  src={brandIcon}
                  alt=""
                  aria-hidden="true"
                />
                <span className={styles.claimButton}>
                  <span className={styles.claimPlus} aria-hidden="true">
                    +
                  </span>
                  CLAIM A TREAT
                </span>
              </div>
            </button>

            <p className={styles.tagline}>
              Collect {brand.treatUnitPlural}, redeem Big Treats
            </p>
          </section>
        ) : null}
      </section>

      <MyTreatsPane
        treatsSheetMode={treatsSheetMode}
        visibleTreatCards={visibleTreatCards}
        treatUnitCollectedLabel={treatUnitCollectedLabel}
        searchValue={searchValue}
        cardViewportRef={cardViewportRef}
        onSearchChange={setSearchValue}
        onSearchOpen={openTreatsSearch}
        onToggle={toggleTreatsSheet}
        onWheel={handleTreatsWheel}
        onTouchStart={handleTreatsTouchStart}
        onTouchEnd={handleTreatsTouchEnd}
        onCardViewportScroll={handleCardViewportScroll}
        onCardAction={goToVendor}
      />
    </main>
  )
}


