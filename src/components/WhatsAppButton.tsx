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
 * Two things mitigate it: the button is smaller on small screens, and it
 * hides while the visitor scrolls down (reading) and returns as soon as they
 * scroll up or stop, so it never parks itself over a control they are about
 * to use.
 */
export default function WhatsAppButton() {
  const [visible, setVisible] = useState(false)
  const [pastHero, setPastHero] = useState(false)

  useEffect(() => {
    let lastY = window.scrollY
    let idleTimer: ReturnType<typeof setTimeout> | undefined

    const show = () => {
      setVisible(true)
      if (idleTimer) clearTimeout(idleTimer)
      // Re-appear shortly after the visitor stops scrolling, so the button
      // is always reachable when they are looking for it.
      idleTimer = setTimeout(() => setVisible(true), 1200)
    }

    const onScroll = () => {
      const y = window.scrollY
      setPastHero(y > 400)

      if (y > lastY + 4) {
        // Scrolling down: get out of the way.
        setVisible(false)
      } else if (y < lastY - 4) {
        show()
      }
      lastY = y
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
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
        'fixed right-3 bottom-3 z-40 flex items-center justify-center rounded-full bg-green-700 text-white shadow-lg shadow-black/50 transition-all duration-300 sm:right-8 sm:bottom-8',
        // 48px on phones, 56px once there is room for it.
        'h-12 w-12 sm:h-14 sm:w-14',
        pastHero ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0',
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0',
      ].join(' ')}
    >
      <FaWhatsapp className="h-6 w-6 sm:h-7 sm:w-7" aria-hidden="true" />
    </a>
  )
}
