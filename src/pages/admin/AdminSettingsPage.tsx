import { Link, useNavigate } from 'react-router-dom'
import { ChevronRight, KeyRound, LogOut, Store } from 'lucide-react'

import { useClearProductCache } from '@/hooks/mutations/useProductMutations'
import { BRAND, PHONE_DISPLAY, WHATSAPP_DISPLAY } from '@/lib/brand'
import { clearSession, getTokenExpiry, isSessionValid } from '@/lib/session'
import { cn } from '@/lib/utils'

/** Read-only store facts pulled from the shared brand configuration. */
const ABOUT_ROWS: Array<{ label: string; value: string }> = [
  { label: 'Slogan', value: BRAND.slogan },
  { label: 'Location', value: BRAND.location },
  { label: 'WhatsApp', value: WHATSAPP_DISPLAY },
  { label: 'Phone', value: PHONE_DISPLAY },
]

export default function AdminSettingsPage() {
  const navigate = useNavigate()
  const clearProductCache = useClearProductCache()

  const sessionActive = isSessionValid()
  const expiry = getTokenExpiry()
  const expiryLabel = expiry
    ? new Date(expiry).toLocaleString('en-NG', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : null

  const handleLogout = () => {
    clearSession()
    // The catalogue the admin browsed is dropped from the cache, so the
    // next session starts from the server rather than from whatever this
    // one left behind.
    clearProductCache()
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="animate-fade-in-up space-y-6">
      <header>
        <p className="eyebrow">Admin</p>
        <h1 className="mt-2 font-display text-3xl text-foreground sm:text-4xl">
          Settings
        </h1>
        <div className="rule-gold mt-4 w-28" aria-hidden="true" />
        <p className="mt-4 max-w-xl text-sm text-muted-foreground">
          Your session details and the actions available on this account.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Account — session facts only, read straight from the stored token. */}
        <section
          aria-labelledby="account-heading"
          className="card-luxury min-w-0 rounded-xl p-5 sm:p-6"
        >
          <p className="eyebrow">Account</p>
          <h2
            id="account-heading"
            className="mt-2 font-display text-2xl text-foreground"
          >
            Signed in
          </h2>

          <dl className="mt-5 divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface-2/60">
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
              <dt className="text-sm text-muted-foreground">Session status</dt>
              <dd
                className={cn(
                  'text-sm font-medium',
                  sessionActive ? 'text-emerald-300' : 'text-destructive',
                )}
              >
                {sessionActive ? 'Active' : 'Expired'}
              </dd>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
              <dt className="text-sm text-muted-foreground">Token expires</dt>
              <dd className="text-sm font-medium text-foreground">
                {expiryLabel ?? 'Not recorded on this token'}
              </dd>
            </div>
          </dl>

          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
            Sessions last 1 hour. Your session is stored in this browser tab
            only — closing the tab signs you out.
          </p>
        </section>

        {/* Actions — every row is a real link or a real sign-out. */}
        <section
          aria-labelledby="actions-heading"
          className="card-luxury min-w-0 rounded-xl p-5 sm:p-6"
        >
          <p className="eyebrow">Actions</p>
          <h2
            id="actions-heading"
            className="mt-2 font-display text-2xl text-foreground"
          >
            Manage your account
          </h2>

          <ul className="mt-5 space-y-3">
            <li>
              <Link
                to="/admin/change-password"
                className="flex min-h-11 w-full items-center justify-between gap-3 rounded-lg border border-border bg-surface-2/60 px-4 py-3 text-sm text-foreground transition-colors hover:border-primary/50"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <KeyRound
                    className="h-4 w-4 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  <span className="truncate">Change Password</span>
                </span>
                <ChevronRight
                  className="h-4 w-4 shrink-0 text-subtle"
                  aria-hidden="true"
                />
              </Link>
            </li>

            <li>
              <button
                type="button"
                onClick={handleLogout}
                className="flex min-h-11 w-full items-center justify-between gap-3 rounded-lg border border-border bg-surface-2/60 px-4 py-3 text-sm text-foreground transition-colors hover:border-destructive/50 hover:text-destructive"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <LogOut
                    className="h-4 w-4 shrink-0"
                    aria-hidden="true"
                  />
                  <span className="truncate">Log out</span>
                </span>
                <ChevronRight
                  className="h-4 w-4 shrink-0 text-subtle"
                  aria-hidden="true"
                />
              </button>
            </li>

            <li>
              <Link
                to="/"
                className="flex min-h-11 w-full items-center justify-between gap-3 rounded-lg border border-border bg-surface-2/60 px-4 py-3 text-sm text-foreground transition-colors hover:border-primary/50"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <Store
                    className="h-4 w-4 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  <span className="truncate">View store</span>
                </span>
                <ChevronRight
                  className="h-4 w-4 shrink-0 text-subtle"
                  aria-hidden="true"
                />
              </Link>
            </li>
          </ul>
        </section>

        {/* About — information, not controls. */}
        <section
          aria-labelledby="about-heading"
          className="card-luxury min-w-0 rounded-xl p-5 sm:p-6 lg:col-span-2"
        >
          <p className="eyebrow">About this store</p>
          <h2
            id="about-heading"
            className="mt-2 font-display text-2xl text-foreground"
          >
            {BRAND.name}
          </h2>

          <dl className="mt-5 grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
            {ABOUT_ROWS.map((row) => (
              <div key={row.label} className="min-w-0">
                <dt className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                  {row.label}
                </dt>
                <dd className="mt-1 break-words text-sm text-foreground">
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>

          <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
            Reference details from the brand configuration — shown for context,
            not editable here.
          </p>
        </section>
      </div>
    </div>
  )
}
