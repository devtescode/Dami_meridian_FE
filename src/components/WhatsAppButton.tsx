import { useEffect, useState } from 'react'
import { FaWhatsapp } from 'react-icons/fa'
import { getGeneralWhatsAppLink } from '@/lib/whatsapp'
import { BRAND } from '@/lib/brand'

/**
 * The chat button is fixed to the bottom-right, so it inevitably sits over
 * whatever content happens to be in that corner of the viewport. Auditing the
 * live page showed it covering the contact form's submit button, the FAQ
 * chevrons, the shop sort dropdown and the product card actions at phone and
 * tablet widths.
 *
 * Visibility follows one rule set:
 * - A page too short to scroll past 400px (a 404, a short form) can never
 *   park the button over "more content below" — it shows at all times.
 * - On a scrollable page it hides inside the hero and while the visitor
 *   scrolls down (reading), and returns as soon as they scroll up or stop.
 */
export default function WhatsAppButton() {
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    let lastY = window.scrollY
    let idleTimer: ReturnType<typeof setTimeout> | undefined

    /** True when the viewport could scroll past the hero threshold. */
    const isScrollable = () =>
      document.documentElement.scrollHeight - window.innerHeight > 400

    /** True when the button would sit over the hero artwork. */
    const atHeroTop = () => window.scrollY <= 400

    const settle = () => {
      // Short page: never hide. Scrollable: only while still in the hero.
      setHidden(isScrollable() && atHeroTop())
    }

    const onScroll = () => {
      const y = window.scrollY

      if (!isScrollable()) {
        setHidden(false)
        lastY = y
        return
      }

      if (y > lastY + 4) {
        // Scrolling down: get out of the way.
        setHidden(true)
      } else if (y < lastY - 4) {
        // Scrolling up: come straight back unless parked at the hero top.
        settle()
      } else if (atHeroTop()) {
        setHidden(true)
      }

      // Re-appear shortly after the visitor stops scrolling, so the button
      // is always reachable when they are looking for it.
      if (idleTimer) clearTimeout(idleTimer)
      idleTimer = setTimeout(settle, 1200)

      lastY = y
    }

    // Apply the correct initial state without waiting for a scroll event —
    // short pages must show the button immediately, not after first scroll.
    onScroll()

    window.addEventListener('scroll', onScroll, { passive: true })
    // A resize can turn a short page into a scrollable one (or the reverse).
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (idleTimer) clearTimeout(idleTimer)
    }
  }, [])

  return (
    <a
      href={getGeneralWhatsAppLink()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Chat with ${BRAND.name} on WhatsApp`}
      title={`Chat with ${BRAND.name} on WhatsApp`}
      className={[
        'fixed right-3 bottom-3 z-40 flex items-center justify-center rounded-full bg-emerald-700 text-white shadow-lg shadow-black/50 transition-all duration-300 hover:bg-emerald-800 sm:right-8 sm:bottom-8',
        // 48px on phones, 56px once there is room for it.
        'h-12 w-12 sm:h-14 sm:w-14',
        // One class pair only — two opposing opacity utilities would race in
        // the stylesheet instead of resolving in DOM order. `invisible` also
        // removes the link from the Tab order while hidden — `pointer-events-none`
        // alone would leave keyboard users focusing an invisible button.
        // `transition-all` covers visibility: it flips at the END of the fade
        // out (and at the START of the fade in), so hiding stays smooth.
        hidden
          ? 'pointer-events-none invisible translate-y-3 opacity-0'
          : 'translate-y-0 opacity-100',
      ].join(' ')}
    >
      <FaWhatsapp className="h-6 w-6 sm:h-7 sm:w-7" aria-hidden="true" />
    </a>
  )
}
