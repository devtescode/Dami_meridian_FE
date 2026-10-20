import { MapPin, MessageCircle } from 'lucide-react'
import { Container } from '@/components/Section'
import { BRAND, LINKS } from '@/lib/brand'
import { COLLECTIONS } from '@/lib/collections'

/**
 * The editorial brand statement.
 *
 * Every factual detail comes from `BRAND` / `COLLECTIONS` so the copy can
 * never drift from the catalogue. Deliberately no invented history, metrics,
 * delivery promises or certifications — only what the brand has supplied.
 */
export default function BrandStory() {
  return (
    <section id="about" className="relative overflow-hidden py-20 sm:py-24 lg:py-28">
      {/* Ambient gold wash — decorative only */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-primary/10 blur-3xl"
      />

      <Container>
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
          {/* ---- Editorial portrait ---- */}
          <div className="relative mx-auto w-full max-w-sm lg:col-span-5 lg:max-w-none">
            {/* Offset hairline frame gives the image a gallery mount */}
            <div
              aria-hidden="true"
              className="absolute -inset-3 hidden rounded-[1.75rem] border border-primary/15 sm:block"
            />

            <figure className="relative aspect-[4/5] overflow-hidden rounded-2xl gold-hairline shadow-2xl shadow-black/60 animate-slide-in-left">
              <img
                src="/images/brand-story.jpg"
                alt="DAMI MERIDIAN editorial portrait in a lilac shirt and tailored trousers"
                width={1400}
                height={2100}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover transition-transform duration-[900ms] ease-out hover:scale-105"
              />
            </figure>

            {/* A <figcaption> must be a child of its <figure>, and the frame
                above is aspect-locked and overflow-hidden — so the caption
                stays a plain paragraph directly beneath it. */}
            <p className="mt-5 flex items-start gap-2 text-sm text-muted-foreground">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <span>{BRAND.shortLocation}</span>
            </p>
          </div>

          {/* ---- Copy ---- */}
          <div className="lg:col-span-7 animate-slide-in-right">
            <p className="eyebrow mb-5">Our Story</p>

            <h2 className="text-4xl leading-[1.06] text-foreground sm:text-5xl lg:text-6xl">
              <span className="text-gradient tracking-[0.05em]">{BRAND.slogan}</span>
            </h2>

            <div className="rule-gold mt-7 w-24" aria-hidden="true" />

            <div className="mt-7 space-y-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
              <p>
                Style is what a room reads first. {BRAND.name} exists for the person who
                would rather be recognised than introduced — and for the details that do the
                talking: a round-neck tee that fits the way it should, a fragrance that stays
                with you, jewellery that finishes the sentence.
              </p>

              <p>
                The collection is deliberately tight: quality round-neck t-shirts for men and
                for women, unisex joggers, perfumes and jewellery. Nothing added for the sake
                of a longer menu — only pieces chosen so that style, scent and identity all
                point the same way.
              </p>

              <p>
                Based at {BRAND.location}, we are close enough to talk to. Ask about fit,
                sizing or which scent is yours, and place your order in the same
                conversation.
              </p>
            </div>

            {/* ---- Product lines, sourced from the catalogue ---- */}
            <div className="mt-9">
              <p className="text-[11px] uppercase tracking-[0.18em] text-subtle">
                The Collection
              </p>
              <ul className="mt-4 flex flex-wrap gap-2.5">
                {COLLECTIONS.map((collection) => (
                  <li
                    key={collection.id}
                    className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/5 px-4 py-2 text-sm text-muted-foreground"
                  >
                    <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-primary" />
                    {collection.name}
                  </li>
                ))}
              </ul>
            </div>

            {/* ---- WhatsApp CTA ---- */}
            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
              <a
                href={LINKS.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-gold btn-gold-hover inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-7 py-3.5 text-sm uppercase tracking-[0.12em]"
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                Chat on WhatsApp
              </a>
              <p className="text-sm leading-relaxed text-subtle sm:max-w-[15rem]">
                Talk to the team about sizing, options and anything else before you order.
              </p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}
