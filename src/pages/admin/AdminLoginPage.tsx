/**
 * Admin sign-in screen (public route).
 *
 * Bootstrap order mirrors the original monolith it was extracted from:
 *   1. ask the backend whether an admin account exists (`/admin/status`),
 *   2. show the login form when it does, a clear "no admin yet" call to
 *      action when it does not (registration is only offered when the
 *      status allows it),
 *   3. hand off to `/admin/dashboard` — behind AdminLayout's guard — once
 *      `setSession()` has stored the fresh JWT.
 *
 * Every request goes through `@/lib/api` so the base URL lives in one place —
 * reached through the React Query hooks — and the JWT is stored through
 * `@/lib/session` so the token and the auth flag can never drift apart.
 */

import { useEffect, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react'

import { useAdminLoginMutation } from '@/hooks/mutations/useAuthMutations'
import { useAdminStatusQuery } from '@/hooks/queries/useAdminStatusQuery'
import { usePageTitle } from '@/hooks/usePageTitle'
import { ApiError, UNAUTHORIZED_EVENT } from '@/lib/api'
import { BRAND } from '@/lib/brand'
import { isSessionValid, setSession } from '@/lib/session'

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
          src="/icon.png"
          alt=""
          width={40}
          height={40}
          className="h-15 w-15 rounded-md border-none p-1 sm:h-15 sm:w-15 sm:p-0"
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
      <div className="animate-fade-in w-full rounded-2xl bg-surface p-10 gold-hairline">
        <div className="flex flex-col items-center gap-4">
          <Loader2
            size={26}
            className="animate-spin text-primary"
            aria-hidden="true"
          />
          <p className="text-sm text-muted-foreground">Verifying admin access…</p>
        </div>
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
  hint?: string
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
  hint,
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
      {hint && <p className="mt-2 text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Form                                                                        */
/* -------------------------------------------------------------------------- */

interface LoginFormProps {
  notice: string | null
  onAuthenticated: (token: string) => void
}

function LoginForm({ notice, onAuthenticated }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  // The mutation owns the in-flight state; the form only owns its inputs.
  const loginMutation = useAdminLoginMutation()
  const isSubmitting = loginMutation.isPending

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isSubmitting) return

    setError(null)

    try {
      const data = await loginMutation.mutateAsync({
        email: email.trim(),
        password,
      })
      onAuthenticated(data.token)
    } catch (err) {
      // `mutateAsync` rejects with the API failure, so the wording below is
      // the backend's own.
      setError(describeError(err, 'Unable to sign in. Please try again.'))
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
          className="mt-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive-text"
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-7 btn-gold btn-gold-hover flex w-full items-center justify-center gap-2 rounded-lg px-6 py-3.5 text-sm font-medium uppercase tracking-widest text-primary-foreground disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting && (
          <Loader2 size={16} className="animate-spin" aria-hidden="true" />
        )}
        {isSubmitting ? 'Signing in…' : 'Sign In'}
      </button>
    </form>
  )
}

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

/** `location.state` contract shared with the register page. */
interface LoginLocationState {
  notice?: string | null
}

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  usePageTitle('Admin Login')

  const {
    adminExists,
    isLoading,
    error: statusError,
    refetch: refetchStatus,
  } = useAdminStatusQuery()

  const [notice, setNotice] = useState<string | null>(
    () => (location.state as LoginLocationState | null)?.notice ?? null,
  )

  // The boot screen covers the lookup while there is no answer yet — the very
  // first request and any retry after a failure. A refresh over an answer we
  // already hold leaves the screen that is on display alone.
  const isBooting = isLoading && adminExists === null && statusError === null

  // The API client signals an expired or rejected session. The token has
  // already been cleared at that point, so drop straight back to the login
  // prompt instead of leaving the admin staring at a stale form.
  useEffect(() => {
    const handleUnauthorized = () => {
      setNotice('Your session expired. Please sign in again.')
    }

    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized)
    return () =>
      window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized)
  }, [])

  // Registration hands its success message over through router state.
  useEffect(() => {
    const state = location.state as LoginLocationState | null
    setNotice(state?.notice ?? null)
  }, [location.state])

  const handleAuthenticated = (token: string) => {
    setSession(token)
    navigate('/admin/dashboard', { replace: true })
  }

  const handleRetryStatus = () => {
    refetchStatus()
  }

  // Already signed in → straight to the protected dashboard.
  if (isSessionValid()) {
    return <Navigate to="/admin/dashboard" replace />
  }

  if (isBooting) {
    return <BootScreen />
  }

  const registrationAvailable = adminExists === false

  return (
    <AuthShell>
      <AuthCard
        title="Admin Login"
        subtitle="Sign in to manage products and settings"
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
              disabled={isLoading}
              className="mt-2 inline-flex min-h-11 items-center gap-2 text-sm text-gold-light underline underline-offset-4 transition-colors hover:text-primary disabled:opacity-60"
            >
              {isLoading && (
                <Loader2 size={14} className="animate-spin" aria-hidden="true" />
              )}
              Try again
            </button>
          </div>
        )}

        {registrationAvailable ? (
          <div className="rounded-xl border border-primary/30 bg-primary/10 p-6 text-center">
            <p className="eyebrow text-primary">No admin yet</p>
            <p className="mt-3 text-sm text-muted-foreground">
              No administrator account exists for this store. Create the first
              admin account to start managing products and settings.
            </p>
            <Link
              to="/admin/register"
              className="btn-gold btn-gold-hover mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg px-6 text-sm font-medium uppercase tracking-widest text-primary-foreground"
            >
              Create the first admin account
            </Link>
          </div>
        ) : (
          <LoginForm notice={notice} onAuthenticated={handleAuthenticated} />
        )}
      </AuthCard>
    </AuthShell>
  )
}
