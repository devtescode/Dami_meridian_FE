/**
 * The query-key factory.
 *
 * Every server-state key in the app is built here, so the hierarchy is
 * visible in one place and invalidation can be targeted precisely.
 *
 * The shape is:
 *
 *   ['products']                         ← the whole product family
 *   ['products', 'list']                 ← the full catalogue
 *   ['products', 'page', { …filters }]   ← one page of the catalogue
 *   ['products', 'detail', '<id>']       ← one product
 *
 * Because the page key carries the filters, two components asking for the
 * same page share ONE cache entry and ONE request. Invalidating
 * `productKeys.all` refreshes every product view (the shop, the admin
 * table, the dashboard and the product page) without touching anything
 * else in the cache.
 *
 * No token, password or other secret ever appears in a key: keys are
 * logged and serialised, and the session lives in `sessionStorage` and is
 * attached per request by the API client.
 */

import type { CollectionId } from '@/lib/collections'
import type { ProductSort } from '@/lib/api'

/** The filters that determine which page of the catalogue is on screen. */
export interface ProductPageKey {
  page: number
  limit: number
  q: string
  collection?: CollectionId
  sort: ProductSort
}

export const productKeys = {
  /** Root of the product family — invalidating this refreshes every product view. */
  all: ['products'] as const,

  /** The full catalogue (admin dashboard, admin products table). */
  lists: () => [...productKeys.all, 'list'] as const,
  list: () => [...productKeys.lists(), 'all'] as const,

  /** One page of the catalogue. The filters are part of the key. */
  pages: () => [...productKeys.all, 'page'] as const,
  page: (params: ProductPageKey) => [...productKeys.pages(), params] as const,

  /** A single product by its reference. */
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (id: string) => [...productKeys.details(), id] as const,
}

export const adminKeys = {
  all: ['admin'] as const,
  /** Whether an admin account exists — used by the login/register screens. */
  status: () => [...adminKeys.all, 'status'] as const,
}
