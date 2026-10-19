/**
 * "Why DAMI MERIDIAN" — the trust block.
 *
 * Every claim here is one the brand can actually stand behind: curation,
 * materials and the direct-to-chat ordering flow. Anything we cannot
 * evidence is deliberately left out of the copy.
 */

import { HeartHandshake, MessageCircle, ShieldCheck, Sparkles } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { Section } from '@/components/Section'
import { BRAND, LINKS } from '@/lib/brand'

interface ValueCard {
  id: string
  icon: LucideIcon
  title: string
  description: string
  image: string
  alt: string
}

const VALUE_CARDS: ValueCard[] = [
  {
    id: 'curation',
    icon: Sparkles,
    title: 'Chosen, Not Stacked',
    description:
      'Our round-neck t-shirts, joggers, perfumes and jewellery are picked one at a time — clean cuts, considered materials, nothing listed just to fill a grid. What you see is what we would wear.',
    image: '/images/why-1.jpg',
    alt: 'Black-and-white editorial of a model in a white textured t-shirt spraying perfume',
  },
  {
    id: 'ordering',
    icon: ShieldCheck,
    title: 'Every Detail in One Chat',
    description:
      'Choose your piece, size and colour, and the order opens as a WhatsApp chat with the product, the price and the options already inside it. Nothing is settled until you have seen everything and said yes.',
    image: '/images/why-3.jpg',
    alt: 'Three silver pendant necklaces with round stones laid out on black leather',
  },
  {
    id: 'service',
    icon: HeartHandshake,
    title: 'A Person, Not a Queue',
    description:
      'Questions about fit, scent or how a piece works with the rest of your wardrobe? Message the people who curated the collection and get a straight answer, usually in the same thread.',
    image: '/images/why-2.jpg',
    alt: 'Two men in neutral-toned hoodies standing side by side',
  },
]

export default function WhyShop() {
  return (
    <Section
      id="why"
      eyebrow="Why DAMI MERIDIAN"
      title={
        <>
          Built for how you <span className="text-gradient">actually dress</span>
        </>
      }
      description="Style, scent and identity from Ondo State, Nigeria. A tight, considered range — and an ordering flow that keeps you talking to a person instead of filling in a form."
    >
      <ul className="grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-3">
        {VALUE_CARDS.map((card) => {
          const Icon = card.icon

          return (
            <li
              key={card.id}
              className="card-luxury card-luxury-hover group flex h-full flex-col overflow-hidden"
            >
              <div className="relative overflow-hidden">
                <img
                  src={card.image}
                  alt={card.alt}
                  width={1400}
                  height={933}
                  loading="lazy"
                  decoding="async"
                  className="aspect-[3/2] w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
                {/* Fades the photo into the card so the badge reads cleanly */}
                <div
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-surface via-surface/30 to-transparent"
                  aria-hidden="true"
                />
              </div>

              <div className="relative flex flex-1 flex-col p-6 pt-10 sm:p-8 sm:pt-12">
                <span className="absolute -top-6 left-6 flex h-12 w-12 items-center justify-center rounded-full border border-primary/40 bg-primary/15 text-primary backdrop-blur-md transition-colors duration-500 group-hover:border-primary/70 group-hover:text-gold-light sm:left-8">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>

                <h3 className="text-2xl leading-tight text-foreground sm:text-3xl">
                  {card.title}
                </h3>
                <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                  {card.description}
                </p>
              </div>
            </li>
          )
        })}
      </ul>

      <div className="glass-gold mt-12 rounded-2xl px-6 py-10 text-center sm:mt-16 sm:px-10 sm:py-12">
        <h3 className="text-2xl leading-tight text-foreground sm:text-3xl">
          Talk to us before you order
        </h3>
        <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
          Message {BRAND.name} on WhatsApp and tell us what you are after — we will
          help you pick the size, the scent and the piece that fits.
        </p>
        <a
          href={LINKS.whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-gold btn-gold-hover mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-medium uppercase sm:px-8"
        >
          <MessageCircle className="h-4 w-4" aria-hidden="true" />
          Chat on WhatsApp
        </a>
      </div>
    </Section>
  )
}
