import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Instagram, MapPin, MessageCircle, Phone, Send } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { FaTiktok } from 'react-icons/fa'
import { Section } from '@/components/Section'
import { BRAND, CONTACT, LINKS, SOCIALS } from '@/lib/brand'
import { buildWhatsAppLink } from '@/lib/whatsapp'

interface ContactDetail {
  id: string
  label: string
  value: string
  Icon: LucideIcon
  note?: string
  /** Absent for the address: no verified map link exists for the studio. */
  href?: string
  /** True for links that leave the site; `tel:` links stay in the current tab. */
  external?: boolean
}

/** Every visible detail is read from the brand constants so the section cannot drift. */
const CONTACT_DETAILS: ContactDetail[] = [
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    value: CONTACT.whatsapp,
    note: 'Start a chat',
    href: LINKS.whatsapp,
    external: true,
    Icon: MessageCircle,
  },
  {
    id: 'phone',
    label: 'Phone',
    value: CONTACT.phone,
    note: 'Call the team',
    href: LINKS.tel,
    Icon: Phone,
  },
  {
    id: 'location',
    label: 'Location',
    value: CONTACT.location,
    Icon: MapPin,
  },
]

/**
 * Opens a WhatsApp deep link in a new tab.
 * A real anchor is used (rather than `window.open`) so the browser treats the
 * navigation exactly like a user click — `window.open` with `noopener` always
 * returns null, which would make a pop-up-blocker check unreliable.
 */
function openInNewTab(url: string) {
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.target = '_blank'
  anchor.rel = 'noopener noreferrer'
  anchor.style.display = 'none'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
}

export default function Contact() {
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  /** URL of the last hand-off, kept so a blocked pop-up can still be retried. */
  const [handoffUrl, setHandoffUrl] = useState<string | null>(null)
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const node = sectionRef.current
    if (!node) return

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry?.isIntersecting) {
          entry.target.classList.add('animate-fade-in')
          observer.unobserve(entry.target)
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmedName = name.trim()
    const trimmedMessage = message.trim()
    if (!trimmedName || !trimmedMessage) return

    // There is no contact endpoint, so the enquiry is handed to WhatsApp
    // with the customer's details prefilled for them to send.
    const text = `Hello ${BRAND.name},\n\nMy name is ${trimmedName}.\n\n${trimmedMessage}`
    const url = buildWhatsAppLink(text)

    setHandoffUrl(url)
    openInNewTab(url)
  }

  return (
    <div ref={sectionRef}>
      <Section
        id="contact"
        eyebrow="Contact"
        title={<span className="text-gradient">Get in Touch</span>}
        description="Questions about a piece, an order or a collaboration? Send us a message and continue the conversation with the team on WhatsApp."
        className="overflow-hidden bg-gradient-to-b from-background via-surface/50 to-background"
      >
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-14">
          {/* ---------------- Left: contact details ---------------- */}
          <div className="flex flex-col gap-6">
            <h3 className="font-display text-2xl text-foreground sm:text-3xl">
              Reach us directly
            </h3>

            <ul className="flex flex-col gap-4">
              {CONTACT_DETAILS.map((detail) => {
                const { Icon } = detail
                return (
                  <li
                    key={detail.id}
                    className="glass flex items-start gap-4 rounded-2xl p-5 sm:gap-5 sm:p-6"
                  >
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="eyebrow">{detail.label}</p>
                      {detail.href ? (
                        <a
                          href={detail.href}
                          target={detail.external ? '_blank' : undefined}
                          rel={detail.external ? 'noopener noreferrer' : undefined}
                          className="mt-2 block break-words text-lg text-foreground transition-colors hover:text-gold-light"
                        >
                          {detail.value}
                        </a>
                      ) : (
                        <p className="mt-2 break-words text-lg text-foreground">
                          {detail.value}
                        </p>
                      )}
                      {detail.note && (
                        <p className="mt-1 text-sm text-muted-foreground">{detail.note}</p>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>

            {/* ---------------- Social handles ---------------- */}
            <div className="glass rounded-2xl p-5 sm:p-6">
              <p className="eyebrow">Follow</p>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                {SOCIALS.map((social) => {
                  const Icon = social.id === 'tiktok' ? FaTiktok : Instagram
                  return (
                    // No verified profile URL exists yet, so the handle is shown
                    // as plain text rather than a link to a made-up address.
                    // The platform name is already rendered as visible text,
                    // and `aria-label` would be prohibited on this <span>
                    // (implicit `generic` role) and therefore ignored.
                    <span
                      key={social.id}
                      title={`${social.label} — ${social.handle}`}
                      className="flex min-h-11 items-center gap-3 rounded-xl border border-border bg-surface/60 px-4 py-3"
                    >
                      <Icon className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                      <span className="min-w-0">
                        <span className="block text-[11px] uppercase tracking-[0.18em] text-subtle">
                          {social.label}
                        </span>
                        <span className="block truncate font-medium text-foreground">
                          {social.handle}
                        </span>
                      </span>
                    </span>
                  )
                })}
              </div>
              <p className="mt-4 text-xs text-subtle">
                Profile links are not published yet.
              </p>
            </div>
          </div>

          {/* ---------------- Right: enquiry form ---------------- */}
          <form
            onSubmit={handleSubmit}
            className="glass h-fit rounded-2xl p-6 sm:p-8 lg:p-10"
          >
            <h3 className="font-display text-2xl text-foreground sm:text-3xl">
              Send us a message
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Submitting opens WhatsApp with your message ready to send — this page
              does not deliver anything to an inbox.
            </p>

            <div className="mt-7 space-y-5">
              <div>
                <label
                  htmlFor="contact-name"
                  className="mb-2 block text-sm font-medium text-foreground"
                >
                  Full Name
                  <span className="ml-1 text-primary" aria-hidden="true">
                    *
                  </span>
                </label>
                <input
                  id="contact-name"
                  name="name"
                  type="text"
                  required
                  autoComplete="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Your name"
                  className="min-h-11 w-full rounded-lg border border-border bg-input px-4 py-3 text-foreground placeholder:text-subtle transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div>
                <label
                  htmlFor="contact-message"
                  className="mb-2 block text-sm font-medium text-foreground"
                >
                  Message
                  <span className="ml-1 text-primary" aria-hidden="true">
                    *
                  </span>
                </label>
                <textarea
                  id="contact-message"
                  name="message"
                  required
                  rows={5}
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Tell us how we can help…"
                  className="min-h-40 w-full resize-y rounded-lg border border-border bg-input px-4 py-3 text-foreground placeholder:text-subtle transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <button
                type="submit"
                className="btn-gold btn-gold-hover inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg px-8 text-sm uppercase tracking-[0.18em] sm:w-auto"
              >
                <Send className="h-4 w-4" aria-hidden="true" />
                Continue on WhatsApp
              </button>

              {/* Live region stays mounted so the hand-off is announced. */}
              <div role="status" aria-live="polite" className="min-h-6">
                {handoffUrl && (
                  <div className="rounded-lg border border-primary/30 bg-primary/10 p-4">
                    <p className="text-sm text-foreground">
                      Opening WhatsApp with your message… send it there to reach the
                      team.
                    </p>
                    <a
                      href={handoffUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block text-sm text-gold-light underline underline-offset-4 transition-colors hover:text-foreground"
                    >
                      Open WhatsApp manually
                    </a>
                  </div>
                )}
              </div>
            </div>
          </form>
        </div>
      </Section>
    </div>
  )
}
