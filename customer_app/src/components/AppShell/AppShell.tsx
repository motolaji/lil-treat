import { useEffect, useState, type PropsWithChildren } from 'react'

import styles from './AppShell.module.css'

const mobileViewportMaxWidth = 430

const isMobileViewport = () =>
  typeof window === 'undefined' ? true : window.innerWidth <= mobileViewportMaxWidth

export function AppShell({ children }: PropsWithChildren) {
  const [isMobileOnlyViewport, setIsMobileOnlyViewport] = useState(isMobileViewport)

  useEffect(() => {
    const handleResize = () => {
      setIsMobileOnlyViewport(isMobileViewport())
    }

    handleResize()
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  if (!isMobileOnlyViewport) {
    return (
      <div className={styles.desktopFallback}>
        <div className={styles.desktopFallbackCard}>
          <p className={styles.desktopFallbackTitle}>This app is only for mobile.</p>
          <p className={styles.desktopFallbackMessage}>
            Please open Lil Treat on a mobile device or narrow your browser window.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.shell}>
      <div className={styles.viewport} data-app-viewport>
        {children}
      </div>
    </div>
  )
}
