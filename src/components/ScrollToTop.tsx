import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Scrolls to the top of the document whenever the route path changes, so a
 * deep link never lands mid-page. Query-string-only changes (the shop's
 * filter chips) deliberately do not scroll — the user is already in place.
 *
 * Route changes (not the initial load) also move focus into the `#main`
 * landmark so screen readers announce the new page after SPA navigation.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation()

  /** Skips the focus move on the very first render — a deep link must not steal focus. */
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
    } else {
      document.getElementById('main')?.focus({ preventScroll: true })
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior })
  }, [pathname])

  return null
}
