import type {
  TouchEvent,
  UIEvent,
  WheelEvent,
  Ref,
} from 'react'

import searchIcon from '../../../export_for_build/icons-pack/search.svg'

import { TextField } from '../TextField'
import { TreatCard } from '../TreatCard'
import type { HomeTreatCard } from '../../types/treatCard'
import styles from './MyTreatsPane.module.css'

export type TreatsSheetMode = 'collapsed' | 'expanded' | 'search'

type MyTreatsPaneProps = {
  treatsSheetMode: TreatsSheetMode
  visibleTreatCards: HomeTreatCard[]
  treatUnitCollectedLabel: string
  searchValue: string
  cardViewportRef: Ref<HTMLDivElement>
  onSearchChange: (value: string) => void
  onSearchOpen: () => void
  onToggle: () => void
  onWheel: (event: WheelEvent<HTMLElement>) => void
  onTouchStart: (event: TouchEvent<HTMLElement>) => void
  onTouchEnd: (event: TouchEvent<HTMLElement>) => void
  onCardViewportScroll: (event: UIEvent<HTMLDivElement>) => void
  onCardAction: (vendorId: string) => void
}

export function MyTreatsPane({
  treatsSheetMode,
  visibleTreatCards,
  treatUnitCollectedLabel,
  searchValue,
  cardViewportRef,
  onSearchChange,
  onSearchOpen,
  onToggle,
  onWheel,
  onTouchStart,
  onTouchEnd,
  onCardViewportScroll,
  onCardAction,
}: MyTreatsPaneProps) {
  const isTreatsExpanded = treatsSheetMode !== 'collapsed'
  const isSearchVisible = treatsSheetMode === 'search'

  return (
    <section
      className={`${styles.treatsSection} ${
        isTreatsExpanded ? styles.treatsSectionExpanded : styles.treatsSectionCollapsed
      }`}
      aria-labelledby="my-treats-heading"
      onWheel={onWheel}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <button
        className={styles.handleButton}
        type="button"
        aria-label={isTreatsExpanded ? 'Collapse my treats' : 'Expand my treats'}
        aria-expanded={isTreatsExpanded}
        onClick={onToggle}
      >
        <span className={styles.dragHandle} aria-hidden="true" />
      </button>

      <div className={styles.treatsHeader}>
        <div className={styles.treatsCopy}>
          <h1 className={styles.treatsTitle} id="my-treats-heading">
            My Treats
          </h1>
          <p className={styles.treatsSubtitle}>You have some big treats coming up</p>
        </div>

        {!isSearchVisible ? (
          <button
            className={styles.searchButton}
            type="button"
            aria-label="Search treats"
            onClick={onSearchOpen}
          >
            <img
              className={styles.searchIcon}
              src={searchIcon}
              alt=""
              aria-hidden="true"
            />
          </button>
        ) : null}
      </div>

      <div className={styles.contentViewport}>
        {isSearchVisible ? (
          <TextField
            id="home-treat-search"
            className={styles.searchFieldWrap}
            fieldClassName={styles.searchField}
            inputClassName={styles.searchInput}
            label="Search vendors by name"
            hideLabel
            type="search"
            value={searchValue}
            onChange={onSearchChange}
            placeholder="Type vendor name"
            autoComplete="off"
            ariaLabel="Search vendors by name"
            autoFocus
            variant="inverted"
          />
        ) : null}

        <div
          ref={cardViewportRef}
          className={`${styles.cardViewport} ${
            isTreatsExpanded ? styles.cardViewportExpanded : styles.cardViewportCollapsed
          }`}
          onScroll={onCardViewportScroll}
        >
          {visibleTreatCards.length > 0 ? (
            visibleTreatCards.map((card) => (
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
                onAction={() => onCardAction(card.vendorId)}
              />
            ))
          ) : (
            <p className={styles.emptyState}>No vendors match your search yet.</p>
          )}
        </div>
      </div>
    </section>
  )
}
