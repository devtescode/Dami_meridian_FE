import { Eye, LayoutGrid, MessageCircle, PackageCheck } from 'lucide-react'
import { Section } from '@/components/Section'

/**
 * The four steps of the real ordering flow.
 *
 * There is no cart and no checkout page — every order is placed as a WhatsApp
 * message, so the copy explains that conversation rather than a checkout UI.
 */
const steps = [
  {
    icon: LayoutGrid,
    title: 'Browse the Collection',
    description:
      'Move through the collection by category — apparel, fragrance and jewellery — and open anything that catches your eye.',
  },
  {
    icon: Eye,
    title: 'View the Details',
    description:
      'Open a product to see every image, the description and the price, so you know exactly what you are asking for.',
  },
  {
    icon: MessageCircle,
    title: 'Order on WhatsApp',
    description:
      'Tap "Order on WhatsApp" and a chat opens with the product name, the price and the product image already written into the message.',
  },
  {
    icon: PackageCheck,
    title: 'Confirm Your Order',
    description:
      'Send the message, confirm your size, colour and where it should go in the chat, and the order is in with the team.',
  },
] as const

export default function HowItWorks() {
  return (
    <Section
      id="how-to-order"
      eyebrow="How to Order"
      title={
        <>
          Four Steps,{' '}
          <span className="text-gradient">One Conversation</span>
        </>
      }
      description="Every order is placed directly on WhatsApp. Browse the collection, open what you like, and your message arrives with the product already in it — no cart, no checkout page, nothing lost in between."
      className="overflow-hidden"
      contentClassName="relative"
    >
      {/* Ambient gold wash — decorative only */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 top-10 h-72 w-72 rounded-full bg-primary/10 blur-3xl"
      />

      <ol className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-4">
        {steps.map((step, index) => {
          const Icon = step.icon
          const isLast = index === steps.length - 1

          return (
            <li
              key={step.title}
              className="card-luxury card-luxury-hover glass relative flex h-full animate-fade-in-up flex-col rounded-2xl p-6"
              style={{ animationDelay: `${index * 0.12}s` }}
            >
              {/* Hairline bridging one card to the next, wide screens only */}
              {!isLast && (
                <span
                  aria-hidden="true"
                  className="absolute top-12 -right-8 hidden h-px w-8 bg-gradient-to-r from-primary/20 via-primary/60 to-primary/20 lg:block"
                />
              )}

              <span className="sr-only">{`Step ${index + 1} of ${steps.length}: `}</span>

              <div className="flex items-center gap-4">
                {/* Numbered gold badge */}
                <span
                  aria-hidden="true"
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gold-light to-primary text-lg font-medium text-primary-foreground shadow-lg shadow-primary/20"
                >
                  {index + 1}
                </span>

                <span
                  aria-hidden="true"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-primary/25 bg-primary/10 text-primary"
                >
                  <Icon className="h-5 w-5" />
                </span>
              </div>

              <h3 className="mt-6 text-xl text-foreground sm:text-2xl">{step.title}</h3>

              <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                {step.description}
              </p>
            </li>
          )
        })}
      </ol>
    </Section>
  )
}
