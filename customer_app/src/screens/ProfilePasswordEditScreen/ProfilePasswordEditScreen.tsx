import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'

import { ProfileIdentitySummary } from '../../components/ProfileIdentitySummary'
import { TextField } from '../../components/TextField'
import { brand } from '../../config/brand'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'

import backIcon from '../../../export_for_build/icons-pack/back.svg'
import candyIcon from '../../../export_for_build/assets/liltreat-icon-large.png'
import styles from './ProfilePasswordEditScreen.module.css'

type ProfilePasswordEditLocationState = {
  returnTo?: string
}

type PasswordErrors = {
  currentPassword: string
  password: string
  confirmPassword: string
}

const emptyErrors: PasswordErrors = {
  currentPassword: '',
  password: '',
  confirmPassword: '',
}

export function ProfilePasswordEditScreen() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, email, isAnonymous, loading } = useAuth()
  const locationState = (location.state as ProfilePasswordEditLocationState | null) ?? null
  const [currentPassword, setCurrentPassword] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState<PasswordErrors>(emptyErrors)

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

    const normalizedCurrentPassword = currentPassword.trim()
    const normalizedPassword = password.trim()
    const normalizedConfirmPassword = confirmPassword.trim()

    const nextErrors: PasswordErrors = {
      currentPassword: !normalizedCurrentPassword ? 'Please enter your current password.' : '',
      password: !normalizedPassword ? 'Please enter a new password.' : '',
      confirmPassword: !normalizedConfirmPassword
        ? 'Please confirm your new password.'
        : normalizedConfirmPassword !== normalizedPassword
          ? 'Passwords do not match.'
          : '',
    }

    setErrors(nextErrors)

    if (nextErrors.currentPassword || nextErrors.password || nextErrors.confirmPassword) {
      return
    }

    // No direct "verify current password" endpoint exists in supabase-js —
    // re-authenticating with it is the standard way to confirm it's correct.
    if (email) {
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email,
        password: normalizedCurrentPassword,
      })
      if (verifyError) {
        setErrors((current) => ({ ...current, currentPassword: 'Current password is incorrect.' }))
        return
      }
    }

    const { error } = await supabase.auth.updateUser({ password: normalizedPassword })
    if (error) {
      setErrors((current) => ({ ...current, password: error.message }))
      return
    }

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

        <h1 className={styles.headerTitle}>EDIT PASSWORD</h1>

        <button
          className={styles.headerButton}
          type="button"
          aria-label={`Go to ${brand.appName} home`}
          onClick={goHome}
        >
          <img className={styles.homeIcon} src={candyIcon} alt="" aria-hidden="true" />
        </button>
      </header>

      <section className={styles.contentSection} aria-labelledby="edit-password-title">
        <form className={styles.form} noValidate onSubmit={handleSubmit}>
          <div className={styles.contentInner}>
            <ProfileIdentitySummary
              titleId="edit-password-title"
              name={user.handle}
              email={email ?? ''}
            />

            <p className={styles.description}>Enter the new password you want to use</p>

            <div className={styles.fieldStack}>
              <TextField
                id="profile-password-current"
                className={styles.fieldRoot}
                label="Current Password"
                labelClassName={styles.fieldLabel}
                fieldClassName={styles.fieldBox}
                inputClassName={styles.fieldInput}
                errorClassName={styles.fieldError}
                value={currentPassword}
                onChange={(nextValue) => {
                  setCurrentPassword(nextValue)
                  if (errors.currentPassword) {
                    setErrors((current) => ({ ...current, currentPassword: '' }))
                  }
                }}
                type="password"
                autoComplete="current-password"
                errorMessage={errors.currentPassword}
                autoFocus
              />

              <TextField
                id="profile-password"
                className={styles.fieldRoot}
                label="New Password"
                labelClassName={styles.fieldLabel}
                fieldClassName={styles.fieldBox}
                inputClassName={styles.fieldInput}
                errorClassName={styles.fieldError}
                value={password}
                onChange={(nextValue) => {
                  setPassword(nextValue)
                  if (errors.password) {
                    setErrors((current) => ({ ...current, password: '' }))
                  }
                }}
                type="password"
                autoComplete="new-password"
                errorMessage={errors.password}
              />

              <TextField
                id="profile-password-confirm"
                className={styles.fieldRoot}
                label="Confirm Password"
                labelClassName={styles.fieldLabel}
                fieldClassName={styles.fieldBox}
                inputClassName={styles.fieldInput}
                errorClassName={styles.fieldError}
                value={confirmPassword}
                onChange={(nextValue) => {
                  setConfirmPassword(nextValue)
                  if (errors.confirmPassword) {
                    setErrors((current) => ({ ...current, confirmPassword: '' }))
                  }
                }}
                type="password"
                autoComplete="new-password"
                errorMessage={errors.confirmPassword}
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
