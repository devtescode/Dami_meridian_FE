import { useQuery } from '@tanstack/react-query'

import { getProduct } from '@/lib/api'
import { productKeys } from '@/lib/queryKeys'
import type { Product } from '@/types/product'

export interface UseProductQueryResult {
  /** The product, or null while it is still loading. */
  product: Product | null
  /** True while a request is in flight (including a background refetch). */
  isLoading: boolean
  /** True when there is no data at all yet. */
  isPending: boolean
  /** True when the request failed. */
  isError: boolean
  /** The HTTP status of the failure, or 0 for a transport failure. */
  status: number
  /** The failure message, or null. */
  error: string | null
  /** Re-issues the current request. */
  refetch: () => void
}

/**
 * Loads ONE product by its reference.
 *
 * The query is dormant until an id is supplied (`enabled`), so a screen
 * that has not been given a reference yet never fires a request — and a
 * request for a malformed reference never leaves the browser at all (the
 * API client rejects it before the network).
 *
 * The result is cached per id, so returning to a product page already
 * visited shows it instantly, with no request.
 */
export function useProductQuery(
  id: string | null | undefined,
): UseProductQueryResult {
  const trimmed = id?.trim() ?? ''

  const query = useQuery({
    queryKey: productKeys.detail(trimmed),
    queryFn: ({ signal }) => getProduct(trimmed, { signal }),
    // No reference yet — stay dormant instead of asking for `/products/`.
    enabled: trimmed.length > 0,
  })

  const status =
    query.error && typeof query.error === 'object' && 'status' in query.error
      ? Number((query.error as { status: unknown }).status) || 0
      : 0

  return {
    product: query.data ?? null,
    isLoading: query.isFetching,
    isPending: query.isPending,
    isError: query.isError,
    status,
    error:
      query.error instanceof Error
        ? query.error.message
        : query.error
          ? 'Could not load this product. Please try again.'
          : null,
    refetch: () => {
      void query.refetch()
    },
  }
}

export default useProductQuery
