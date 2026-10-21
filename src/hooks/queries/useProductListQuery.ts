import { useQuery } from '@tanstack/react-query'

import { getProducts } from '@/lib/api'
import { productKeys } from '@/lib/queryKeys'
import { ADMIN_STALE_TIME } from '@/lib/queryClient'
import type { Product } from '@/types/product'

export interface UseProductListQueryResult {
  /** The whole catalogue. */
  products: Product[]
  /** True while a request is in flight (including a background refetch). */
  isLoading: boolean
  /** True when there is no data at all yet. */
  isPending: boolean
  /** The failure message, or null. */
  error: string | null
  /** Re-issues the current request. */
  refetch: () => void
}

export interface UseProductListQueryOptions {
  /** Set to false to keep the query dormant (e.g. no session). */
  enabled?: boolean
}

/**
 * Loads the FULL catalogue.
 *
 * Used where the whole list is genuinely needed: the admin dashboard's
 * statistics, the admin products table, and the "you may also like"
 * strip on a product page. The storefront shop does NOT use this — it
 * pages through the catalogue server-side instead.
 *
 * The result is cached, so the admin dashboard and the admin products
 * table share a single request instead of each pulling the catalogue down.
 */
export function useProductListQuery(
  options: UseProductListQueryOptions = {},
): UseProductListQueryResult {
  const query = useQuery({
    queryKey: productKeys.list(),
    queryFn: ({ signal }) => getProducts({ signal }),
    enabled: options.enabled ?? true,
    // The admin screens work on live numbers, so they settle faster than
    // the storefront.
    staleTime: ADMIN_STALE_TIME,
  })

  return {
    products: query.data ?? [],
    isLoading: query.isFetching,
    isPending: query.isPending,
    error:
      query.error instanceof Error
        ? query.error.message
        : query.error
          ? 'Something went wrong loading the collection.'
          : null,
    refetch: () => {
      void query.refetch()
    },
  }
}

export default useProductListQuery
