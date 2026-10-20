import { Link } from 'react-router-dom'

import { Container } from '@/components/Section'
import Contact from '@/components/sections/Contact'
import FAQ from '@/components/sections/FAQ'
import { usePageTitle } from '@/hooks/usePageTitle'

/**
 * `/contact` — the contact block (WhatsApp / phone / location details plus
 * the WhatsApp hand-off form) followed by the FAQ. Both live actions,
 * `LINKS.whatsapp` and `LINKS.tel`, are rendered inside `Contact`, so the
 * page header deliberately adds no duplicate contact links.
 */
export default function ContactPage() {
  usePageTitle('Contact')

  return (
    <>
      <Container className="pt-8 sm:pt-12 lg:pt-16">
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.2em]">
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
              Contact
            </li>
          </ol>
        </nav>

        <header className="mt-8 max-w-3xl sm:mt-10">
          <p className="eyebrow mb-4">Reach the Team</p>

          <h1 className="text-4xl leading-[1.08] text-foreground sm:text-5xl lg:text-6xl">
            Contact <span className="text-gradient">Us</span>
          </h1>

          <div className="rule-gold mt-7 w-24" aria-hidden="true" />

          <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Questions about a piece, an order or a collaboration? Message the
            team on WhatsApp, call directly, or leave your note below &mdash;
            the practical answers may already be in the FAQ.
          </p>
        </header>
      </Container>

      {/* Contact details + WhatsApp hand-off form, then the FAQ. */}
      <Contact />
      <FAQ />
    </>
  )
}
