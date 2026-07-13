import { useEffect, useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'

import { ProfileIdentitySummary } from '../../components/ProfileIdentitySummary'
import { TextField } from '../../components/TextField'
import { brand } from '../../config/brand'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'

import backIcon from '../../../export_for_build/icons-pack/back.svg'
import candyIcon from '../../../export_for_build/assets/liltreat-icon-large.png'
import styles from './ProfileEmailEditScreen.module.css'

type ProfileEmailEditLocationState = {
  returnTo?: string
}

type EmailErrors = {
  email: string
  confirmEmail: string
}

const emptyErrors: EmailErrors = {
  email: '',
  confirmEmail: '',
}

export function ProfileEmailEditScreen() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, email: currentEmail, isAnonymous, loading, refreshUser } = useAuth()
  const locationState = (location.state as ProfileEmailEditLocationState | null) ?? null
  const [email, setEmail] = useState(currentEmail ?? '')
  const [confirmEmail, setConfirmEmail] = useState('')
  const [errors, setErrors] = useState<EmailErrors>(emptyErrors)
  const [authError, setAuthError] = useState('')

  useEffect(() => {
    if (currentEmail) setEmail(currentEmail)
  }, [currentEmail])

  if (loading) return null
  if (isAnonymous || !user) {
    return <Navigate to="/" replace />
  }

  const profileReturnPath = locationState?.returnTo ?? '/'

  const goBackToProfile = () => {
    navigate('/profile-email-login', {
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
    setAuthError('')

    const normalizedEmail = email.trim()
    const normalizedConfirmEmail = confirmEmail.trim()

    const nextErrors: EmailErrors = {
      email: !normalizedEmail
        ? 'Please enter your email address.'
        : !normalizedEmail.includes('@')
          ? 'Please enter a valid email address.'
          : '',
      confirmEmail: !normalizedConfirmEmail
        ? 'Please confirm your email address.'
        : normalizedConfirmEmail !== normalizedEmail
          ? 'Email addresses do not match.'
          : '',
    }

    setErrors(nextErrors)

    if (nextErrors.email || nextErrors.confirmEmail) {
      return
    }

    const { error } = await supabase.auth.updateUser({ email: normalizedEmail })
    if (error) {
      setAuthError(error.message)
      return
    }

    await refreshUser()
    navigate('/profile-email-login', {
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

        <h1 className={styles.headerTitle}>EDIT EMAIL</h1>

        <button
          className={styles.headerButton}
          type="button"
          aria-label={`Go to ${brand.appName} home`}
          onClick={goHome}
        >
          <img className={styles.homeIcon} src={candyIcon} alt="" aria-hidden="true" />
        </button>
      </header>

      <section className={styles.contentSection} aria-labelledby="edit-email-title">
        <form className={styles.form} noValidate onSubmit={handleSubmit}>
          <div className={styles.contentInner}>
            <ProfileIdentitySummary
              titleId="edit-email-title"
              name={user.handle}
              email={currentEmail ?? ''}
            />

            {authError ? (
              <p className={styles.description} role="alert" style={{ color: '#DC2626' }}>
                {authError}
              </p>
            ) : null}

            <p className={styles.description}>Enter the new email address you want to use</p>

            <div className={styles.fieldStack}>
              <TextField
                id="profile-email"
                className={styles.fieldRoot}
                label="Email"
                labelClassName={styles.fieldLabel}
                fieldClassName={styles.fieldBox}
                inputClassName={styles.fieldInput}
                errorClassName={styles.fieldError}
                value={email}
                onChange={(nextValue) => {
                  setEmail(nextValue)
                  if (errors.email) {
                    setErrors((current) => ({ ...current, email: '' }))
                  }
                }}
                type="email"
                autoComplete="email"
                inputMode="email"
                errorMessage={errors.email}
                autoFocus
              />

              <TextField
                id="profile-email-confirm"
                className={styles.fieldRoot}
                label="Confirm Email"
                labelClassName={styles.fieldLabel}
                fieldClassName={styles.fieldBox}
                inputClassName={styles.fieldInput}
                errorClassName={styles.fieldError}
                value={confirmEmail}
                onChange={(nextValue) => {
                  setConfirmEmail(nextValue)
                  if (errors.confirmEmail) {
                    setErrors((current) => ({ ...current, confirmEmail: '' }))
                  }
                }}
                type="email"
                autoComplete="email"
                inputMode="email"
                errorMessage={errors.confirmEmail}
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
