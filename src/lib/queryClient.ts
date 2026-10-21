/**
 * The shared React Query client.
 *
 * A SINGLE instance lives at module scope on purpose: a client created
 * during render would throw away the cache on every re-render, and two
 * clients would mean two caches — the exact redundancy this integration
 * exists to remove.
 *
 * Defaults:
 *  - `staleTime` 60s: a catalogue page stays fresh for a minute, so
 *    walking between the shop, a product and back does not re-request it.
 *  - `gcTime` 5min: an unused query is dropped from the cache after five
 *    minutes, so the memory does not grow without bound.
 *  - `refetchOnWindowFocus: false`: returning to the tab is not a reason
 *    to re-download the catalogue.
 *  - `retry: 1`: one retry covers a transient network blip.
 *
 * The retry predicate additionally refuses to retry a 4xx. An expired
 * session answers 401, and retrying it would re-fire the unauthorised
 * event (which clears the session) once per attempt.
 */

import { QueryClient } from '@tanstack/react-query'

import { ApiError } from '@/lib/api'

/** How long a catalogue page stays fresh before it is considered stale. */
export const PRODUCT_STALE_TIME = 60_000

/** Admin screens need fresher data than the storefront. */
export const ADMIN_STALE_TIME = 30_000

/** The admin's existence changes at most once, ever. */
export const ADMIN_STATUS_STALE_TIME = 5 * 60_000

/**
 * One retry for transient failures, never for a client error.
 *
 * A 4xx means the request itself was wrong — retrying it sends the same
 * wrong request again. A 5xx or a transport failure is worth one more go.
 */
function shouldRetry(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
    return false
  }
  return failureCount < 1
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: PRODUCT_STALE_TIME,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: shouldRetry,
      retryDelay: (attemptIndex) => Math.min(1_000 * 2 ** attemptIndex, 30_000),
    },
    mutations: {
      // A failed write is not a flaky network — the admin can press the
      // button again, so it is never retried behind their back.
      retry: 0,
    },
  },
})

export default queryClient
