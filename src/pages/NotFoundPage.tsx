import { Link } from 'react-router-dom'
import { MessageCircle } from 'lucide-react'

import { Container } from '@/components/Section'
import { usePageTitle } from '@/hooks/usePageTitle'
import { getGeneralWhatsAppLink } from '@/lib/whatsapp'

/**
 * Route-less URL catch-all (`*`). Stays deliberately small: one editorial
 * header, two ways back into the site and an optional WhatsApp hand-off.
 * No invented error codes, status text or suggestions beyond what the
 * router can actually honour.
 */
export default function NotFoundPage() {
  usePageTitle('Page Not Found')

  return (
    <Container className="flex min-h-[70vh] flex-col items-center justify-center py-20 text-center sm:py-28">
      <nav aria-label="Breadcrumb" className="mb-10">
        <ol className="flex flex-wrap items-center justify-center gap-2 text-[11px] uppercase tracking-[0.2em]">
          <li>
            <Link
              to="/"
              className="text-subtle transition-colors hover:text-primary"
            >
              Home
            </Link>
            <span aria-hidden="true" className="ml-2 text-border">
              /
            </span>
          </li>
          <li aria-current="page" className="text-muted-foreground">
            Not Found
          </li>
        </ol>
      </nav>

      <p className="eyebrow mb-6">Lost?</p>

      <h1 className="font-display text-7xl leading-none text-foreground sm:text-8xl lg:text-9xl">
        404
        <span className="mt-4 block text-3xl text-gradient sm:text-4xl lg:text-5xl">
          Page not found
        </span>
      </h1>

      <div className="rule-gold mx-auto mt-9 w-24" aria-hidden="true" />

      <p className="mt-8 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
        The page you are looking for may have moved or never existed. Nothing
        is lost &mdash; head back to the home page, or browse the full range
        in the shop.
      </p>

      <div className="mt-11 flex w-full flex-col items-center justify-center gap-4 sm:w-auto sm:flex-row">
        <Link
          to="/"
          className="btn-gold btn-gold-hover inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full px-8 text-sm font-medium tracking-[0.06em] sm:w-auto sm:text-base"
        >
          Back to Home
        </Link>

        <Link
          to="/shop"
          className="btn-outline-gold btn-outline-gold-hover inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full px-8 text-sm font-medium tracking-[0.06em] sm:w-auto sm:text-base"
        >
          Browse the Shop
        </Link>
      </div>

      <a
        href={getGeneralWhatsAppLink()}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-9 inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground underline decoration-primary/50 underline-offset-4 transition-colors hover:text-gold-light"
      >
        <MessageCircle className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
        Rather ask a person? Chat with us on WhatsApp
      </a>
    </Container>
  )
}
