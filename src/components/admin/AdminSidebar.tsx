import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import {
  KeyRound,
  LayoutDashboard,
  LogOut,
  Package,
  Search,
  Settings,
  Store,
  X,
  type LucideIcon,
} from 'lucide-react'

import { BRAND } from '@/lib/brand'
import { cn } from '@/lib/utils'

interface AdminSidebarProps {
  /** Drives the off-canvas drawer below the `lg` breakpoint. */
  isOpen: boolean
  onClose: () => void
  onLogout: () => void
}

interface NavItem {
  /** Absolute route path the item points at. */
  to: string
  label: string
  icon: LucideIcon
  /**
   * Match nested paths too, so `/admin/products/new` and
   * `/admin/products/:id/edit` keep "Products" highlighted.
   */
  prefix?: boolean
  /**
   * Exact paths a prefix match must still treat as inactive — the lookup
   * page lives under `/admin/products` but belongs to its own nav entry,
   * so only one of the two may highlight there.
   */
  exclude?: string[]
}

const NAV_ITEMS: NavItem[] = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  {
    to: '/admin/products',
    label: 'Products',
    icon: Package,
    prefix: true,
    exclude: ['/admin/products/lookup'],
  },
  {
    to: '/admin/products/lookup',
    label: 'Product Lookup',
    icon: Search,
  },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
  { to: '/admin/change-password', label: 'Change Password', icon: KeyRound },
]

/** Tailwind's `lg` breakpoint — used to decide drawer vs. permanent sidebar. */
const DESKTOP_QUERY = '(min-width: 1024px)'

/** Focusable nodes used to keep Tab cycling inside the open drawer. */
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

/** Visible, non-disabled elements that can still take keyboard focus. */
function getFocusableElements(root: HTMLElement): HTMLElement[] {
  return Array.from(
    root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
  ).filter(
    (element) =>
      element.getClientRects().length > 0 &&
      element.getAttribute('aria-hidden') !== 'true',
  )
}

export default function AdminSidebar({
  isOpen,
  onClose,
  onLogout,
}: AdminSidebarProps) {
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window === 'undefined'
      ? false
      : window.matchMedia(DESKTOP_QUERY).matches,
  )
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLElement>(null)
  const backdropRef = useRef<HTMLDivElement>(null)
  const restoreFocusRef = useRef<HTMLElement | null>(null)
  const { pathname } = useLocation()

  /**
   * Below `lg` the sidebar is an off-canvas drawer that behaves modally.
   * From `lg` up it is a permanent, always-visible navigation rail and must
   * never be announced as a dialog.
   */
  const isDrawer = !isDesktop

  useEffect(() => {
    const query = window.matchMedia(DESKTOP_QUERY)
    const handleChange = () => setIsDesktop(query.matches)
    handleChange()
    query.addEventListener('change', handleChange)
    return () => query.removeEventListener('change', handleChange)
  }, [])

  // Lock the page behind the drawer so the content underneath cannot scroll.
  useEffect(() => {
    if (!isOpen || isDesktop) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isOpen, isDesktop])

  /**
   * While the drawer is open everything behind it has to be inert, otherwise
   * Tab and a screen reader's virtual cursor can still reach the page. This
   * runs before the focus-restore effect below so the inert state is lifted
   * before focus is handed back to the trigger.
   */
  useEffect(() => {
    if (!isOpen || isDesktop) return

    const panel = panelRef.current
    if (!panel) return

    // Invert the tree: everything that is neither the drawer nor one of its
    // ancestors becomes inert for as long as the drawer is open.
    const inerted: Array<{ element: HTMLElement; wasInert: boolean }> = []
    let node: HTMLElement | null = panel
    while (node && node !== document.body) {
      const parent: HTMLElement | null = node.parentElement
      if (!parent) break
      for (const sibling of Array.from(parent.children)) {
        if (sibling === node) continue
        // The backdrop stays interactive so it can still dismiss the drawer.
        if (sibling === backdropRef.current) continue
        if (!(sibling instanceof HTMLElement)) continue
        inerted.push({ element: sibling, wasInert: sibling.inert })
        sibling.inert = true
      }
      node = parent
    }

    return () => {
      for (const { element, wasInert } of inerted) {
        element.inert = wasInert
      }
    }
  }, [isOpen, isDesktop])

  /**
   * Remember who opened the drawer so focus can be handed back on close —
   * Escape, the backdrop, the close button and the nav links all close it.
   */
  useEffect(() => {
    if (!isOpen) return
    const active = document.activeElement
    restoreFocusRef.current = active instanceof HTMLElement ? active : null
    return () => {
      const target = restoreFocusRef.current
      restoreFocusRef.current = null
      // Focusing a detached or hidden node would drop focus onto <body>,
      // which is exactly the trap this fixes.
      if (target && target.isConnected && target.getClientRects().length > 0) {
        target.focus()
      }
    }
  }, [isOpen])

  // Move focus into the drawer so keyboard users are not stranded behind it.
  useEffect(() => {
    if (isOpen && !isDesktop) closeButtonRef.current?.focus()
  }, [isOpen, isDesktop])

  // Escape closes the drawer and Tab is trapped inside the open panel.
  useEffect(() => {
    if (!isOpen || isDesktop) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }

      if (event.key !== 'Tab') return

      const panel = panelRef.current
      if (!panel) return

      const focusable = getFocusableElements(panel)
      if (focusable.length === 0) {
        event.preventDefault()
        panel.focus()
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const current = document.activeElement
      // Focus on the panel itself counts as being outside the tab cycle.
      const insidePanel =
        current !== null && current !== panel && panel.contains(current)

      if (event.shiftKey) {
        if (current === first || !insidePanel) {
          event.preventDefault()
          last.focus()
        }
      } else if (current === last || !insidePanel) {
        event.preventDefault()
        first.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isDesktop, onClose])

  return (
    <>
      {/* Backdrop — only meaningful while the drawer is open on small screens. */}
      <div
        ref={backdropRef}
        onClick={onClose}
        aria-hidden="true"
        className={cn(
          'fixed inset-0 z-40 bg-background/80 backdrop-blur-sm transition-opacity duration-300 lg:hidden',
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      />

      <aside
        id="admin-drawer"
        ref={panelRef}
        // Below `lg` the panel is modal, so it has to be announced as a dialog.
        // From `lg` up it is a permanent landmark and never a dialog.
        role={isDrawer ? 'dialog' : undefined}
        aria-modal={isDrawer ? true : undefined}
        aria-label="Admin navigation"
        tabIndex={-1}
        // While the drawer is closed on mobile it must not be reachable by tab.
        inert={isDesktop || isOpen ? undefined : true}
        className={cn(
          'fixed top-0 left-0 z-50 flex h-screen w-[17rem] max-w-[86vw] flex-col border-r border-border bg-surface transition-transform duration-300 ease-out',
          'lg:sticky lg:top-0 lg:z-10 lg:h-screen lg:w-[17rem] lg:max-w-none lg:shrink-0 lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Branding */}
        <div className="flex items-center gap-3 border-b border-border px-5 py-5">
          <img
            src="/logo-mark.svg"
            alt=""
            aria-hidden="true"
            className="h-10 w-10 shrink-0"
          />
          <div className="min-w-0">
            <p className="truncate font-display text-[15px] leading-none tracking-[0.14em] text-gradient">
              {BRAND.name}
            </p>
            <p className="mt-1.5 text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
              Admin Panel
            </p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close admin navigation"
            className="ml-auto inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary lg:hidden"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <nav
          aria-label="Sections"
          className="scrollbar-slim flex-1 overflow-y-auto px-3 py-5"
        >
          <ul className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon

              return (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    // Without `end`, nested routes stay highlighted (Products).
                    end={!item.prefix}
                    // Selecting from the drawer always dismisses it.
                    onClick={onClose}
                    className={({ isActive }) => {
                      // A prefix match may still be vetoed per item, so the
                      // lookup page highlights only its own nav entry.
                      const active =
                        isActive && !(item.exclude?.includes(pathname) ?? false)
                      return cn(
                        'flex min-h-[44px] w-full items-center gap-3 rounded-r-md border-l-2 px-4 py-2.5 text-left text-sm font-medium tracking-[0.06em] transition-colors duration-300',
                        active
                          ? 'border-l-primary bg-primary/10 text-primary'
                          : 'border-l-transparent text-muted-foreground hover:bg-surface-2 hover:text-foreground',
                      )
                    }}
                  >
                    <Icon
                      className="h-[18px] w-[18px] shrink-0"
                      aria-hidden="true"
                    />
                    <span>{item.label}</span>
                  </NavLink>
                </li>
              )
            })}
          </ul>

          {/* Logout is separated from the navigation by a hairline. */}
          <div className="mt-6 border-t border-border pt-4">
            <button
              type="button"
              onClick={onLogout}
              className="flex min-h-[44px] w-full items-center gap-3 rounded-r-md border-l-2 border-l-transparent px-4 py-2.5 text-left text-sm font-medium tracking-[0.06em] text-destructive transition-colors duration-300 hover:bg-destructive/10"
            >
              <LogOut className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
              <span>Logout</span>
            </button>
          </div>
        </nav>

        <div className="border-t border-border p-3">
          <Link
            to="/"
            onClick={onClose}
            className="flex min-h-[44px] items-center gap-3 rounded-md px-4 py-2.5 text-sm tracking-[0.06em] text-muted-foreground transition-colors hover:bg-surface-2 hover:text-primary"
          >
            <Store className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
            <span>Back to store</span>
          </Link>
        </div>
      </aside>
    </>
  )
}
