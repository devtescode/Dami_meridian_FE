import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Instagram, MapPin, MessageCircle, Phone } from 'lucide-react'
import { FaTiktok } from 'react-icons/fa'
import { BRAND, CONTACT, LINKS, SOCIALS } from '@/lib/brand'
import { COLLECTIONS } from '@/lib/collections'
import { Container } from '@/components/Section'

/** Top-level routes — mirrors the primary navigation as router links. */
const NAV_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Shop', to: '/shop' },
  { label: 'Collections', to: '/collections' },
  { label: 'About', to: '/about' },
  { label: 'Contact', to: '/contact' },
] as const

type SocialId = (typeof SOCIALS)[number]['id']

/** Props every social glyph accepts, including the AT hiding flag. */
type SocialIconProps = {
  className?: string
  'aria-hidden'?: boolean | 'true'
}

/**
 * Social glyphs are wrapped in arrow functions so both lucide and react-icons
 * components share one prop contract without a cast.
 */
const SOCIAL_ICONS: Record<SocialId, (props: SocialIconProps) => ReactNode> = {
  tiktok: (props) => <FaTiktok {...props} />,
  instagram: (props) => <Instagram {...props} />,
}

/** Consistent kicker for every footer column. */
function ColumnHeading({ children }: { children: ReactNode }) {
  return (
    <h3 className="font-sans text-xs font-medium uppercase tracking-[0.28em] text-primary">
      {children}
    </h3>
  )
}

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="relative overflow-hidden bg-surface">
      {/* Gold hairline that separates the footer from the page above. */}
      <div className="rule-gold absolute inset-x-0 top-0" aria-hidden="true" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-28 -top-28 h-72 w-72 rounded-full bg-primary/10 blur-3xl animate-float"
      />

      <Container className="relative z-10 py-16 sm:py-20 lg:py-24">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-10">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-4">
              <img
                src="/logo-mark.svg"
                alt={`${BRAND.name} logo mark`}
                width={48}
                height={48}
                loading="lazy"
                className="h-12 w-12 shrink-0"
              />
              <div className="min-w-0">
                <p className="font-display text-xl leading-none tracking-[0.2em] text-gradient sm:text-2xl">
                  {BRAND.name}
                </p>
                <p className="mt-2 text-[10px] uppercase tracking-[0.28em] text-primary">
                  {BRAND.slogan}
                </p>
              </div>
            </div>
            <p className="mt-6 max-w-xs text-sm leading-relaxed text-muted-foreground">
              {BRAND.tagline}
            </p>
          </div>

          {/* Links */}
          <nav aria-label="Footer navigation">
            <ColumnHeading>Explore</ColumnHeading>
            <ul className="mt-5 space-y-1">
              {NAV_LINKS.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="group inline-flex min-h-[44px] items-center gap-3 text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    <span
                      aria-hidden="true"
                      className="h-px w-4 bg-border transition-all duration-300 group-hover:w-6 group-hover:bg-primary"
                    />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Collections */}
          <div>
            <ColumnHeading>Collections</ColumnHeading>
            <ul className="mt-5 space-y-1">
              {COLLECTIONS.map((collection) => (
                <li key={collection.id}>
                  <Link
                    to={`/shop?collection=${collection.id}`}
                    className="group inline-flex min-h-[44px] items-center gap-3 text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    <span
                      aria-hidden="true"
                      className="h-px w-4 bg-border transition-all duration-300 group-hover:w-6 group-hover:bg-primary"
                    />
                    {collection.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="sm:col-span-2 lg:col-span-1">
            <ColumnHeading>Contact</ColumnHeading>
            <ul className="mt-5 space-y-4">
              <li className="flex items-start gap-3">
                <MessageCircle
                  aria-hidden="true"
                  className="mt-1 h-4 w-4 shrink-0 text-primary"
                />
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-subtle">
                    WhatsApp
                  </p>
                  <a
                    href={LINKS.whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-[44px] items-center text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {CONTACT.whatsapp}
                  </a>
                </div>
              </li>

              <li className="flex items-start gap-3">
                <Phone
                  aria-hidden="true"
                  className="mt-1 h-4 w-4 shrink-0 text-primary"
                />
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-subtle">
                    Phone
                  </p>
                  <a
                    href={LINKS.tel}
                    className="inline-flex min-h-[44px] items-center text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {CONTACT.phone}
                  </a>
                </div>
              </li>

              <li className="flex items-start gap-3">
                <MapPin
                  aria-hidden="true"
                  className="mt-1 h-4 w-4 shrink-0 text-primary"
                />
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-subtle">
                    Location
                  </p>
                  {/* No verified map URL, so the address is plain text. */}
                  <p className="py-2 text-sm leading-relaxed text-muted-foreground">
                    {CONTACT.location}
                  </p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Social — handles only, because no profile URLs have been verified. */}
        <div className="mt-14 border-t border-border pt-8 sm:mt-16">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-sans text-xs font-medium uppercase tracking-[0.28em] text-primary">
              Follow
            </p>
            <ul className="flex flex-wrap gap-3">
              {SOCIALS.map((social) => {
                const Icon = SOCIAL_ICONS[social.id]
                const label = `${social.label} — ${social.handle}`

                return (
                  <li key={social.id}>
                    {social.url ? (
                      <a
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={label}
                        className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-border bg-surface-2 px-4 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
                      >
                        {/* react-icons does not hide itself from assistive
                            technology the way lucide does. */}
                        <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
                        <span className="sr-only">{social.label} — </span>
                        {social.handle}
                      </a>
                    ) : (
                      // `aria-label` is prohibited on a <span> (implicit
                      // `generic` role) and is ignored, so the platform name
                      // is carried by visually hidden text instead.
                      <span
                        title={label}
                        className="inline-flex min-h-[44px] cursor-default items-center gap-2 rounded-full border border-border bg-surface-2 px-4 text-xs text-muted-foreground"
                      >
                        <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
                        <span className="sr-only">{social.label} — </span>
                        {social.handle}
                      </span>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 border-t border-border pt-8">
          <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
            <p className="text-xs text-muted-foreground">
              © {currentYear} {BRAND.name}. All rights reserved.
            </p>
            <p className="text-[11px] uppercase tracking-[0.24em] text-subtle">
              Fashion · Fragrance · Jewellery
            </p>
          </div>
        </div>
      </Container>
    </footer>
  )
}
