import { ArrowRight, Gem, Heart, MessageCircle, ShieldCheck, Truck } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Container } from '@/components/Section'
import { BRAND } from '@/lib/brand'
import { getGeneralWhatsAppLink } from '@/lib/whatsapp'

/**
 * Qualitative promises supplied by the brand — labels only.
 * No figures are shown because the business has not supplied verified metrics.
 */
const TRUST_POINTS: { icon: LucideIcon; label: string }[] = [
  { icon: Gem, label: 'Premium Quality' },
  { icon: ShieldCheck, label: 'Secure Ordering' },
  { icon: Truck, label: 'Reliable Delivery' },
  { icon: Heart, label: 'Customer Satisfaction' },
]

export default function Hero() {
  return (
    <section
      id="home"
      aria-labelledby="hero-heading"
      className="relative flex min-h-[100dvh] flex-col justify-center overflow-hidden bg-background"
    >
      {/* Ambient gold light so the flat black canvas still feels lit */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 top-16 h-80 w-80 rounded-full bg-primary/10 blur-3xl animate-float" />
        <div
          className="absolute -right-20 bottom-4 h-96 w-96 rounded-full bg-primary/10 blur-3xl animate-float"
          style={{ animationDelay: '1.6s' }}
        />
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-surface/70 to-transparent" />
      </div>

      <Container className="pt-20 pb-16 sm:pt-32 sm:pb-20 lg:pt-26 lg:pb-24">
        <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14 xl:gap-20">
          {/* ---- Copy column ---- */}
          <div className="min-w-0 animate-fade-in-up">
            <p className="eyebrow mb-5">Fashion · Fragrance · Jewellery</p>

            <h1
              id="hero-heading"
              className="font-display text-5xl leading-[0.95] sm:text-6xl lg:text-7xl xl:text-8xl"
            >
              {/* One readable slogan for assistive tech; the stacked words are decorative repeats */}
              <span className="sr-only">{BRAND.slogan}</span>
              {BRAND.sloganWords.map((word, index) => (
                <span
                  key={word}
                  aria-hidden="true"
                  className={
                    index === BRAND.sloganWords.length - 1
                      ? 'block w-fit text-gradient'
                      : 'block text-foreground'
                  }
                >
                  {word}
                </span>
              ))}
            </h1>

            <div className="rule-gold mt-8 w-24" aria-hidden="true" />

            <p className="mt-8 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Discover your signature style with quality fashion, captivating fragrances, and carefully selected jewelry designed to express who you are.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
              <Link
                to="/collections"
                className="btn-gold btn-gold-hover inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-8 text-sm font-medium tracking-[0.06em] sm:text-base"
              >
                Explore Collections
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>

              <a
                href={getGeneralWhatsAppLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline-gold btn-outline-gold-hover inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-8 text-sm font-medium tracking-[0.06em] sm:text-base"
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                Chat on WhatsApp
              </a>
            </div>
          </div>

          {/* ---- Imagery column ---- */}
          <div className="relative min-w-0 animate-slide-in-right">
            {/* Capped width keeps the frame a tall portrait rather than a letterbox crop */}
            <div className="relative mx-auto w-full max-w-[20rem] sm:max-w-[22rem] lg:max-w-[24rem] xl:max-w-[28rem]">
              {/* Halo sits behind the frame so the hairline border reads as lit */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -inset-5 rounded-[2.75rem] bg-primary/15 blur-3xl"
              />

              <figure className="relative h-[22rem] max-h-[70vh] overflow-hidden rounded-3xl gold-hairline shadow-2xl shadow-primary/20 animate-drift sm:h-[26rem] lg:h-[30rem] xl:h-[32rem]">
                <img
                  src="/images/hero-editorial.jpg"
                  alt="Black and white editorial portrait of a model wearing gold rings and earrings, resting her hands on a white plinth"
                  width={1400}
                  height={2100}
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                  className="h-full w-full object-cover"
                />
                {/* Fade the photograph into the page background so the frame sits inside the layout */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent"
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 bg-gradient-to-r from-background/70 via-transparent to-transparent"
                />
              </figure>
            </div>
          </div>
        </div>

        {/* ---- Trust indicators: 2x2 on mobile, four across from sm ---- */}
        <ul className="mx-auto mt-12 grid w-full max-w-md grid-cols-2 justify-items-center gap-x-4 gap-y-8 sm:mt-14 sm:max-w-none sm:grid-cols-4 sm:gap-8">
          {TRUST_POINTS.map(({ icon: Icon, label }) => (
            <li key={label} className="flex flex-col items-center gap-3 text-center">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-primary/25 bg-primary/10 text-primary">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="text-sm font-medium leading-snug text-muted-foreground">
                {label}
              </span>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  )
}
