/**
 * Admin authentication screen.
 *
 * The bootstrap order is deliberate and mirrors the original screen:
 *   1. ask the backend whether an admin account exists,
 *   2. show the registration form when it does not, the login form when it does,
 *   3. render the dashboard only once a valid session exists.
 *
 * Every request goes through `@/lib/api` so the base URL lives in one place,
 * and the JWT is stored through `@/lib/session` so the token and the auth flag
 * can never drift apart.
 */

import { useCallback, useEffect, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react'

import AdminDashboard from '@/components/admin/AdminDashboard'
import {
  ApiError,
  UNAUTHORIZED_EVENT,
  adminLogin,
  adminRegister,
  getAdminStatus,
} from '@/lib/api'
import { BRAND } from '@/lib/brand'
import { clearSession, isSessionValid, setSession } from '@/lib/session'

type AuthView = 'login' | 'register'

/** Friendlier copy than the raw transport failure for an unreachable API. */
const NETWORK_ERROR =
  'We could not reach the server. Please check your connection and try again.'

/**
 * Surfaces the backend's own wording ("Admin not found", "Wrong password", …)
 * and only falls back to a generic line when there is nothing to show.
 */
function describeError(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    if (error.status === 0) return NETWORK_ERROR
    return error.message || fallback
  }
  if (error instanceof Error && error.message) return error.message
  return fallback
}

/* -------------------------------------------------------------------------- */
/* Shared chrome                                                               */
/* -------------------------------------------------------------------------- */

function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="relative flex min-h-screen flex-col items-center overflow-x-hidden bg-background px-4 py-10 sm:py-16">
      {/* Ambient gold light so the card sits inside a lit space */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[30rem] overflow-hidden"
      >
        <div className="absolute left-1/2 top-[-16rem] h-[26rem] w-[26rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute left-1/2 top-[-16rem] h-[26rem] w-[26rem] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative flex w-full max-w-md flex-col items-center">
        {children}

        <Link
          to="/"
          className="mt-8 inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Back to store
        </Link>
      </div>
    </main>
  )
}

function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: ReactNode
}) {
  return (
    <div className="animate-fade-in-up w-full rounded-2xl bg-surface p-6 gold-hairline sm:p-8">
      <div className="flex flex-col items-center text-center">
        <img
          src="/logo-mark.svg"
          alt=""
          aria-hidden="true"
          className="h-12 w-12"
        />
        <p className="eyebrow mt-5">{BRAND.name}</p>
        <h1 className="mt-2 font-display text-3xl leading-tight text-gradient sm:text-4xl">
          {title}
        </h1>
        <div className="rule-gold mt-5 w-24" aria-hidden="true" />
        <p className="mt-4 max-w-xs text-sm text-muted-foreground">{subtitle}</p>
      </div>

      <div className="mt-8">{children}</div>
    </div>
  )
}

function BootScreen() {
  return (
    <AuthShell>
      <div className="animate-fade-in flex w-full flex-col items-center gap-4 rounded-2xl bg-surface p-10 gold-hairline">
        <Loader2
          size={26}
          className="animate-spin text-primary"
          aria-hidden="true"
        />
        <p className="text-sm text-muted-foreground">Verifying admin access…</p>
      </div>
    </AuthShell>
  )
}

/* -------------------------------------------------------------------------- */
/* Fields                                                                      */
/* -------------------------------------------------------------------------- */

interface TextFieldProps {
  id: string
  name: string
  label: string
  type?: 'text' | 'email'
  autoComplete: string
  placeholder: string
  value: string
  onChange: (value: string) => void
  disabled: boolean
}

function TextField({
  id,
  name,
  label,
  type = 'text',
  autoComplete,
  placeholder,
  value,
  onChange,
  disabled,
}: TextFieldProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-xs font-medium uppercase tracking-widest text-muted-foreground"
      >
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        placeholder={placeholder}
        required
        disabled={disabled}
        className="w-full rounded-lg border border-border bg-background px-4 py-3 text-base text-foreground placeholder:text-subtle transition-colors duration-300 hover:border-border-strong focus:border-primary disabled:cursor-not-allowed disabled:opacity-60"
      />
    </div>
  )
}

interface PasswordFieldProps {
  id: string
  name: string
  label: string
  autoComplete: 'current-password' | 'new-password'
  placeholder: string
  value: string
  onChange: (value: string) => void
  disabled: boolean
}

function PasswordField({
  id,
  name,
  label,
  autoComplete,
  placeholder,
  value,
  onChange,
  disabled,
}: PasswordFieldProps) {
  const [isVisible, setIsVisible] = useState(false)

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-xs font-medium uppercase tracking-widest text-muted-foreground"
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={isVisible ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          placeholder={placeholder}
          required
          disabled={disabled}
          className="w-full rounded-lg border border-border bg-background py-3 pl-4 pr-12 text-base text-foreground placeholder:text-subtle transition-colors duration-300 hover:border-border-strong focus:border-primary disabled:cursor-not-allowed disabled:opacity-60"
        />
        <button
          type="button"
          onClick={() => setIsVisible((visible) => !visible)}
          aria-label={isVisible ? 'Hide password' : 'Show password'}
          aria-pressed={isVisible}
          disabled={disabled}
          className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-primary disabled:opacity-50"
        >
          {isVisible ? (
            <EyeOff size={18} aria-hidden="true" />
          ) : (
            <Eye size={18} aria-hidden="true" />
          )}
        </button>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Forms                                                                       */
/* -------------------------------------------------------------------------- */

interface LoginFormProps {
  notice: string | null
  onAuthenticated: (token: string) => void
}

function LoginForm({ notice, onAuthenticated }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isSubmitting) return

    setError(null)
    setIsSubmitting(true)

    try {
      const data = await adminLogin(email.trim(), password)
      onAuthenticated(data.token)
    } catch (err) {
      setError(describeError(err, 'Unable to sign in. Please try again.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} aria-busy={isSubmitting} className="space-y-5">
      {notice && (
        <p
          role="status"
          aria-live="polite"
          className="rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-gold-light"
        >
          {notice}
        </p>
      )}

      <fieldset disabled={isSubmitting} className="m-0 space-y-5 border-0 p-0">
        <TextField
          id="admin-email"
          name="email"
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@damimeridian.com"
          value={email}
          onChange={setEmail}
          disabled={isSubmitting}
        />
        <PasswordField
          id="admin-password"
          name="password"
          label="Password"
          autoComplete="current-password"
          placeholder="Your password"
          value={password}
          onChange={setPassword}
          disabled={isSubmitting}
        />
      </fieldset>

      {error && (
        <p
          role="alert"
          aria-live="assertive"
          // destructive-text is the lighter red: on the destructive/10 panel
          // over the card surface it holds 4.83:1, where plain destructive
          // (#ef4444) drops to 4.47:1.
          className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive-text"
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="btn-gold btn-gold-hover flex w-full items-center justify-center gap-2 rounded-lg px-6 py-3.5 text-sm font-medium uppercase tracking-widest text-primary-foreground disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting && (
          <Loader2 size={16} className="animate-spin" aria-hidden="true" />
        )}
        {isSubmitting ? 'Signing in…' : 'Sign In'}
      </button>
    </form>
  )
}

interface RegisterFormProps {
  onRegistered: (message: string) => void
}

function RegisterForm({ onRegistered }: RegisterFormProps) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isSubmitting) return

    setError(null)
    setIsSubmitting(true)

    try {
      const data = await adminRegister(fullName.trim(), email.trim(), password)
      onRegistered(
        data.message || 'Account created. Sign in with your new credentials.',
      )
    } catch (err) {
      setError(describeError(err, 'Unable to create the admin account.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} aria-busy={isSubmitting} className="space-y-5">
      <fieldset disabled={isSubmitting} className="m-0 space-y-5 border-0 p-0">
        <TextField
          id="admin-name"
          name="fullName"
          label="Full name"
          autoComplete="name"
          placeholder="Your full name"
          value={fullName}
          onChange={setFullName}
          disabled={isSubmitting}
        />
        <TextField
          id="admin-email"
          name="email"
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@damimeridian.com"
          value={email}
          onChange={setEmail}
          disabled={isSubmitting}
        />
        <PasswordField
          id="admin-password"
          name="password"
          label="Password"
          autoComplete="new-password"
          placeholder="Create a password"
          value={password}
          onChange={setPassword}
          disabled={isSubmitting}
        />
      </fieldset>

      {error && (
        <p
          role="alert"
          aria-live="assertive"
          className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive-text mt-4"
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="btn-gold btn-gold-hover flex w-full items-center justify-center gap-2 rounded-lg px-6 py-3.5 text-sm font-medium uppercase tracking-widest text-primary-foreground disabled:cursor-not-allowed disabled:opacity-70 mt-7"
      >
        {isSubmitting && (
          <Loader2 size={16} className="animate-spin" aria-hidden="true" />
        )}
        {isSubmitting ? 'Creating account…' : 'Create Account'}
      </button>
    </form>
  )
}

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [adminExists, setAdminExists] = useState<boolean | null>(null)
  const [view, setView] = useState<AuthView>('login')
  const [notice, setNotice] = useState<string | null>(null)
  const [statusError, setStatusError] = useState<string | null>(null)
  const [isBooting, setIsBooting] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const checkStatus = useCallback(async (): Promise<void> => {
    setStatusError(null)
    try {
      const status = await getAdminStatus()
      setAdminExists(status.adminExists)
      setView(status.adminExists ? 'login' : 'register')
    } catch (error) {
      // The admin may still exist server-side, so fall back to the login form.
      setStatusError(
        describeError(error, 'Could not verify the admin account.'),
      )
      setView('login')
    }
  }, [])

  useEffect(() => {
    let active = true

    // A live session means the admin is already signed in — skip the form.
    if (isSessionValid()) setIsAuthenticated(true)

    void checkStatus().finally(() => {
      if (active) setIsBooting(false)
    })

    return () => {
      active = false
    }
  }, [checkStatus])

  // The API client signals an expired or rejected session. The token has
  // already been cleared at that point, so drop straight back to the login
  // form instead of leaving the admin on a dashboard that cannot save.
  useEffect(() => {
    const handleUnauthorized = () => {
      setIsAuthenticated(false)
      setNotice('Your session expired. Please sign in again.')
      setView('login')
    }

    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized)
    return () =>
      window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized)
  }, [])

  const handleAuthenticated = (token: string) => {
    setSession(token)
    setIsAuthenticated(true)
  }

  const handleRegistered = (message: string) => {
    // An admin now exists, so registration closes and only login remains.
    setAdminExists(true)
    setNotice(message)
    setView('login')
  }

  const handleLogout = () => {
    clearSession()
    setIsAuthenticated(false)
  }

  const handleRetryStatus = () => {
    setIsRefreshing(true)
    void checkStatus().finally(() => setIsRefreshing(false))
  }

  if (isAuthenticated) {
    return <AdminDashboard onLogout={handleLogout} />
  }

  if (isBooting) {
    return <BootScreen />
  }

  const registrationAvailable = adminExists === false

  return (
    <AuthShell>
      <AuthCard
        title={view === 'register' ? 'Create Admin Account' : 'Admin Login'}
        subtitle={
          view === 'register'
            ? 'Set up the first administrator for the store.'
            : 'Sign in to manage products, orders and settings'
        }
      >
        {statusError && (
          <div
            role="alert"
            className="mb-6 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3"
          >
            <p className="text-sm text-destructive-text">{statusError}</p>
            <button
              type="button"
              onClick={handleRetryStatus}
              disabled={isRefreshing}
              className="mt-2 inline-flex min-h-11 items-center gap-2 text-sm text-gold-light underline underline-offset-4 transition-colors hover:text-primary disabled:opacity-60"
            >
              {isRefreshing && (
                <Loader2 size={14} className="animate-spin" aria-hidden="true" />
              )}
              Try again
            </button>
          </div>
        )}

        {view === 'register' ? (
          <RegisterForm onRegistered={handleRegistered} />
        ) : (
          <LoginForm notice={notice} onAuthenticated={handleAuthenticated} />
        )}

        {registrationAvailable && (
          <div className="mt-6 border-t border-border pt-6 text-center">
            <p className="text-sm text-muted-foreground">
              {view === 'register'
                ? 'Already have an account?'
                : 'Setting up the store for the first time?'}
            </p>
            <button
              type="button"
              onClick={() => {
                setNotice(null)
                setView(view === 'register' ? 'login' : 'register')
              }}
              className="btn-outline-gold btn-outline-gold-hover mt-3 inline-flex min-h-11 items-center justify-center rounded-lg px-5 py-2.5 text-center text-xs font-medium uppercase tracking-widest mt-5"
            >
              {view === 'register' ? 'Sign in instead' : 'Create admin account'}
            </button>
          </div>
        )}
      </AuthCard>
    </AuthShell>
  )
}
