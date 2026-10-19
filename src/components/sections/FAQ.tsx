import { useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { ChevronDown, MessageCircle, Phone } from 'lucide-react'
import { Section } from '@/components/Section'
import { BRAND, CONTACT, LINKS } from '@/lib/brand'

interface FaqItem {
  id: string
  question: string
  /** Rich text so answers can embed contact links where that helps. */
  answer: ReactNode
}

/**
 * Only questions we can answer truthfully. No return windows, delivery
 * timelines, warranty terms or payment methods are stated here — where a
 * policy would be needed but has not been supplied, the answer points the
 * customer to WhatsApp so we confirm it in the moment instead of guessing.
 */
const faqs: FaqItem[] = [
  {
    id: 'order',
    question: 'How do I place an order?',
    answer:
      'Tap "Order on WhatsApp" on any product. A chat opens pre-filled with the product name, price and image — you confirm the order in the chat and we take it from there.',
  },
  {
    id: 'products',
    question: 'What products do you sell?',
    answer:
      "Men's and women's round-neck t-shirts, unisex joggers, perfumes and jewellery. The full range lives in the shop, and every piece has its own page.",
  },
  {
    id: 'sizes-and-colours',
    question: 'Do you offer sizes and colours?',
    answer:
      'Only for the products that list them. Where sizes or colours are available they are shown on the product page, so you can choose before you message us.',
  },
  {
    id: 'availability',
    question: 'How do I know which fragrances or pieces are available?',
    answer:
      'Availability is shown on each product. If a fragrance or piece is listed as unavailable, message us on WhatsApp and we will confirm when it is back.',
  },
  {
    id: 'location',
    question: 'Where are you based?',
    answer: `We are based in ${BRAND.location}. Every order is arranged personally over WhatsApp.`,
  },
  {
    id: 'contact',
    question: 'How do I contact you?',
    answer: (
      <>
        WhatsApp{' '}
        <a
          href={LINKS.whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline underline-offset-4 transition-colors hover:text-gold-light"
        >
          {CONTACT.whatsapp}
        </a>{' '}
        or call{' '}
        <a
          href={LINKS.tel}
          className="text-primary underline underline-offset-4 transition-colors hover:text-gold-light"
        >
          {CONTACT.phone}
        </a>
        . We are happy to answer anything about a piece before you order.
      </>
    ),
  },
]

export default function FAQ() {
  const [openId, setOpenId] = useState<string | null>(null)
  const triggerRefs = useRef<Array<HTMLButtonElement | null>>([])

  /** Arrow-key movement between headers, following the WAI-ARIA accordion pattern. */
  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = faqs.length - 1
    let target: number | null = null

    switch (event.key) {
      case 'ArrowDown':
        target = index === last ? 0 : index + 1
        break
      case 'ArrowUp':
        target = index === 0 ? last : index - 1
        break
      case 'Home':
        target = 0
        break
      case 'End':
        target = last
        break
      default:
        return
    }

    event.preventDefault()
    triggerRefs.current[target]?.focus()
  }

  return (
    <Section
      id="faq"
      eyebrow="Support"
      title="Frequently Asked Questions"
      description="The practical details — ordering, sizing and availability — answered plainly. Anything else, message us on WhatsApp and we will confirm it for you."
    >
      <div className="mx-auto w-full max-w-3xl">
        <div className="flex flex-col gap-4">
          {faqs.map((faq, index) => {
            const isOpen = openId === faq.id
            const triggerId = `faq-trigger-${faq.id}`
            const panelId = `faq-panel-${faq.id}`

            return (
              <div
                key={faq.id}
                className="glass overflow-hidden rounded-2xl"
              >
                <h3>
                  <button
                    type="button"
                    id={triggerId}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => setOpenId(isOpen ? null : faq.id)}
                    onKeyDown={(event) => handleKeyDown(event, index)}
                    ref={(node) => {
                      triggerRefs.current[index] = node
                    }}
                    className="group flex w-full items-center justify-between gap-5 px-5 py-5 text-left transition-colors duration-300 sm:px-7 sm:py-6"
                  >
                    <span
                      className={`font-display text-lg transition-colors duration-300 sm:text-xl ${
                        isOpen ? 'text-primary' : 'text-foreground group-hover:text-primary'
                      }`}
                    >
                      {faq.question}
                    </span>
                    <span
                      aria-hidden="true"
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition-colors duration-300 ${
                        isOpen
                          ? 'border-primary/50 text-primary'
                          : 'border-border text-muted-foreground group-hover:border-primary/50 group-hover:text-primary'
                      }`}
                    >
                      <ChevronDown
                        size={20}
                        className={`transition-transform duration-300 ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </span>
                  </button>
                </h3>

                {/* The panel stays in the DOM so aria-controls always resolves. */}
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={triggerId}
                  hidden={!isOpen}
                  className="border-t border-border/60 px-5 pb-6 pt-5 sm:px-7"
                >
                  <div className="animate-fade-in text-base leading-relaxed text-muted-foreground sm:text-lg">
                    {faq.answer}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="glass mt-12 rounded-2xl px-6 py-10 text-center sm:px-12 sm:py-14">
          <div className="rule-gold mx-auto mb-8 w-16" aria-hidden="true" />
          <h3 className="font-display text-2xl text-foreground sm:text-3xl">
            Didn&apos;t find your answer?
          </h3>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Send us a message and we will answer you directly — no policy documents,
            just a real reply from the brand.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href={LINKS.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-gold btn-gold-hover inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full px-8 py-4 text-sm"
            >
              <MessageCircle size={18} aria-hidden="true" />
              Chat on WhatsApp
            </a>
            <a
              href={LINKS.tel}
              className="btn-outline-gold btn-outline-gold-hover inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full px-8 py-4 text-sm"
            >
              <Phone size={18} aria-hidden="true" />
              {CONTACT.phone}
            </a>
          </div>
        </div>
      </div>
    </Section>
  )
}
