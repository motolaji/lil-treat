import { useEffect, useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'

import { ProfileIdentitySummary } from '../../components/ProfileIdentitySummary'
import { TextField } from '../../components/TextField'
import { brand } from '../../config/brand'
import { useAuth } from '../../context/AuthContext'
import { updateHandle } from '../../lib/supabase'

import backIcon from '../../../export_for_build/icons-pack/back.svg'
import candyIcon from '../../../export_for_build/assets/liltreat-icon-large.png'
import styles from './ProfileNicknameEditScreen.module.css'

type ProfileNicknameEditLocationState = {
  returnTo?: string
  profilePath?: '/profile-email-login' | '/profile-google-login'
}

export function ProfileNicknameEditScreen() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, email, isAnonymous, loading, refreshUser } = useAuth()
  const locationState = (location.state as ProfileNicknameEditLocationState | null) ?? null
  const isGoogleAuthProfile = false
  const [nickname, setNickname] = useState(user?.handle ?? '')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (user) setNickname(user.handle)
  }, [user?.handle])

  if (loading) return null
  if (isAnonymous || !user) {
    return <Navigate to="/" replace />
  }

  const profileReturnPath = locationState?.returnTo ?? '/'
  const profilePath = locationState?.profilePath ?? '/profile-email-login'

  const goBackToProfile = () => {
    navigate(profilePath, {
      replace: true,
      state: {
        from: profileReturnPath,
      },
    })
  }

  const goHome = () => {
    navigate('/', { replace: true })
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const normalizedNickname = nickname.trim()

    if (!normalizedNickname) {
      setErrorMessage('Please enter a nickname.')
      return
    }

    await updateHandle(user.id, normalizedNickname)
    await refreshUser()
    navigate(profilePath, {
      replace: true,
      state: {
        from: profileReturnPath,
      },
    })
  }

  return (
    <main className={styles.screen}>
      <header className={styles.header}>
        <button
          className={styles.headerButton}
          type="button"
          aria-label="Back to profile"
          onClick={goBackToProfile}
        >
          <img className={styles.backIcon} src={backIcon} alt="" aria-hidden="true" />
        </button>

        <h1 className={styles.headerTitle}>EDIT NICKNAME</h1>

        <button
          className={styles.headerButton}
          type="button"
          aria-label={`Go to ${brand.appName} home`}
          onClick={goHome}
        >
          <img className={styles.homeIcon} src={candyIcon} alt="" aria-hidden="true" />
        </button>
      </header>

      <section className={styles.contentSection} aria-labelledby="edit-nickname-title">
        <form className={styles.form} noValidate onSubmit={handleSubmit}>
          <div className={styles.contentInner}>
            <ProfileIdentitySummary
              titleId="edit-nickname-title"
              name={user.handle}
              email={email ?? ''}
              badgeText={isGoogleAuthProfile ? 'Signed in with Google' : undefined}
            />

            <p className={styles.description}>Enter the new nickname you want to go by</p>

            <div className={styles.fieldSection}>
              <TextField
                id="profile-nickname"
                className={styles.nicknameFieldRoot}
                label="Nickname"
                labelClassName={styles.nicknameLabel}
                fieldClassName={styles.nicknameField}
                inputClassName={styles.nicknameInput}
                errorClassName={styles.nicknameError}
                value={nickname}
                onChange={(nextValue) => {
                  setNickname(nextValue)
                  if (errorMessage) {
                    setErrorMessage('')
                  }
                }}
                autoComplete="nickname"
                errorMessage={errorMessage}
                autoFocus
              />
            </div>
          </div>

          <button className={styles.saveButton} type="submit">
            Save Changes
          </button>
        </form>
      </section>
    </main>
  )
}
