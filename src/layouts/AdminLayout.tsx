/**
 * Admin shell: guard + chrome for every protected `/admin/...` route.
 *
 * The guard is intentionally synchronous — `isSessionValid()` reads the JWT
 * straight out of `sessionStorage` and checks its `exp` claim, so an expired
 * or missing session never even renders the shell. The backend stays the
 * source of truth: a 401/403 on any protected call clears the session in
 * `@/lib/api` and dispatches `UNAUTHORIZED_EVENT`, which drops the admin back
 * onto the login screen instead of leaving them on a page that cannot save.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { LogOut, Menu, Store } from 'lucide-react'

import AdminSidebar from '@/components/admin/AdminSidebar'
import { useClearProductCache } from '@/hooks/mutations/useProductMutations'
import { UNAUTHORIZED_EVENT } from '@/lib/api'
import { BRAND } from '@/lib/brand'
import { clearSession, isSessionValid } from '@/lib/session'

/**
 * Route → page title. Longest paths are listed first so `/new` and
 * `/:id/edit` win over the bare `/products` prefix they nest under.
 */
const TITLE_RULES: ReadonlyArray<{ prefix: string; title: string }> = [
  { prefix: '/admin/dashboard', title: 'Dashboard' },
  { prefix: '/admin/products/new', title: 'Add Product' },
  { prefix: '/admin/products/lookup', title: 'Product Lookup' },
  { prefix: '/admin/products', title: 'Products' },
  { prefix: '/admin/settings', title: 'Settings' },
  { prefix: '/admin/change-password', title: 'Change Password' },
]

/** `/admin/products/abc123/edit` is the edit screen, whatever the id is. */
const PRODUCT_EDIT_PATTERN = /^\/admin\/products\/[^/]+\/edit\/?$/

function resolveTitle(pathname: string): string {
  if (PRODUCT_EDIT_PATTERN.test(pathname)) return 'Edit Product'

  const normalized = pathname.replace(/\/+$/, '')
  const match = TITLE_RULES.find(
    (rule) =>
      normalized === rule.prefix ||
      normalized.startsWith(`${rule.prefix}/`),
  )
  return match?.title ?? 'Dashboard'
}

export default function AdminLayout() {
  const location = useLocation()
  const navigate = useNavigate()

  const [drawerOpen, setDrawerOpen] = useState(false)
  const drawerToggleRef = useRef<HTMLButtonElement>(null)

  const isAuthenticated = isSessionValid()

  const closeDrawer = useCallback(() => setDrawerOpen(false), [])

  /**
   * Drops the cached catalogue when the session ends, so nothing the admin
   * browsed outlives their access to the admin panel.
   */
  const clearProductCache = useClearProductCache()

  /**
   * Focus the trigger before opening so the drawer always has an element to
   * hand focus back to when it closes.
   */
  const openDrawer = useCallback(() => {
    drawerToggleRef.current?.focus()
    setDrawerOpen(true)
  }, [])

  // A route change should never leave the drawer hanging over the new page.
  useEffect(() => {
    setDrawerOpen(false)
  }, [location.pathname])

  /**
   * Crossing the `lg` breakpoint must never leave the drawer in a stale
   * state. The sidebar switches itself to a permanent rail at `lg`, but the
   * `drawerOpen` flag lives here — so without this, growing the window past
   * 1024px would leave the flag `true` and SHRINKING it again would bring
   * the drawer back by itself, over content the admin never asked to see.
   * Mirrors the storefront's own resize handling in `Navigation`.
   */
  useEffect(() => {
    const query = window.matchMedia('(min-width: 1024px)')
    const handleChange = (event: MediaQueryListEvent) => {
      if (event.matches) setDrawerOpen(false)
    }
    query.addEventListener('change', handleChange)
    return () => query.removeEventListener('change', handleChange)
  }, [])

  // Escape is handled exclusively by AdminSidebar: its keydown effect runs in
  // the modal context and also drives the Tab trap, so a second global
  // listener here would fire twice for the same keypress.

  const title = resolveTitle(location.pathname)

  // Keep the tab title in sync with the section, restoring whatever the
  // storefront had set when the admin leaves.
  useEffect(() => {
    const previousTitle = document.title
    document.title = `Admin · ${title} — ${BRAND.name}`
    return () => {
      document.title = previousTitle
    }
  }, [title])

  // The API client signals an expired or rejected session; the token has
  // already been cleared at that point. The notice travels through router
  // state because AdminLoginPage is not mounted when the event fires — its
  // own UNAUTHORIZED listener cannot catch it, and after the redirect
  // `location.state` is the only channel left to explain why.
  useEffect(() => {
    const handleUnauthorized = () => {
      clearSession()
      // Whatever the session fetched must not outlive it.
      clearProductCache()
      navigate('/admin/login', {
        replace: true,
        state: { notice: 'Your session expired. Please sign in again.' },
      })
    }

    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized)
    return () =>
      window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized)
  }, [navigate, clearProductCache])

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />
  }

  const handleLogout = () => {
    setDrawerOpen(false)
    clearSession()
    // The catalogue the admin browsed is dropped from the cache, so the
    // next session starts from the server rather than from whatever this
    // one left behind.
    clearProductCache()
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-background lg:flex">
      {/* First focusable element in the shell: `aside` + `header` otherwise
          steal ~12 Tab presses on every admin route. Follows the storefront's
          sr-only-until-focus pattern; `z-50` clears the sticky header (z-30)
          and the drawer backdrop (z-40). */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:inline-flex focus:min-h-[44px] focus:items-center focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Skip to main content
      </a>

      <AdminSidebar
        isOpen={drawerOpen}
        onClose={closeDrawer}
        onLogout={handleLogout}
      />

      <div className="min-w-0 flex-1">
        {/* Top bar — the sidebar becomes a drawer below `lg` */}
        <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-md">
          <div className="flex items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                ref={drawerToggleRef}
                type="button"
                onClick={openDrawer}
                className="-ml-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-surface lg:hidden"
                aria-label="Open admin menu"
                aria-expanded={drawerOpen}
                aria-controls="admin-drawer"
              >
                <Menu size={22} aria-hidden="true" />
              </button>

              <div className="min-w-0">
                <p className="eyebrow">{BRAND.name}</p>
                {/* Not a heading: every page renders its own <h1>, and a
                    second <h1> repeating the same title would be both an
                    accessibility and a duplication defect. */}
                <p className="mt-1 truncate font-display text-xl text-foreground sm:text-2xl lg:text-3xl">
                  Admin · {title}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <Link
                to="/"
                className="hidden min-h-11 items-center gap-2 rounded-lg border border-border px-4 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary sm:inline-flex"
              >
                <Store size={16} aria-hidden="true" />
                View store
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border px-4 text-sm text-muted-foreground transition-colors hover:border-destructive/50 hover:text-destructive"
              >
                <LogOut size={16} aria-hidden="true" />
                <span className="hidden sm:inline">Log out</span>
                <span className="sr-only sm:hidden">Log out</span>
              </button>
            </div>
          </div>
        </header>

        {/* `id="main"` is the skip-link target and ScrollToTop's route-change
            focus landing; `tabIndex={-1}` makes focus actually move here in
            Safari/Firefox; `outline-none` keeps the ring off a programmatically
            focused landmark — same treatment as PublicLayout's `#main`. */}
        <main
          id="main"
          tabIndex={-1}
          className="px-4 py-6 outline-none sm:px-6 sm:py-8 lg:px-8"
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}
