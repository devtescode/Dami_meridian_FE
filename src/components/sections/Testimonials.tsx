import { useState, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight, MessageCircle, Quote, Star } from 'lucide-react'
import { Section } from '@/components/Section'
import { LINKS } from '@/lib/brand'

interface Testimonial {
  /** Stable key for the slide. */
  id: string
  /** The customer's real name, exactly as they gave it. */
  name: string
  /** Short descriptor, e.g. "Verified customer" or a city. */
  role: string
  /** The review, word for word. */
  quote: string
  /** Whole-star rating out of five. */
  rating: number
  /** Optional portrait — a real photo of the reviewer, never a stock portrait. */
  avatar?: string
}

/**
 * Genuine customer reviews only.
 *
 * The list is intentionally empty. The brand has no verified reviews yet, and
 * invented names, star ratings or stock portraits would put a fabrication in
 * the brand's own voice. Add a real review here — id, name, role, quote,
 * rating and an optional avatar — and the carousel takes over automatically.
 * Until then the section renders an honest "coming soon" panel instead of
 * placeholder content.
 */
const testimonials: Testimonial[] = []

const MAX_RATING = 5

function RatingStars({ rating }: { rating: number }) {
  return (
    <div
      className="flex items-center justify-center gap-1"
      role="img"
      aria-label={`Rated ${rating} out of ${MAX_RATING} stars`}
    >
      {Array.from({ length: MAX_RATING }, (_, index) => (
        <Star
          key={index}
          size={18}
          aria-hidden="true"
          className={
            // Unfilled stars are a non-text indicator, so they need 3:1.
            // /60 is 4.01:1 on the panel; /25 was only 1.70:1.
            index < rating
              ? 'fill-primary text-primary'
              : 'text-muted-foreground/60'
          }
        />
      ))}
    </div>
  )
}

function ArrowButton({
  label,
  onClick,
  children,
}: {
  label: string
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="pointer-events-auto inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface/80 text-muted-foreground transition-colors duration-300 hover:border-primary/60 hover:text-primary"
    >
      {children}
    </button>
  )
}

interface CarouselProps {
  items: Testimonial[]
  testimonial: Testimonial
  index: number
  total: number
  onPrevious: () => void
  onNext: () => void
  onSelect: (index: number) => void
}

function TestimonialCarousel({
  items,
  testimonial,
  index,
  total,
  onPrevious,
  onNext,
  onSelect,
}: CarouselProps) {
  const initials = testimonial.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')

  return (
    <div className="relative mx-auto w-full max-w-3xl">
      {/* Flanking arrows only from lg up, where the card leaves room for them.
          Below that they live in the control row so nothing is ever clipped. */}
      <div className="pointer-events-none absolute inset-y-0 -left-14 hidden items-center lg:flex">
        <ArrowButton label="Previous review" onClick={onPrevious}>
          <ChevronLeft size={20} aria-hidden="true" />
        </ArrowButton>
      </div>
      <div className="pointer-events-none absolute inset-y-0 -right-14 hidden items-center lg:flex">
        <ArrowButton label="Next review" onClick={onNext}>
          <ChevronRight size={20} aria-hidden="true" />
        </ArrowButton>
      </div>

      <figure
        className="glass rounded-2xl px-6 py-10 text-center sm:px-12 sm:py-14"
        aria-live="polite"
        aria-atomic="true"
      >
        <Quote size={30} className="mx-auto mb-7 text-primary/40" aria-hidden="true" />

        <RatingStars rating={testimonial.rating} />

        <blockquote className="mt-8 font-display text-2xl leading-[1.35] text-foreground sm:text-3xl lg:text-4xl">
          &ldquo;{testimonial.quote}&rdquo;
        </blockquote>

        <figcaption className="mt-10 flex flex-col items-center gap-4 border-t border-border/60 pt-8 sm:flex-row sm:justify-center">
          {testimonial.avatar ? (
            <img
              src={testimonial.avatar}
              alt=""
              loading="lazy"
              className="h-14 w-14 rounded-full object-cover ring-1 ring-primary/40"
            />
          ) : (
            <span
              aria-hidden="true"
              className="flex h-14 w-14 items-center justify-center rounded-full border border-primary/30 bg-primary/10 font-display text-lg text-primary"
            >
              {initials}
            </span>
          )}
          <div className="text-center sm:text-left">
            <p className="font-display text-xl text-foreground">{testimonial.name}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
              {testimonial.role}
            </p>
          </div>
        </figcaption>
      </figure>

      <div className="mt-8 flex items-center justify-center gap-1 sm:gap-2">
        <span className="lg:hidden">
          <ArrowButton label="Previous review" onClick={onPrevious}>
            <ChevronLeft size={20} aria-hidden="true" />
          </ArrowButton>
        </span>

        {items.map((item, dotIndex) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(dotIndex)}
            aria-label={`Go to review ${dotIndex + 1} of ${total}`}
            aria-current={dotIndex === index ? 'true' : undefined}
            className="inline-flex h-11 w-11 items-center justify-center"
          >
            <span
              aria-hidden="true"
              // The inactive dot is a non-text indicator, so it needs 3:1.
              // /60 is 4.10:1 on the background; /30 was only 1.86:1.
              className={`block h-2.5 rounded-full transition-all duration-300 ${
                dotIndex === index
                  ? 'w-8 bg-primary'
                  : 'w-2.5 bg-muted-foreground/60 hover:bg-muted-foreground/80'
              }`}
            />
          </button>
        ))}

        <span className="lg:hidden">
          <ArrowButton label="Next review" onClick={onNext}>
            <ChevronRight size={20} aria-hidden="true" />
          </ArrowButton>
        </span>
      </div>
    </div>
  )
}

function EmptyTestimonials() {
  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="glass rounded-2xl px-6 py-12 text-center sm:px-12 sm:py-16">
        <Quote size={30} className="mx-auto mb-7 text-primary/40" aria-hidden="true" />

        <p className="eyebrow mb-5">No reviews yet</p>

        <h3 className="font-display text-2xl leading-snug text-foreground sm:text-3xl">
          Reviews are coming soon &mdash; DAMI MERIDIAN has been welcoming its first
          customers.
        </h3>

        <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
          We would rather leave this space honest than fill it with invented names,
          ratings and stock photography. As soon as real customers share their
          experience, their words appear here.
        </p>

        <div className="mt-10 flex flex-col items-center gap-5">
          <a
            href={LINKS.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline-gold btn-outline-gold-hover inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full px-8 py-4 text-sm"
          >
            <MessageCircle size={18} aria-hidden="true" />
            Chat on WhatsApp
          </a>
          <p className="text-sm text-muted-foreground">
            Ordered recently? Send us a message &mdash; we would love to hear your thoughts.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const total = testimonials.length
  const current: Testimonial | undefined = testimonials[currentIndex]
  const hasReviews = total > 0

  const showPrevious = () => {
    if (total === 0) return
    setCurrentIndex((previous) => (previous - 1 + total) % total)
  }

  const showNext = () => {
    if (total === 0) return
    setCurrentIndex((previous) => (previous + 1) % total)
  }

  return (
    <Section
      id="testimonials"
      eyebrow="Testimonials"
      title={hasReviews ? 'In Their Own Words' : 'Customer Reviews'}
      description={
        hasReviews
          ? 'Unedited words from the people who wear DAMI MERIDIAN.'
          : 'DAMI MERIDIAN is still young. This space is reserved for real reviews only — nothing is written here until it has actually been said.'
      }
    >
      {hasReviews && current ? (
        <TestimonialCarousel
          items={testimonials}
          testimonial={current}
          index={currentIndex}
          total={total}
          onPrevious={showPrevious}
          onNext={showNext}
          onSelect={setCurrentIndex}
        />
      ) : (
        <EmptyTestimonials />
      )}
    </Section>
  )
}
