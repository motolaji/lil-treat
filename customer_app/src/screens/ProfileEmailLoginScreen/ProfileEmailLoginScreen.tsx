import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'

import { LogoutConfirmModal } from '../../components/LogoutConfirmModal'
import { GreyDivider } from '../../components/GreyDivider'
import { ProfileIdentitySummary } from '../../components/ProfileIdentitySummary'
import { brand } from '../../config/brand'
import { useAuth } from '../../context/AuthContext'
import { supabase, getUserCards } from '../../lib/supabase'

import backIcon from '../../../export_for_build/icons-pack/back.svg'
import logoutIcon from '../../../export_for_build/icons-pack/logout.svg'
import mailIcon from '../../../export_for_build/icons-pack/mail.svg'
import padlockIcon from '../../../export_for_build/icons-pack/padlock.svg'
import vendorShopIcon from '../../../export_for_build/icons-pack/shopping-store.svg'
import userIcon from '../../../export_for_build/icons-pack/user-outline.svg'
import cookieJarIcon from '../../../export_for_build/icons-pack/cookie-jar.svg'
import chevronIcon from '../../../export_for_build/icons-pack/right-chevron.svg'
import candyIcon from '../../../export_for_build/assets/liltreat-icon-large.png'
import styles from './ProfileEmailLoginScreen.module.css'

type ProfileDetailLocationState = {
  from?: string
}

type ProfileDetail = {
  id: 'nickname' | 'password' | 'email'
  title: string
  description: string
  iconSrc: string
  editPath:
    | '/profile-email-login/edit-nickname'
    | '/profile-google-login/edit-nickname'
    | '/profile-email-login/edit-password'
    | '/profile-email-login/edit-email'
  editLabel: string
}

export function ProfileDetailScreen() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, email, isAnonymous, loading } = useAuth()
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false)
  const [collectedTreatCount, setCollectedTreatCount] = useState(0)
  const [visitedVendorCount, setVisitedVendorCount] = useState(0)
  const locationState = (location.state as ProfileDetailLocationState | null) ?? null
  const isGoogleAuthProfile = false

  useEffect(() => {
    if (!user) return
    getUserCards(user.id).then((cards) => {
      setCollectedTreatCount(cards.reduce((sum, c) => sum + c.stamps_current, 0))
      setVisitedVendorCount(new Set(cards.map((c) => c.merchant_id)).size)
    })
  }, [user?.id])

  if (loading) return null
  if (isAnonymous || !user) {
    return <Navigate to="/" replace />
  }

  const profileReturnPath = locationState?.from ?? '/'
  const profileDetails: ProfileDetail[] = [
    {
      id: 'nickname',
      title: user.handle,
      description: 'Update your nickname',
      iconSrc: userIcon,
      editPath: '/profile-email-login/edit-nickname',
      editLabel: 'Edit nickname',
    },
    {
      id: 'password',
      title: 'Password',
      description: 'Change your password',
      iconSrc: padlockIcon,
      editPath: '/profile-email-login/edit-password',
      editLabel: 'Edit password',
    },
    {
      id: 'email',
      title: email ?? '',
      description: 'Update your email address',
      iconSrc: mailIcon,
      editPath: '/profile-email-login/edit-email',
      editLabel: 'Edit email',
    },
  ]

  const goBack = () => {
    navigate(profileReturnPath, { replace: true })
  }

  const goHome = () => {
    navigate('/', { replace: true })
  }

  const handleEditProfileDetail = (editPath: ProfileDetail['editPath']) => {
    navigate(editPath, {
      state: {
        returnTo: profileReturnPath,
        profilePath: isGoogleAuthProfile ? '/profile-google-login' : '/profile-email-login',
      },
    })
  }

  const handleLogOut = () => {
    setIsLogoutModalOpen(true)
  }

  const handleConfirmLogout = async () => {
    await supabase.auth.signOut()
    setIsLogoutModalOpen(false)
    navigate('/', { replace: true })
  }

  const handleCloseLogoutModal = () => {
    setIsLogoutModalOpen(false)
  }

  return (
    <main className={styles.screen}>
      <LogoutConfirmModal
        isOpen={isLogoutModalOpen}
        collectedTreatCount={collectedTreatCount}
        visitedVendorCount={visitedVendorCount}
        onClose={handleCloseLogoutModal}
        onConfirmLogout={handleConfirmLogout}
      />
      <header className={styles.header}>
        <button
          className={styles.headerButton}
          type="button"
          aria-label="Back to home"
          onClick={goBack}
        >
          <img className={styles.backIcon} src={backIcon} alt="" aria-hidden="true" />
        </button>

        <h1 className={styles.headerTitle}>PROFILE</h1>

        <button
          className={styles.headerButton}
          type="button"
          aria-label={`Go to ${brand.appName} home`}
          onClick={goHome}
        >
          <img className={styles.homeIcon} src={candyIcon} alt="" aria-hidden="true" />
        </button>
      </header>

      <section className={styles.contentSection} aria-labelledby="profile-screen-title">
        <div className={styles.contentInner}>
          <ProfileIdentitySummary
            titleId="profile-screen-title"
            name={user.handle}
            email={email ?? ''}
            badgeText={undefined}
          />

          <section className={styles.metricsCard} aria-label="Profile activity overview">
            <div className={styles.metricBlock}>
              <img className={styles.metricIcon} src={cookieJarIcon} alt="" aria-hidden="true" />
              <strong className={styles.metricValue}>{collectedTreatCount}</strong>
              <span className={styles.metricLabel}>{brand.treatUnitPlural} Collected</span>
            </div>

            <span className={styles.metricsDivider} aria-hidden="true" />

            <div className={styles.metricBlock}>
              <img className={styles.metricIcon} src={vendorShopIcon} alt="" aria-hidden="true" />
              <strong className={styles.metricValue}>{visitedVendorCount}</strong>
              <span className={styles.metricLabel}>Vendors Visited</span>
            </div>
          </section>

          <section className={styles.detailsSection} aria-label="Profile details">
            {profileDetails.map((detail, index) => (
              <div className={styles.detailRowWrap} key={detail.id}>
                <button
                  className={styles.detailRowButton}
                  type="button"
                  onClick={() => handleEditProfileDetail(detail.editPath)}
                  aria-label={detail.editLabel}
                >
                  <div className={styles.detailRow}>
                    <img className={styles.detailIcon} src={detail.iconSrc} alt="" aria-hidden="true" />

                    <div className={styles.detailCopy}>
                      <h3 className={styles.detailTitle}>{detail.title}</h3>
                      <p className={styles.detailDescription}>{detail.description}</p>
                    </div>

                    <img className={styles.detailChevron} src={chevronIcon} alt="" aria-hidden="true" />
                  </div>
                </button>

                {index < profileDetails.length - 1 ? <GreyDivider className={styles.detailDivider} /> : null}
              </div>
            ))}
          </section>

          <div className={styles.logoutSection}>
            <span className={styles.fadedDivider} aria-hidden="true" />

            <button className={styles.logoutButton} type="button" onClick={handleLogOut}>
              <img className={styles.logoutIcon} src={logoutIcon} alt="" aria-hidden="true" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </section>
    </main>
  )
}
