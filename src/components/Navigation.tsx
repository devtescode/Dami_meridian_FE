/**
 * DAMI MERIDIAN — sticky primary navigation.
 *
 * The bar starts light so the hero artwork reads through it, then frosts over
 * with a gold hairline once the page scrolls. Everything below the lg
 * breakpoint collapses into a slide-in drawer so the header never wraps or
 * overflows on a 320px screen.
 *
 * Every destination is a real router <Link>; the current route is picked out
 * in gold with `aria-current="page"`, and the search field routes straight to
 * the shop with the term in the `q` query param.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import type { FormEvent, KeyboardEvent as ReactKeyboardEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Instagram,
  Menu,
  MessageCircle,
  Music,
  Search,
  Shield,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { BRAND, LINKS, SOCIALS } from '@/lib/brand'
import { Container } from '@/components/Section'

/** Top-level routes, rendered in both the desktop bar and the mobile drawer. */
const NAV_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Shop', to: '/shop' },
  { label: 'Collections', to: '/collections' },
  { label: 'About', to: '/about' },
  { label: 'Contact', to: '/contact' },
] as const

type SocialEntry = (typeof SOCIALS)[number]

/** TikTok has no first-party lucide glyph, so its music note stands in. */
const SOCIAL_ICONS: Record<SocialEntry['id'], LucideIcon> = {
  instagram: Instagram,
  tiktok: Music,
}

/** Focusable nodes used to keep Tab cycling inside the open drawer. */
const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Renders a handle as a link when the brand has a verified profile URL, and as
 * plain text otherwise. The platform name is injected as visually hidden text
 * instead of an `aria-label`: a <span> has an implicit `generic` role, and
 * `aria-label` is prohibited on `generic`, so the platform name would never
 * reach a screen reader. The visible label stays the handle, so the two handles
 * never sound identical out loud.
 */
function SocialHandle({
  social,
  className = '',
}: {
  social: SocialEntry
  className?: string
}) {
  const Icon = SOCIAL_ICONS[social.id]
  const label = `${social.label} — ${social.handle}`
  const content = (
    <>
      <Icon className="h-3.5 w-3.5 shrink-0 text-primary/70" aria-hidden="true" />
      <span className="sr-only normal-case">{social.label} — </span>
      <span className="whitespace-nowrap tracking-wider">{social.handle}</span>
    </>
  )

  const base = `inline-flex min-h-[44px] items-center gap-1.5 text-xs uppercase text-muted-foreground ${className}`

  if (!social.url) {
    return (
      <span title={label} className={base}>
        {content}
      </span>
    )
  }

  return (
    <a
      href={social.url}
      target="_blank"
      rel="noopener noreferrer"
      title={label}
      className={`${base} transition-colors hover:text-primary`}
    >
      {content}
    </a>
  )
}

export function Navigation() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const toggleRef = useRef<HTMLButtonElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const location = useLocation()
  const navigate = useNavigate()

  /**
   * `/shop` is the query-param surface, so it also owns the Shop highlight on
   * `/products/:id` — a product is reached from the catalogue. Nested paths
   * (e.g. `/collections/x`) match on their first segment only.
   */
  const isActive = (to: string) => {
    if (to === '/shop') {
      return (
        location.pathname === '/shop' ||
        location.pathname.startsWith('/products')
      )
    }
    return location.pathname === to
  }

  // The frosted surface and the gold hairline only appear once the page moves.
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 24)
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Leaving the mobile breakpoint must never leave the drawer stuck open.
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setMenuOpen(false)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Lock the page behind the drawer so touch scrolling cannot fight it.
  useEffect(() => {
    if (!menuOpen) return
    const { body } = document
    const previousOverflow = body.style.overflow
    const previousPaddingRight = body.style.paddingRight
    // Compensate for the vanishing scrollbar so the page does not jump sideways.
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
    body.style.overflow = 'hidden'
    if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`
    return () => {
      body.style.overflow = previousOverflow
      body.style.paddingRight = previousPaddingRight
    }
  }, [menuOpen])

  // Escape closes the drawer and hands focus back to the trigger.
  useEffect(() => {
    if (!menuOpen) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false)
        toggleRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [menuOpen])

  // Move focus into the drawer as soon as it opens.
  useEffect(() => {
    if (menuOpen) closeRef.current?.focus()
  }, [menuOpen])

  const closeMenu = useCallback(() => {
    // Only pull focus back when the drawer was actually open.
    if (menuOpen) toggleRef.current?.focus()
    setMenuOpen(false)
  }, [menuOpen])

  /**
   * Both the desktop bar and the drawer submit the same term, so one handler
   * routes to the shop's `q` param (or a blank catalogue when cleared) and
   * dismisses the drawer if it was the one in play.
   */
  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const term = searchTerm.trim()
    navigate(term ? `/shop?q=${encodeURIComponent(term)}` : '/shop')
    setSearchTerm('')
    closeMenu()
  }

  // Any route change dismisses the drawer, whichever element caused it.
  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  const handlePanelKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab') return
    const panel = panelRef.current
    if (!panel) return
    const focusable = Array.from(
      panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
    ).filter((node) => node.offsetParent !== null)
    if (focusable.length === 0) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    const active = document.activeElement
    if (event.shiftKey && (active === first || active === panel)) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && active === last) {
      event.preventDefault()
      first.focus()
    }
  }

  return (
    <>
      <nav
        aria-label="Primary"
        className={`sticky top-0 z-50 w-full transition-all duration-500 ease-out ${
          scrolled
            ? 'glass-dark shadow-lg shadow-black/40'
            : 'bg-background/40 backdrop-blur-md'
        }`}
      >
        <Container className="flex h-16 items-center justify-between gap-3 sm:h-20">
          {/* Brand lockup */}
          <Link
            to="/"
            aria-label={`${BRAND.name} — home`}
            className="flex min-w-0 shrink items-center gap-2.5 sm:gap-3"
          >
            <img
              src="/logo-mark.svg"
              alt=""
              width={40}
              height={40}
              className="h-9 w-9 shrink-0 sm:h-10 sm:w-10"
            />
            <span className="min-w-0 truncate font-display text-base leading-none tracking-[0.25em] text-gradient sm:text-lg sm:tracking-[0.3em] lg:text-xl xl:text-2xl">
              {BRAND.name}
            </span>
          </Link>

          {/* Desktop navigation */}
          <ul className="hidden flex-1 items-center justify-center gap-1 lg:flex">
            {NAV_LINKS.map((link) => {
              const active = isActive(link.to)
              return (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    aria-current={active ? 'page' : undefined}
                    className={`group relative inline-flex min-h-[2.75rem] items-center px-2 text-xs uppercase tracking-widest transition-colors hover:text-foreground ${
                      active ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  >
                    {link.label}
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none absolute inset-x-2 bottom-2 h-px origin-left bg-primary/70 transition-transform duration-300 ${
                        active
                          ? 'scale-x-100'
                          : 'scale-x-0 group-hover:scale-x-100'
                      }`}
                    />
                  </Link>
                </li>
              )
            })}
          </ul>

          {/* Secondary links and CTA */}
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {/* Handles only — the brand has no verified profile URLs yet. */}
            {/* <div className="hidden items-center gap-3 xl:flex">
              {SOCIALS.map((social) => (
                <SocialHandle key={social.id} social={social} />
              ))}
            </div> */}

            {/* <Link
              to="/admin"
              className="hidden min-h-[2.75rem] items-center gap-1.5 rounded-full border border-border px-3 text-xs uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:border-primary/60 hover:text-primary md:inline-flex"
            >
              <Shield className="h-3.5 w-3.5 text-primary/80" aria-hidden="true" />
              Admin
            </Link> */}

            {/* Compact site search — submits to the shop's `q` param. Below lg
                the same field lives inside the drawer instead. */}
            <form
              role="search"
              onSubmit={handleSearchSubmit}
              className="relative hidden w-36 lg:block xl:w-48"
            >
              <label htmlFor="nav-search-desktop" className="sr-only">
                Search products
              </label>
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <input
                id="nav-search-desktop"
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search…"
                className="min-h-[2.75rem] w-full rounded-full border border-border bg-surface-2 py-2 pl-10 pr-4 text-xs text-foreground placeholder:text-subtle transition-colors focus:border-primary/60"
              />
            </form>

            <a
              href={LINKS.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-gold btn-gold-hover hidden min-h-[2.75rem] items-center gap-2 rounded-full px-3 text-xs uppercase tracking-[0.16em] sm:inline-flex"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              WhatsApp
            </a>

            <button
              ref={toggleRef}
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-controls="mobile-nav-panel"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:border-primary/60 hover:text-primary lg:hidden"
            >
              {menuOpen ? (
                <X className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Menu className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </Container>

        {/* Gold hairline — intensifies once the page has scrolled */}
        <div
          aria-hidden="true"
          className={`h-px w-full bg-gradient-to-r from-transparent via-primary to-transparent transition-opacity duration-500 ${
            scrolled ? 'opacity-70' : 'opacity-25'
          }`}
        />
      </nav>

      {/* Drawer lives outside the sticky bar so it is never clipped or blurred. */}
      <div
        className={`fixed inset-0 z-[60] overflow-hidden lg:hidden ${
          menuOpen ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
      >
        <div
          aria-hidden="true"
          onClick={closeMenu}
          className={`absolute inset-0 bg-background/85 backdrop-blur-sm transition-opacity duration-300 ${
            menuOpen ? 'opacity-100' : 'opacity-0'
          }`}
        />

        <div
          id="mobile-nav-panel"
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label="Site menu"
          inert={!menuOpen}
          onKeyDown={handlePanelKeyDown}
          className={`glass-dark absolute inset-y-0 right-0 flex w-[88vw] max-w-sm flex-col transition-transform duration-300 ease-out ${
            menuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-0 w-px bg-primary/50"
          />

          <div className="flex items-center justify-between gap-3 border-b border-border/70 px-5 py-4">
            <span className="font-display text-base tracking-[0.25em] text-gradient">
              {BRAND.name}
            </span>
            <button
              ref={closeRef}
              type="button"
              onClick={closeMenu}
              aria-label="Close menu"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary/60 hover:text-primary"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          <div className="scrollbar-slim flex-1 overflow-y-auto px-4 py-5">
            {/* The desktop search field, sized for thumbs. */}
            <form
              role="search"
              onSubmit={handleSearchSubmit}
              className="relative mb-5"
            >
              <label htmlFor="nav-search-drawer" className="sr-only">
                Search products
              </label>
              <Search
                className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <input
                id="nav-search-drawer"
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search products…"
                className="min-h-[2.75rem] w-full rounded-full border border-border bg-surface-2 py-3 pl-11 pr-4 text-sm text-foreground placeholder:text-subtle transition-colors focus:border-primary/60"
              />
            </form>

            <ul className="flex flex-col gap-1">
              {NAV_LINKS.map((link) => {
                const active = isActive(link.to)
                return (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      onClick={closeMenu}
                      aria-current={active ? 'page' : undefined}
                      className={`flex min-h-[3rem] w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left font-display text-2xl transition-colors hover:bg-primary/10 hover:text-primary ${
                        active ? 'text-primary' : 'text-foreground/90'
                      }`}
                    >
                      {link.label}
                      <span
                        aria-hidden="true"
                        className="h-px w-8 shrink-0 bg-primary/40"
                      />
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>

          <div className="border-t border-border/70 px-5 py-5">
            <Link
              to="/admin"
              onClick={closeMenu}
              className="flex min-h-[2.75rem] items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-primary"
            >
              <Shield className="h-4 w-4 text-primary/80" aria-hidden="true" />
              Admin
            </Link>

            <div className="mt-3 flex flex-col gap-2">
              {SOCIALS.map((social) => (
                <SocialHandle key={social.id} social={social} />
              ))}
            </div>

            <a
              href={LINKS.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-gold btn-gold-hover mt-5 inline-flex min-h-[2.75rem] w-full items-center justify-center gap-2 rounded-full px-5 text-xs uppercase tracking-[0.18em]"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              WhatsApp
            </a>
          </div>
        </div>
      </div>
    </>
  )
}

export default Navigation
