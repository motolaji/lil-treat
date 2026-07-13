import { useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { TextField } from '../../components/TextField'
import { brand } from '../../config/brand'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

import homeIcon from '../../../export_for_build/icons-pack/home.svg'
import brandIcon from '../../../export_for_build/assets/liltreat-icon-large.png'
import jarArt from '../../../export_for_build/assets/jar-art.svg'
import styles from './LoginScreen.module.css'

type LoginErrors = {
  email: string
  password: string
}

type LoginLocationState = {
  redirectTo?: string
  redirectState?: unknown
}

const emptyErrors: LoginErrors = {
  email: '',
  password: '',
}

export function LoginScreen() {
  const navigate = useNavigate()
  const location = useLocation()
  const { refreshUser } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<LoginErrors>(emptyErrors)
  const [authError, setAuthError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const loginState = (location.state as LoginLocationState | null) ?? null

  const goHome = () => {
    navigate('/', { replace: true })
  }

  const goToSignUp = () => {
    navigate('/sign-up', {
      state: {
        from: '/login',
        redirectTo: loginState?.redirectTo,
        redirectState: loginState?.redirectState,
      },
    })
  }

  const completeLogin = () => {
    navigate(loginState?.redirectTo ?? '/', {
      replace: true,
      state: loginState?.redirectState,
    })
  }

  const validate = (): LoginErrors => ({
    email: !email.trim()
      ? 'Please enter your email address.'
      : !email.includes('@')
        ? 'Please enter a valid email address.'
        : '',
    password: !password.trim() ? 'Please enter your password.' : '',
  })

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setAuthError('')

    const nextErrors = validate()
    setErrors(nextErrors)

    if (nextErrors.email || nextErrors.password) {
      return
    }

    setSubmitting(true)
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    setSubmitting(false)

    if (error) {
      setAuthError(error.message)
      return
    }

    await refreshUser()
    completeLogin()
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

      <section className={styles.hero} aria-label={`${brand.appName} login welcome`}>
        <img className={styles.brandImage} src={brandIcon} alt={`${brand.appName} candy icon`} />
        <h1 className={styles.title}>{brand.appName}</h1>
        <p className={styles.tagline}>Collect {brand.treatUnitPlural}, redeem Big Treats</p>
      </section>

      <form className={styles.form} noValidate onSubmit={handleSubmit}>
        <div className={styles.fields}>
          <TextField
            id="login-email"
            label="Email"
            type="email"
            value={email}
            onChange={(nextValue) => {
              setEmail(nextValue)
              if (errors.email) {
                setErrors((current) => ({ ...current, email: '' }))
              }
            }}
            placeholder="you@example.com"
            autoComplete="email"
            inputMode="email"
            errorMessage={errors.email}
          />

          <TextField
            id="login-password"
            label="Password"
            type="password"
            value={password}
            onChange={(nextValue) => {
              setPassword(nextValue)
              if (errors.password) {
                setErrors((current) => ({ ...current, password: '' }))
              }
            }}
            placeholder="Create a password"
            autoComplete="current-password"
            errorMessage={errors.password}
          />
        </div>

        <button className={styles.forgotPasswordButton} type="button">
          Forgot Password?
        </button>

        {authError ? (
          <p className={styles.signUpPrompt} role="alert" style={{ color: '#DC2626' }}>
            {authError}
          </p>
        ) : null}

        <button className={styles.loginButton} type="submit" disabled={submitting}>
          {submitting ? 'Logging in…' : 'Log In'}
        </button>

        <div className={styles.separator} aria-hidden="true">
          <span className={styles.separatorLine} />
          <span className={styles.separatorText}>OR</span>
          <span className={styles.separatorLine} />
        </div>

        <button className={styles.googleButton} type="button" disabled title="Coming soon">
          Continue with Google
        </button>

        <p className={styles.signUpPrompt}>
          Don't have an account?{' '}
          <button className={styles.signUpTextButton} type="button" onClick={goToSignUp}>
            Sign up
          </button>
        </p>
      </form>

      <div className={styles.jarArtWrap} aria-hidden="true">
        <img className={styles.jarArt} src={jarArt} alt="" />
      </div>
    </main>
  )
}
