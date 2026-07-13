import { useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { TextField } from '../../components/TextField'
import { brand } from '../../config/brand'
import { upgradeAccount, updateHandle } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

import homeIcon from '../../../export_for_build/icons-pack/home.svg'
import brandIcon from '../../../export_for_build/assets/liltreat-icon-large.png'
import styles from './SignUpScreen.module.css'

type SignUpErrors = {
  nickname: string
  email: string
  password: string
  confirmPassword: string
  agreement: string
}

type SignUpLocationState = {
  from?: '/login'
  redirectTo?: string
  redirectState?: unknown
}

const emptyErrors: SignUpErrors = {
  nickname: '',
  email: '',
  password: '',
  confirmPassword: '',
  agreement: '',
}

export function SignUpScreen() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, refreshUser } = useAuth()
  const signUpState = (location.state as SignUpLocationState | null) ?? null
  const returnToLogin = signUpState?.from === '/login'

  const [nickname, setNickname] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false)
  const [errors, setErrors] = useState<SignUpErrors>(emptyErrors)
  const [authError, setAuthError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const goHome = () => {
    navigate('/', { replace: true })
  }

  const clearError = (field: keyof SignUpErrors) => {
    setErrors((current) => (current[field] ? { ...current, [field]: '' } : current))
  }

  const validate = (): SignUpErrors => ({
    nickname: !nickname.trim() ? 'Please enter a nickname.' : '',
    email: !email.trim()
      ? 'Please enter your email address.'
      : !email.includes('@')
        ? 'Please enter a valid email address.'
        : '',
    password: !password.trim() ? 'Please create a password.' : '',
    confirmPassword: !confirmPassword.trim()
      ? 'Please confirm your password.'
      : confirmPassword !== password
        ? 'Passwords do not match.'
        : '',
    agreement: hasAcceptedTerms ? '' : 'Please agree to the Terms of Service and Privacy Policy.',
  })

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setAuthError('')

    const nextErrors = validate()
    setErrors(nextErrors)

    if (Object.values(nextErrors).some(Boolean)) {
      return
    }

    setSubmitting(true)
    const { error } = await upgradeAccount(email.trim(), password)
    if (error) {
      setSubmitting(false)
      setAuthError(error)
      return
    }

    if (user) {
      await updateHandle(user.id, nickname.trim())
    }
    await refreshUser()
    setSubmitting(false)

    navigate(signUpState?.redirectTo ?? '/', {
      replace: true,
      state: signUpState?.redirectState,
    })
  }

  const handleLogin = () => {
    if (returnToLogin) {
      navigate(-1)
      return
    }

    navigate('/login', {
      state: {
        redirectTo: signUpState?.redirectTo,
        redirectState: signUpState?.redirectState,
      },
    })
  }

  const handleAgreementToggle = () => {
    const nextValue = !hasAcceptedTerms
    setHasAcceptedTerms(nextValue)

    if (nextValue) {
      clearError('agreement')
    }
  }

  return (
    <main className={styles.screen}>
      <header className={styles.header}>
        <button
          className={styles.homeButton}
          type="button"
          aria-label={`Go to ${brand.appName} home`}
          onClick={goHome}
        >
          <img className={styles.homeIcon} src={homeIcon} alt="" aria-hidden="true" />
        </button>
      </header>

      <section className={styles.hero} aria-label={`${brand.appName} sign up welcome`}>
        <img className={styles.brandImage} src={brandIcon} alt={`${brand.appName} candy icon`} />
        <h1 className={styles.title}>{brand.appName}</h1>
        <h2 className={styles.subtitle}>Create your account</h2>
        <p className={styles.tagline}>Collect {brand.treatUnitPlural}, redeem Big Treats</p>
      </section>

      <form className={styles.form} noValidate onSubmit={handleSubmit}>
        <div className={styles.fields}>
          <TextField
            id="sign-up-nickname"
            label="Nickname"
            value={nickname}
            onChange={(nextValue) => {
              setNickname(nextValue)
              clearError('nickname')
            }}
            placeholder="Who shall all these treats go to :)?"
            autoComplete="nickname"
            errorMessage={errors.nickname}
          />

          <TextField
            id="sign-up-email"
            label="Email"
            type="email"
            value={email}
            onChange={(nextValue) => {
              setEmail(nextValue)
              clearError('email')
            }}
            placeholder="you@example.com"
            autoComplete="email"
            inputMode="email"
            errorMessage={errors.email}
          />

          <TextField
            id="sign-up-password"
            label="Password"
            type="password"
            value={password}
            onChange={(nextValue) => {
              setPassword(nextValue)
              clearError('password')
            }}
            placeholder="Create a password"
            autoComplete="new-password"
            errorMessage={errors.password}
          />

          <TextField
            id="sign-up-confirm-password"
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={(nextValue) => {
              setConfirmPassword(nextValue)
              clearError('confirmPassword')
            }}
            placeholder="Confirm your password"
            autoComplete="new-password"
            errorMessage={errors.confirmPassword}
          />
        </div>

        <div className={styles.agreementBlock}>
          <label className={styles.agreementRow} htmlFor="sign-up-agreement">
            <input
              id="sign-up-agreement"
              className={styles.checkbox}
              type="checkbox"
              checked={hasAcceptedTerms}
              onChange={handleAgreementToggle}
            />
            <span className={styles.agreementText}>
              I agree to the <span className={styles.legalLink}>Terms of Service</span> and{' '}
              <span className={styles.legalLink}>Privacy Policy</span>
            </span>
          </label>

          {errors.agreement ? (
            <p className={styles.agreementError} role="alert">
              {errors.agreement}
            </p>
          ) : null}
        </div>

        {authError ? (
          <p className={styles.loginPrompt} role="alert" style={{ color: '#DC2626' }}>
            {authError}
          </p>
        ) : null}

        <button className={styles.signUpButton} type="submit" disabled={submitting}>
          {submitting ? 'Creating account…' : 'Sign Up'}
        </button>

        <div className={styles.separator} aria-hidden="true">
          <span className={styles.separatorLine} />
          <span className={styles.separatorText}>OR</span>
          <span className={styles.separatorLine} />
        </div>

        <button className={styles.googleButton} type="button" disabled title="Coming soon">
          Continue with Google
        </button>

        <p className={styles.loginPrompt}>
          Already have an account?{' '}
          <button className={styles.loginLinkButton} type="button" onClick={handleLogin}>
            Log in
          </button>
        </p>
      </form>
    </main>
  )
}
