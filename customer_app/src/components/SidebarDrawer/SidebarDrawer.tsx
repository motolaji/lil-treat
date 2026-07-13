import { useEffect } from 'react'

import { useMountTransition } from '../../hooks/useMountTransition'
import styles from './SidebarDrawer.module.css'

const DRAWER_ANIMATION_DURATION_MS = 260

export type SidebarDrawerItem = {
  id: string
  label: string
  iconSrc: string
}

type SidebarDrawerProps = {
  isOpen: boolean
  appName: string
  brandIconSrc: string
  userNickname: string
  userEmail: string
  userIconSrc: string
  closeIconSrc: string
  chevronIconSrc: string
  logoutIconSrc: string
  items: SidebarDrawerItem[]
  onClose: () => void
  onItemSelect?: (itemId: string) => void
  onLogout?: () => void
}

export function SidebarDrawer({
  isOpen,
  appName,
  brandIconSrc,
  userNickname,
  userEmail,
  userIconSrc,
  closeIconSrc,
  chevronIconSrc,
  logoutIconSrc,
  items,
  onClose,
  onItemSelect,
  onLogout,
}: SidebarDrawerProps) {
  const { shouldRender, animationClass } = useMountTransition(isOpen, DRAWER_ANIMATION_DURATION_MS)

  useEffect(() => {
    if (!shouldRender) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose, shouldRender])

  if (!shouldRender) return null

  return (
    <div className={`${styles.overlay} ${styles[animationClass] ?? ''}`}>
      <button
        className={styles.scrim}
        type="button"
        aria-label="Close navigation menu"
        onClick={onClose}
      />

      <aside
        id="sidebar-drawer"
        className={styles.drawer}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sidebar-drawer-title"
      >
        <div className={styles.header}>
          <img className={styles.brandIcon} src={brandIconSrc} alt="" aria-hidden="true" />
          <button
            className={styles.closeButton}
            type="button"
            aria-label="Close navigation menu"
            onClick={onClose}
          >
            <img className={styles.closeIcon} src={closeIconSrc} alt="" aria-hidden="true" />
          </button>
        </div>

        <div className={styles.brandBlock}>
          <h2 className={styles.brandName} id="sidebar-drawer-title">
            {appName}
          </h2>
          <span className={styles.brandUnderline} aria-hidden="true" />
        </div>

        <button
          className={styles.profileButton}
          type="button"
          aria-label={`Open profile for ${userNickname}`}
          onClick={() => onItemSelect?.('profile')}
        >
          <img className={styles.profileIcon} src={userIconSrc} alt="" aria-hidden="true" />
          <span className={styles.profileCopy}>
            <span className={styles.profileName}>{userNickname}</span>
            <span className={styles.profileEmail}>{userEmail}</span>
          </span>
          <img className={styles.profileChevron} src={chevronIconSrc} alt="" aria-hidden="true" />
        </button>

        <span className={styles.divider} aria-hidden="true" />

        <nav className={styles.menu} aria-label="Sidebar navigation">
          {items.map((item) => (
            <button
              key={item.id}
              className={styles.menuItem}
              type="button"
              aria-label={item.label}
              onClick={() => onItemSelect?.(item.id)}
            >
              <img className={styles.menuIcon} src={item.iconSrc} alt="" aria-hidden="true" />
              <span className={styles.menuLabel}>{item.label}</span>
              <img className={styles.menuChevron} src={chevronIconSrc} alt="" aria-hidden="true" />
            </button>
          ))}
        </nav>

        <div className={styles.logoutSection}>
          <span className={styles.divider} aria-hidden="true" />
          <button
            className={styles.logoutButton}
            type="button"
            aria-label="Log out"
            onClick={() => onLogout?.()}
          >
            <img className={styles.logoutIcon} src={logoutIconSrc} alt="" aria-hidden="true" />
            <span className={styles.logoutLabel}>Log Out</span>
          </button>
        </div>
      </aside>
    </div>
  )
}
