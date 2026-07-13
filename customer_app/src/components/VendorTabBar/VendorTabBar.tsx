import styles from './VendorTabBar.module.css'

export type VendorTab = 'redeem' | 'collect'

type VendorTabBarProps = {
  activeTab: VendorTab
  collectLabel: string
  onTabChange: (tab: VendorTab) => void
}

export function VendorTabBar({ activeTab, collectLabel, onTabChange }: VendorTabBarProps) {
  const handleTabChange = (nextTab: VendorTab) => {
    if (nextTab === activeTab) {
      return
    }

    onTabChange(nextTab)
  }

  return (
    <div className={styles.tabBar} role="tablist" aria-label="Vendor treat views">
      <button
        className={`${styles.tabButton} ${activeTab === 'redeem' ? styles.tabButtonActive : ''}`}
        type="button"
        role="tab"
        aria-selected={activeTab === 'redeem'}
        onClick={() => handleTabChange('redeem')}
      >
        REDEEM BIG TREATS
      </button>

      <span className={styles.tabDivider} aria-hidden="true">
        |
      </span>

      <button
        className={`${styles.tabButton} ${activeTab === 'collect' ? styles.tabButtonActive : ''}`}
        type="button"
        role="tab"
        aria-selected={activeTab === 'collect'}
        onClick={() => handleTabChange('collect')}
      >
        COLLECT {collectLabel}
      </button>
    </div>
  )
}
