import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { getProductPage, type ProductSort } from '@/lib/api'
import type { CollectionId } from '@/lib/collections'
import { productKeys } from '@/lib/queryKeys'

/** Default page size, mirroring the backend's own default. */
const DEFAULT_LIMIT = 6

export interface UseProductPageQueryParams {
  /** 1-based page number. */
  page: number
  /** Page size. Defaults to 6. */
  limit?: number
  /** The committed, trimmed search term ('' when there is none). */
  q?: string
  /** Collection filter; null/undefined means "all collections". */
  collection?: CollectionId | null
  /** Result ordering. Defaults to 'newest'. */
  sort?: ProductSort
}

export interface UseProductPageQueryResult {
  /** The products on the current page. */
  products: ReturnType<typeof getProductPage> extends Promise<infer T>
    ? T extends { products: infer P }
      ? P
      : never
    : never
  /** Total number of products matching the filters. */
  total: number
  /**
   * The page to DISPLAY.
   *
   * While the previous page is still on screen (React Query's
   * `keepPreviousData`), this is the page that data belongs to. Once the
   * response for the requested page lands, this is the server's
   * EFFECTIVE page — which is what the backend clamps a request for a page
   * past the end of the collection down to.
   */
  page: number
  /**
   * The server's clamped page, or null when there is nothing to adopt.
   *
   * Adopting this is safe: it is null while a placeholder is on screen, so
   * it can never undo a page change the visitor just made.
   */
  clampedPage: number | null
  /** Total number of pages for the current filters. */
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
  /** True while a request is in flight (including a background refetch). */
  isLoading: boolean
  /** True when there is no data at all yet. */
  isPending: boolean
  /** The failure message, or null. */
  error: string | null
  /** Re-issues the current request. */
  refetch: () => void
}

/**
 * Loads ONE page of the catalogue.
 *
 * The page, page size, search term, collection and ordering are all part
 * of the query key, so:
 *  - two components asking for the same page share one request and one
 *    cache entry;
 *  - changing a filter fetches a different entry rather than mutating the
 *    one on screen;
 *  - going back to a page already visited shows it instantly from the
 *    cache, with no request at all.
 *
 * Only the products of the requested page are ever transferred — the whole
 * catalogue is never downloaded just to page through it.
 */
export function useProductPageQuery(
  params: UseProductPageQueryParams,
): UseProductPageQueryResult {
  const {
    page,
    limit = DEFAULT_LIMIT,
    q = '',
    collection = null,
    sort = 'newest',
  } = params

  /**
   * `null` and `undefined` mean the same thing here ("no collection
   * filter"), so they are normalised to one value. Otherwise the same
   * request would be cached under two different keys.
   */
  const activeCollection = collection ?? undefined

  const query = useQuery({
    queryKey: productKeys.page({
      page,
      limit,
      q,
      collection: activeCollection,
      sort,
    }),
    queryFn: ({ signal }) =>
      getProductPage(
        { page, limit, q, collection: activeCollection, sort },
        { signal },
      ),
    /**
     * The previous page stays on screen while the next one loads, so the
     * grid never collapses into a skeleton between two pages.
     */
    placeholderData: keepPreviousData,
  })

  const data = query.data

  /**
   * The page the data ON SCREEN belongs to.
   *
   * While the next page loads, React Query keeps the previous page on
   * screen (`keepPreviousData`), and that placeholder is a full response
   * object carrying its own page number. Reading it keeps the grid, the
   * count line and the pagination controls in agreement — otherwise the
   * range would announce the incoming page while the outgoing products are
   * still on screen.
   */
  const displayPage = data?.page ?? page

  /**
   * The server's clamped page, or null when there is nothing to adopt.
   *
   * The backend clamps a request for a page past the end of the collection
   * down to the last page. Adopting that value keeps the grid following
   * the catalogue — e.g. after the last product is deleted.
   *
   * A placeholder is NOT adopted: it describes the page that is on screen,
   * not the page that was asked for, and adopting it would undo the very
   * navigation the visitor just performed.
   */
  const clampedPage = query.isPlaceholderData ? null : (data?.page ?? null)

  return {
    products: data?.products ?? [],
    total: data?.total ?? 0,
    page: displayPage,
    /** The clamped page to adopt, or null when there is nothing to adopt. */
    clampedPage,
    totalPages: data?.totalPages ?? 1,
    hasNextPage: data?.hasNextPage ?? false,
    hasPrevPage: data?.hasPrevPage ?? false,
    // `isFetching` matches the old hand-rolled hook, where `isLoading`
    // meant "a request is in flight" rather than "no data yet".
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

export default useProductPageQuery
