import type { PropsWithChildren } from 'react'
import { useLocation } from 'react-router-dom'

import styles from './PageTransition.module.css'

// Entrance-only fade+slide, replayed by remounting the wrapper whenever the
// "page key" changes. Full crossfade (animating the outgoing page out too)
// would need to hold the previous route in the DOM — real added complexity
// not justified for this pass.
//
// Keyed coarser than the raw pathname for /vendor/:vendorId/:tab/:rewardId?
// routes: that's really one screen with sub-navigation (tab switch, reward
// modal open/close) encoded in the URL via replace-navigation, not a move to
// a new page — replaying the entrance animation on every tab switch or
// reward-modal toggle would fight with their own dedicated transitions.
// Switching to a *different* vendor still replays it (first 3 segments).
function getPageKey(pathname: string): string {
  if (pathname.startsWith('/vendor/')) {
    return pathname.split('/').slice(0, 3).join('/')
  }
  return pathname
}

export function PageTransition({ children }: PropsWithChildren) {
  const location = useLocation()

  return (
    <div key={getPageKey(location.pathname)} className={styles.page}>
      {children}
    </div>
  )
}
