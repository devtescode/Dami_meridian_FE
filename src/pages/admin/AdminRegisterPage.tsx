/**
 * First-admin registration screen (public route).
 *
 * `POST /admin/register` only works while no admin exists on the backend, so
 * this page checks `/admin/status` first and:
 *   - redirects to login when an admin already exists,
 *   - shows the boot screen while the check runs,
 *   - offers a retry when the check itself fails.
 *
 * On success it hands the backend's confirmation message to the login page
 * through router state (`state.notice`), which surfaces it above the form.
 */

import { useEffect, useRef, useState } from 'react'
import type { FormEvent, ReactNode, RefObject } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react'

import { useAdminRegisterMutation } from '@/hooks/mutations/useAuthMutations'
import { useAdminStatusQuery } from '@/hooks/queries/useAdminStatusQuery'
import { usePageTitle } from '@/hooks/usePageTitle'
import { ApiError } from '@/lib/api'
import { BRAND } from '@/lib/brand'
import { isSessionValid } from '@/lib/session'

/** Friendlier copy than the raw transport failure for an unreachable API. */
const NETWORK_ERROR =
  'We could not reach the server. Please check your connection and try again.'

/** The backend enforces a minimum password length of 8. */
const MIN_PASSWORD_LENGTH = 8

/**
 * Surfaces the backend's own wording ("Admin already exists", …) and only
 * falls back to a generic line when there is nothing to show.
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
  /** Lets the form move focus here when validation blocks the submit. */
  inputRef?: RefObject<HTMLInputElement | null>
  /** Field-level validation message (tied to the input via aria-describedby). */
  error?: string
  /** Stable id for the persistent error live region under the field. */
  errorId?: string
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
  inputRef,
  error,
  errorId,
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
          ref={inputRef}
          name={name}
          type={isVisible ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          placeholder={placeholder}
          required
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={error && errorId ? errorId : undefined}
          className={`w-full rounded-lg border bg-background py-3 pl-4 pr-12 text-base text-foreground placeholder:text-subtle transition-colors duration-300 hover:border-border-strong focus:border-primary disabled:cursor-not-allowed disabled:opacity-60 ${
            error ? 'border-destructive' : 'border-border'
          }`}
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
      {/* Persistent live region (mirrors AdminProductForm's FieldError):
          text added to an already-mounted alert is announced; a conditionally
          rendered one can be silent in several screen readers. Empty = sr-only. */}
      {errorId ? (
        <p
          id={errorId}
          role="alert"
          className={error ? 'mt-2 text-xs text-destructive-text' : 'sr-only'}
        >
          {error ?? ''}
        </p>
      ) : null}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Form                                                                        */
/* -------------------------------------------------------------------------- */

interface RegisterFormProps {
  onRegistered: (message: string) => void
}

function RegisterForm({ onRegistered }: RegisterFormProps) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  // Length validation is tied to the password field itself (aria-invalid +
  // aria-describedby), so it gets its own state instead of the form-level alert.
  const [passwordError, setPasswordError] = useState<string | null>(null)
  // A 400 "Admin already exists" means someone else won the race — offer login.
  const [adminExistsError, setAdminExistsError] = useState(false)

  // The mutation owns the in-flight state; the form only owns its inputs.
  const registerMutation = useAdminRegisterMutation()
  const isSubmitting = registerMutation.isPending

  const passwordRef = useRef<HTMLInputElement>(null)
  // Bumped on every failed length check to trigger the focus effect;
  // focusing inside the submit handler happens before React commits the
  // error text and aria-invalid, so a screen reader would hear nothing.
  const [focusRequest, setFocusRequest] = useState(0)

  useEffect(() => {
    if (focusRequest === 0) return
    passwordRef.current?.focus()
  }, [focusRequest])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isSubmitting) return

    setError(null)
    setPasswordError(null)
    setAdminExistsError(false)

    // Inline validation mirroring the backend's minimum length rule.
    if (password.length < MIN_PASSWORD_LENGTH) {
      setPasswordError(
        `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`,
      )
      setFocusRequest((count) => count + 1)
      return
    }

    try {
      const data = await registerMutation.mutateAsync({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
      })
      onRegistered(
        data.message || 'Account created. Sign in with your new credentials.',
      )
    } catch (err) {
      // `mutateAsync` rejects with the API failure, so the wording below is
      // the backend's own.
      setError(describeError(err, 'Unable to create the admin account.'))
      setAdminExistsError(
        err instanceof ApiError &&
          err.status === 400 &&
          /already exists/i.test(err.message),
      )
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
          onChange={(value) => {
            setPassword(value)
            // Clear the stale length error as soon as the user re-types.
            if (passwordError) setPasswordError(null)
          }}
          disabled={isSubmitting}
          hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
          inputRef={passwordRef}
          error={passwordError ?? undefined}
          errorId="admin-register-password-error"
        />
      </fieldset>

      {error && (
        <div
          role="alert"
          aria-live="assertive"
          className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive-text"
        >
          <p>{error}</p>
          {adminExistsError && (
            <Link
              to="/admin/login"
              className="mt-2 inline-flex min-h-11 items-center text-sm text-gold-light underline underline-offset-4 transition-colors hover:text-primary"
            >
              Sign in instead
            </Link>
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="btn-gold btn-gold-hover flex w-full items-center justify-center gap-2 rounded-lg px-6 py-3.5 text-sm font-medium uppercase tracking-widest text-primary-foreground disabled:cursor-not-allowed disabled:opacity-70"
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

export default function AdminRegisterPage() {
  const navigate = useNavigate()
  usePageTitle('Admin Registration')

  const {
    adminExists,
    isLoading,
    error: statusError,
    refetch: refetchStatus,
  } = useAdminStatusQuery()

  // The boot screen covers the lookup while there is no answer yet — the very
  // first request and any retry after a failure. A refresh over an answer we
  // already hold leaves the screen that is on display alone.
  const isBooting = isLoading && adminExists === null && statusError === null

  const handleRegistered = (message: string) => {
    // An admin now exists — registration closes and login takes over,
    // with the backend's confirmation shown above the form.
    navigate('/admin/login', { replace: true, state: { notice: message } })
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

  // Registration is only valid while no admin exists.
  if (adminExists === true) {
    return <Navigate to="/admin/login" replace />
  }

  return (
    <AuthShell>
      <AuthCard
        title="Create Admin Account"
        subtitle="Set up the first administrator for the store."
      >
        {statusError || adminExists === null ? (
          <div
            role="alert"
            className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3"
          >
            <p className="text-sm text-destructive-text">
              {statusError ?? 'Could not verify the admin account.'}
            </p>
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
            <p className="mt-3 text-sm text-muted-foreground">
              Already created an account?{' '}
              <Link
                to="/admin/login"
                className="text-gold-light underline underline-offset-4 transition-colors hover:text-primary"
              >
                Sign in
              </Link>
            </p>
          </div>
        ) : (
          <RegisterForm onRegistered={handleRegistered} />
        )}
      </AuthCard>
    </AuthShell>
  )
}
