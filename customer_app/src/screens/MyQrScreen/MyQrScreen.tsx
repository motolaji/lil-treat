import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import QRDisplay from '../../components/QRDisplay/QRDisplay'
import { useAuth } from '../../context/AuthContext'
import { withExpiry } from '../../lib/qrExpiry'

import homeIcon from '../../../export_for_build/icons-pack/home.svg'
import styles from './MyQrScreen.module.css'

export function MyQrScreen() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [payload, setPayload] = useState('')

  useEffect(() => {
    if (!user) return

    function refresh() {
      if (!user) return
      setPayload(JSON.stringify(withExpiry({
        type: 'consumer',
        user_handle: user.handle,
        user_id: user.id,
      })))
    }

    refresh()
    const interval = setInterval(refresh, 60_000)
    return () => clearInterval(interval)
  }, [user?.id, user?.handle])

  const goHome = () => {
    navigate('/', { replace: true })
  }

  return (
    <main className={styles.screen}>
      <header className={styles.header}>
        <button className={styles.homeButton} type="button" aria-label="Go home" onClick={goHome}>
          <img src={homeIcon} alt="" aria-hidden="true" className={styles.homeIcon} />
        </button>
        <h1 className={styles.title}>MY QR CODE</h1>
      </header>

      <p className={styles.description}>Show this to a vendor to collect treats on a purchase</p>

      <div className={styles.qrWrap}>
        {payload ? <QRDisplay value={payload} size={240} /> : <p className={styles.loading}>Loading…</p>}
      </div>
    </main>
  )
}
