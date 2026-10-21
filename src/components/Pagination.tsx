import type { JSX } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { cn } from '@/lib/utils'

export interface PaginationProps {
  /** 1-based current page (server-clamped). */
  page: number
  /** Total number of pages (≥ 1). */
  totalPages: number
  /** Total number of matching products. */
  total: number
  /** Products per page (e.g. 6). */
  pageSize: number
  /** Called with the 1-based target page when a control is activated. */
  onPageChange: (page: number) => void
  /** Optional: dim/disable controls while a fetch is in flight. */
  isBusy?: boolean
}

/**
 * One slot of the controls row: either a tappable page number, or a purely
 * decorative gap marker standing in for a collapsed run of pages.
 */
type PageToken =
  | { type: 'page'; page: number }
  | { type: 'ellipsis'; side: 'head' | 'tail' }

/** At or below this many pages every number is shown, so no `…` is needed. */
const MAX_INLINE_PAGES = 7

/* ---- Page number buttons ---- */
const PAGE_BUTTON_BASE =
  'inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border px-2 text-sm transition-colors duration-300'
/** Idle number: muted chip that lights up gold on hover/focus. */
const PAGE_BUTTON_IDLE =
  'border-border bg-surface text-muted-foreground hover:border-primary/50 hover:text-gold-light'
/** Fetch in flight: same footprint, but visibly off and not-allowed. */
const PAGE_BUTTON_BUSY =
  'cursor-not-allowed border-border/50 bg-surface/60 text-subtle opacity-60'
/** Current page — the gold chip treatment the Shop filter chips use. */
const PAGE_BUTTON_CURRENT =
  'cursor-default border-primary bg-primary/15 text-gold-light font-medium'

/* ---- Previous / Next buttons ---- */
const STEP_BUTTON_BASE =
  'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border px-3 text-xs uppercase tracking-[0.14em] transition-colors duration-300'
const STEP_BUTTON_ENABLED =
  'border-border bg-surface text-muted-foreground hover:border-primary/50 hover:text-gold-light'
/**
 * Disabled styling is colour + opacity + `cursor` only — never
 * `pointer-events-none` — so the native `disabled` attribute and the
 * `aria-disabled` state stay the single source of truth for availability
 * while the control still reads as switched-off on screen.
 */
const STEP_BUTTON_DISABLED =
  'cursor-not-allowed border-border/50 bg-surface/60 text-subtle opacity-60'

/** Decorative gap: hidden from assistive tech, but still 44px tall so it
 *  never makes the row jump between pages. */
const ELLIPSIS_CLASS =
  'inline-flex min-h-[44px] select-none items-center justify-center px-0.5 text-sm text-subtle'

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/** Stable React key — at most one head and one tail gap can ever exist. */
function tokenKey(token: PageToken): string {
  return token.type === 'page' ? `page-${token.page}` : `ellipsis-${token.side}`
}

/**
 * Windowing algorithm — decides which page numbers (and where each `…` goes)
 * for a given `page` / `totalPages` pair.
 *
 *  1. `totalPages <= 7`: everything fits on one row, so emit `1..totalPages`
 *     with no ellipsis at all.
 *  2. Otherwise page 1 and page `totalPages` are always kept, plus the
 *     three-number window `page-1, page, page+1` clamped into the interior
 *     `[2, totalPages - 1]` — the two ends are already guaranteed by (2).
 *  3. The window is pinned to whichever end the current page is touching, so
 *     page 1 reads `1 2 3 … n` and page n reads `1 … n-2 n-1 n` instead of
 *     stranding a single lonely neighbour next to the first/last number.
 *  4. A gap token fills every hole: a `head` gap when the window does not
 *     start at 2, a `tail` gap when it does not end at `totalPages - 1`.
 *     Consecutive numbers are therefore never separated by an ellipsis.
 *
 * Worst case is 7 tokens (1 + gap + 3 + gap + 1), which — combined with
 * Previous/Next — keeps the row at ≤ 9 items so `flex-wrap` can fold it
 * cleanly instead of overflowing at 360px.
 */
function buildPageTokens(page: number, totalPages: number): PageToken[] {
  if (totalPages <= MAX_INLINE_PAGES) {
    const tokens: PageToken[] = []
    for (let n = 1; n <= totalPages; n += 1) {
      tokens.push({ type: 'page', page: n })
    }
    return tokens
  }

  let start = page - 1
  let end = page + 1

  // Edge anchors (step 3 above).
  if (page <= 2) {
    start = 2
    end = 3
  } else if (page >= totalPages - 1) {
    start = totalPages - 2
    end = totalPages - 1
  }

  start = clamp(start, 2, totalPages - 1)
  end = clamp(end, start, totalPages - 1)

  const tokens: PageToken[] = [{ type: 'page', page: 1 }]
  if (start > 2) tokens.push({ type: 'ellipsis', side: 'head' })
  for (let n = start; n <= end; n += 1) {
    tokens.push({ type: 'page', page: n })
  }
  if (end < totalPages - 1) tokens.push({ type: 'ellipsis', side: 'tail' })
  tokens.push({ type: 'page', page: totalPages })
  return tokens
}

/**
 * Presentational catalogue pagination: a status line plus a windowed row of
 * Previous / page numbers / Next. Purely controlled — the parent owns paging,
 * loading state and layout (this adds no Container and no horizontal padding
 * of its own, so it slots into whatever padding the host already provides).
 */
export default function Pagination(props: PaginationProps): JSX.Element {
  const { page, totalPages, total, pageSize, onPageChange, isBusy = false } =
    props

  /**
   * Defensive normalisation. The parent is expected to clamp already, but an
   * out-of-range value must never leak an inverted range into the status line
   * or an out-of-range target into `onPageChange`.
   */
  const safeTotal = Math.max(0, Math.floor(total))
  const safePageSize = Math.max(1, Math.floor(pageSize))
  const safeTotalPages = Math.max(1, Math.floor(totalPages))
  const safePage = clamp(Math.floor(page), 1, safeTotalPages)
  const busy = isBusy === true

  // Nothing to describe — the parent renders its own empty state.
  if (safeTotal === 0) {
    return <></>
  }

  const start = Math.min((safePage - 1) * safePageSize + 1, safeTotal)
  const end = Math.min(safePage * safePageSize, safeTotal)

  const tokens =
    safeTotalPages > 1 ? buildPageTokens(safePage, safeTotalPages) : []
  const canGoPrevious = !busy && safePage > 1
  const canGoNext = !busy && safePage < safeTotalPages

  /**
   * Single funnel for every control: a target outside `1..totalPages` and the
   * page already on screen are both no-ops, so `onPageChange` only ever fires
   * with a real, different destination (the `busy` early-return is belt and
   * braces — the buttons are already `disabled` while a fetch is running).
   */
  const goTo = (target: number): void => {
    if (busy || !Number.isFinite(target)) return
    const next = Math.trunc(target)
    if (next < 1 || next > safeTotalPages) return
    if (next === safePage) return
    onPageChange(next)
  }

  return (
    <div className="flex w-full flex-col items-center gap-4">
      {/* Status line — one element, omitted entirely when there are no hits. */}
      <p
        role="status"
        aria-live="polite"
        className="text-center text-sm tabular-nums text-muted-foreground"
      >
        {`Showing ${start}–${end} of ${safeTotal} products`}
      </p>

      {/* A single page needs no pagination chrome. */}
      {safeTotalPages > 1 && (
        <nav
          aria-label="Catalogue pagination"
          className="flex w-full flex-wrap items-center justify-center gap-1.5 sm:gap-2"
        >
          <button
            type="button"
            onClick={() => goTo(safePage - 1)}
            disabled={!canGoPrevious}
            aria-disabled={!canGoPrevious}
            className={cn(
              STEP_BUTTON_BASE,
              canGoPrevious ? STEP_BUTTON_ENABLED : STEP_BUTTON_DISABLED,
            )}
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            <span>Previous</span>
          </button>

          {tokens.map((token) => {
            // The `…` is a pure visual gap: it is not a control, so it is
            // removed from the accessibility tree entirely (`aria-hidden`)
            // rather than exposed as a focusable/disabled button.
            if (token.type === 'ellipsis') {
              return (
                <span
                  key={tokenKey(token)}
                  aria-hidden="true"
                  className={ELLIPSIS_CLASS}
                >
                  …
                </span>
              )
            }

            const isCurrent = token.page === safePage
            // The current number is deliberately `disabled` (re-selecting it
            // would be a no-op) but keeps `aria-current="page"` so screen
            // readers still announce position rather than just "dimmed".
            const isDisabled = isCurrent || busy

            return (
              <button
                key={tokenKey(token)}
                type="button"
                onClick={() => goTo(token.page)}
                disabled={isDisabled}
                aria-current={isCurrent ? 'page' : undefined}
                aria-label={
                  isCurrent
                    ? `Page ${token.page}, current page`
                    : `Page ${token.page}`
                }
                className={cn(
                  PAGE_BUTTON_BASE,
                  isCurrent
                    ? cn(PAGE_BUTTON_CURRENT, busy && 'opacity-60')
                    : busy
                      ? PAGE_BUTTON_BUSY
                      : PAGE_BUTTON_IDLE,
                )}
              >
                {token.page}
              </button>
            )
          })}

          <button
            type="button"
            onClick={() => goTo(safePage + 1)}
            disabled={!canGoNext}
            aria-disabled={!canGoNext}
            className={cn(
              STEP_BUTTON_BASE,
              canGoNext ? STEP_BUTTON_ENABLED : STEP_BUTTON_DISABLED,
            )}
          >
            <span>Next</span>
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </nav>
      )}
    </div>
  )
}
