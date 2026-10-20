import { useEffect, useRef } from 'react'

/**
 * Sets `document.title` to "<title> — DAMI MERIDIAN" while mounted; restores
 * the previous title on unmount. Used by dedicated routes so browser history
 * and tab titles stay readable without duplicating the brand string.
 */
export function usePageTitle(title: string): void {
  /** The pre-mount title, captured once so unmount restores it exactly. */
  const previousTitle = useRef<string | null>(null)

  useEffect(() => {
    if (typeof document === 'undefined') return
    if (previousTitle.current === null) {
      previousTitle.current = document.title
    }
    document.title = `${title} — DAMI MERIDIAN`
    return () => {
      document.title = previousTitle.current ?? document.title
    }
  }, [title])
}
