/**
 * Centralised API client.
 *
 * The base URL comes from `VITE_API_URL` (see `.env.example`). The live
 * Render deployment is used as the fallback so the app works out of the box;
 * set the environment variable to point at a local or staging backend.
 *
 * Every protected call automatically carries the stored admin JWT as a
 * Bearer token, matching the backend's `verifyToken` middleware which reads
 * `req.headers.authorization`.
 */

import { clearSession, getAuthHeaders } from '@/lib/session'
import type {
  AdminFormProduct,
  Availability,
  Product,
} from '@/types/product'
import { COLLECTION_IDS, type CollectionId } from '@/lib/collections'

/**
 * The base URL comes from `VITE_API_URL` (see `.env.example`). The live
 * Render deployment (`https://dami-meridian-be.onrender.com`) is the fallback
 * so the app works out of the box in production; set
 * `VITE_API_URL=http://localhost:4500` for a local backend (the backend's
 * `.env` uses PORT=4500), or point it at a staging deployment.
 */
const FALLBACK_API_URL = 'https://dami-meridian-be.onrender.com'

export const API_BASE = (
  import.meta.env.VITE_API_URL || FALLBACK_API_URL
).replace(/\/+$/, '')

/** Error carrying the HTTP status and the backend's own message. */
export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }

  /** True when the failure was an authentication/authorisation problem. */
  get isAuthError(): boolean {
    return this.status === 401 || this.status === 403
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: BodyInit | null
  /** Attach the admin Bearer token. Defaults to true. */
  auth?: boolean
  /** Send the body as multipart/form-data (do not set Content-Type). */
  multipart?: boolean
  /** Abort the request after this many milliseconds. */
  timeoutMs?: number
}

/**
 * Combines several abort signals into one.
 *
 * `AbortSignal.any` is the modern way to do this, but it is only Baseline
 * from 2024, so a manual fallback keeps older browsers working.
 *
 * The returned `dispose` removes the listeners the fallback registered — a
 * long-lived page would otherwise accumulate one listener per request.
 */
function combineSignals(signals: AbortSignal[]): {
  signal: AbortSignal
  dispose: () => void
} {
  if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.any === 'function') {
    return { signal: AbortSignal.any(signals), dispose: () => {} }
  }

  const controller = new AbortController()
  const teardown: Array<() => void> = []

  for (const source of signals) {
    if (source.aborted) {
      controller.abort(source.reason)
      break
    }
    const onAbort = () => controller.abort(source.reason)
    source.addEventListener('abort', onAbort, { once: true })
    teardown.push(() => source.removeEventListener('abort', onAbort))
  }

  return {
    signal: controller.signal,
    dispose: () => {
      for (const remove of teardown) remove()
    },
  }
}

/** Fired when the backend rejects the admin session. */
export const UNAUTHORIZED_EVENT = 'dm:unauthorized'

const DEFAULT_TIMEOUT_MS = 20_000

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const {
    auth = true,
    multipart = false,
    headers,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    signal: externalSignal,
    ...rest
  } = options

  const finalHeaders: Record<string, string> = {
    ...(auth ? getAuthHeaders() : {}),
    ...((headers as Record<string, string>) ?? {}),
  }

  if (!multipart && rest.body && !finalHeaders['Content-Type']) {
    finalHeaders['Content-Type'] = 'application/json'
  }

  // A connection that is accepted but never answered would otherwise leave
  // the UI spinning forever, because the loading flag only clears on
  // resolve or reject.
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  /**
   * The timeout and the caller's signal are COMBINED, not swapped: a
   * React Query `queryFn` hands us an `AbortSignal` and expects the request
   * to stop when the query is cancelled or its key changes. Overwriting it
   * with the timeout signal (as an earlier version of this file did) made
   * cancellation impossible while still type-checking.
   */
  const { signal, dispose } = externalSignal
    ? combineSignals([externalSignal, controller.signal])
    : { signal: controller.signal, dispose: () => {} }

  let response: Response
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...rest,
      headers: finalHeaders,
      signal,
    })
  } catch (error) {
    /**
     * The cause of the abort decides what the caller sees.
     *
     *  - The CALLER's signal fired (React Query cancelling the query): the
     *    raw abort reason is rethrown so React Query recognises it as a
     *    cancellation. Turning it into an ApiError would show the visitor a
     *    bogus "the server took too long" message and make React Query
     *    retry a request the visitor already moved on from.
     *  - The TIMEOUT fired: a genuine failure, reported as such.
     */
    if (externalSignal?.aborted) {
      throw error
    }
    if (controller.signal.aborted) {
      throw new ApiError('The server took too long to respond. Please try again.', 0)
    }
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError('The server took too long to respond. Please try again.', 0)
    }
    throw new ApiError(
      'Could not reach the server. Check your connection and try again.',
      0,
    )
  } finally {
    clearTimeout(timer)
    dispose()
  }

  const isJson = response.headers.get('content-type')?.includes('application/json')
  const payload = isJson ? await response.json().catch(() => null) : null

  if (!response.ok) {
    const message =
      (payload && typeof payload.message === 'string' && payload.message) ||
      `Request failed (${response.status})`

    // An expired or rejected session must not leave the admin staring at a
    // raw "Invalid or expired token" with no way back to the login screen.
    if ((response.status === 401 || response.status === 403) && auth) {
      clearSession()
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT))
      }
    }

    throw new ApiError(message, response.status)
  }

  return payload as T
}

/* -------------------------------------------------------------------------- */
/* Products                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Options every read accepts.
 *
 * `signal` lets the caller cancel the request — React Query hands one to
 * every `queryFn` and aborts it when the query is cancelled or its key
 * changes. Without it, an abandoned request still runs to completion.
 */
export interface RequestSignalOptions {
  signal?: AbortSignal
}

export function getProducts(
  options: RequestSignalOptions = {},
): Promise<Product[]> {
  // The catalogue is public, so the admin token must not be sent to it.
  return request<Product[]>('/jewelry/getallproducts', {
    method: 'GET',
    auth: false,
    signal: options.signal,
  })
}

/** Result ordering accepted by the paginated catalogue endpoint. */
export type ProductSort = 'newest' | 'price-asc' | 'price-desc' | 'name-asc'

/** Query parameters for the paginated catalogue endpoint. */
export interface ProductPageParams {
  /** 1-based page number. The server clamps out-of-range pages down to the last page. */
  page?: number
  /** Page size. The server caps it at 60 and defaults to 6. */
  limit?: number
  /** Free-text search term. Capped server-side at 80 characters. */
  q?: string
  /** Restrict the catalogue to a single collection. */
  collection?: CollectionId
  /** Result ordering. Defaults to `newest`. */
  sort?: ProductSort
}

/** One page of catalogue results, as returned by `getProductPage`. */
export interface ProductPage {
  products: Product[]
  total: number
  /** The effective page number after the server clamps the requested one. */
  page: number
  limit: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

const DEFAULT_PAGE = 1
const DEFAULT_LIMIT = 6

/**
 * Resolves a product's collection the way the backend does.
 *
 * Pre-rebrand documents were stored WITHOUT a `collection` field. The
 * backend treats those as "jewellery" (and the paginated query matches them
 * explicitly), so the client-side fallback has to agree — otherwise the
 * same product would appear under one collection on the server and another
 * in the fallback.
 */
function resolveCollectionId(product: Product): CollectionId {
  const raw = product.collection?.trim().toLowerCase()
  if (!raw) return 'jewellery'
  const match = COLLECTION_IDS.find((id) => id === raw)
  return match ?? 'jewellery'
}

/** Case-insensitive match against name and description — the server's rule. */
function matchesQuery(product: Product, term: string): boolean {
  if (!term) return true
  const haystack = `${String(product.name ?? '')} ${String(
    product.description ?? '',
  )}`.toLowerCase()
  return haystack.includes(term)
}

/** Reads a price as a number, or null when it cannot be read. */
function readPrice(product: Product): number | null {
  const raw =
    typeof product.price === 'number'
      ? String(product.price)
      : String(product.price ?? '').trim()
  if (!raw) return null
  const digits = raw.replace(/[^\d.]/g, '')
  if (!digits) return null
  const value = Number(digits)
  return Number.isFinite(value) ? value : null
}

/**
 * Client-side fallback for a backend that has NOT yet been updated with the
 * paginated contract.
 *
 * The dual-mode endpoint answers with a bare array whenever it does not
 * recognise the pagination parameters. During a rolling deployment the
 * frontend can easily be live before the backend is (or the other way
 * round), and an empty catalogue would be a much worse symptom than a
 * slightly slower request.
 *
 * So: if the response is an array, it is the FULL legacy catalogue. The
 * filters and the ordering are applied here exactly as the server would
 * apply them, the requested page is sliced out, and the same
 * `ProductPage` shape is returned. The result is identical to the
 * server-side path — only the work happens in the browser instead of the
 * database.
 */
function paginateLegacyArray(
  products: Product[],
  params: {
    page: number
    limit: number
    q: string
    collection?: CollectionId
    sort: ProductSort
  },
): ProductPage {
  const { page, limit, q, collection, sort } = params

  const filtered = products.filter((product) => {
    if (collection && resolveCollectionId(product) !== collection) {
      return false
    }
    return matchesQuery(product, q)
  })

  const sorted = [...filtered]
  switch (sort) {
    case 'price-asc':
      sorted.sort((a, b) => {
        const priceA = readPrice(a)
        const priceB = readPrice(b)
        if (priceA === null && priceB === null) return 0
        if (priceA === null) return 1
        if (priceB === null) return -1
        return priceA - priceB
      })
      break
    case 'price-desc':
      sorted.sort((a, b) => {
        const priceA = readPrice(a)
        const priceB = readPrice(b)
        if (priceA === null && priceB === null) return 0
        if (priceA === null) return 1
        if (priceB === null) return -1
        return priceB - priceA
      })
      break
    case 'name-asc':
      sorted.sort((a, b) =>
        String(a.name).localeCompare(String(b.name), 'en', {
          sensitivity: 'base',
        }),
      )
      break
    case 'newest':
    default:
      // Newest first. `createdAt` is the real upload timestamp; products
      // saved in the same millisecond fall back to their id, which is
      // monotonic — the same tiebreak the server uses.
      sorted.sort((a, b) => {
        const timeA = Date.parse(a.createdAt ?? '') || 0
        const timeB = Date.parse(b.createdAt ?? '') || 0
        if (timeA !== timeB) return timeB - timeA
        return String(b._id ?? '').localeCompare(String(a._id ?? ''))
      })
      break
  }

  const total = sorted.length
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const effectivePage = Math.min(Math.max(page, 1), totalPages)
  const start = (effectivePage - 1) * limit

  return {
    products: sorted.slice(start, start + limit),
    total,
    page: effectivePage,
    limit,
    totalPages,
    hasNextPage: effectivePage < totalPages,
    hasPrevPage: effectivePage > 1,
  }
}

/**
 * Fetch a page of the catalogue from `GET /jewelry/getallproducts`.
 *
 * This endpoint has a dual contract: without pagination params it answers
 * with a bare JSON array (the legacy shape `getProducts()` above still
 * relies on and which existing callers keep using unchanged), and with
 * pagination params it answers with a paginated object. `page` and `limit`
 * are therefore always sent — with their documented defaults — so the
 * response is guaranteed to match the `ProductPage` shape below. Optional
 * filters are only appended when they carry a value, so an empty `q` or
 * `collection` never narrows the query by accident.
 *
 * If the backend still answers with the legacy bare array (an older
 * deployment, or one mid-rollout), the response is paginated in the
 * browser instead, so the shop never renders an empty catalogue.
 *
 * Public endpoint: the admin token must not be sent with it.
 */
export async function getProductPage(
  params: ProductPageParams = {},
  options: RequestSignalOptions = {},
): Promise<ProductPage> {
  const query = new URLSearchParams()

  // Defensive normalisation: a zero/negative/fractional page or limit would
  // be rejected by the backend with a 400, so fall back to the defaults.
  const page = Math.trunc(params.page ?? DEFAULT_PAGE)
  const limit = Math.trunc(params.limit ?? DEFAULT_LIMIT)
  const effectivePage = page >= 1 ? page : DEFAULT_PAGE
  const effectiveLimit = limit >= 1 ? limit : DEFAULT_LIMIT
  query.set('page', String(effectivePage))
  query.set('limit', String(effectiveLimit))

  const q = params.q?.trim() ?? ''
  if (q) query.set('q', q)
  if (params.collection) query.set('collection', params.collection)
  const sort = params.sort ?? 'newest'
  if (sort) query.set('sort', sort)

  const payload = await request<ProductPage | Product[]>(
    `/jewelry/getallproducts?${query.toString()}`,
    {
      method: 'GET',
      auth: false,
      signal: options.signal,
    },
  )

  // A backend without the paginated contract answers with the full array.
  if (Array.isArray(payload)) {
    return paginateLegacyArray(payload, {
      page: effectivePage,
      limit: effectiveLimit,
      q,
      collection: params.collection,
      sort,
    })
  }

  return payload
}

/** MongoDB ObjectId format — used to pre-validate `/products/:id` lookups. */
const OBJECT_ID_PATTERN = /^[a-f0-9]{24}$/i

/**
 * Fetch a single product by its MongoDB `_id` (the product reference used in
 * WhatsApp order messages).
 *
 * Rejects immediately with a 400 `ApiError` when the id is not a valid
 * ObjectId, so a malformed URL never produces a pointless network request.
 * The backend returns 404 for products that no longer exist.
 */
export function getProduct(
  id: string,
  options: RequestSignalOptions = {},
): Promise<Product> {
  const trimmed = id?.trim() ?? ''
  if (!OBJECT_ID_PATTERN.test(trimmed)) {
    return Promise.reject(
      new ApiError('Invalid product reference.', 400),
    )
  }
  // Public endpoint — the admin token must not be sent with it.
  return request<Product>(`/jewelry/products/${trimmed}`, {
    method: 'GET',
    auth: false,
    signal: options.signal,
  })
}

function buildProductFormData(product: AdminFormProduct): FormData {
  const data = new FormData()
  data.append('name', product.name)
  data.append('price', product.price)
  data.append('description', product.description ?? '')
  data.append('category', product.availability)
  data.append('collection', product.collection ?? 'jewellery')

  if (product.sizes?.length) data.append('sizes', JSON.stringify(product.sizes))
  if (product.colors?.length)
    data.append('colors', JSON.stringify(product.colors))
  if (product.fragranceNotes)
    data.append('fragranceNotes', product.fragranceNotes)
  if (product.volume) data.append('volume', product.volume)

  product.images.forEach((image) => {
    if (typeof image === 'string') {
      data.append('existingImages', image)
    } else {
      data.append('images', image)
    }
  })

  return data
}

export function addProduct(product: AdminFormProduct): Promise<Product> {
  return request<Product>('/jewelry/addproducts', {
    method: 'POST',
    body: buildProductFormData(product),
    multipart: true,
  })
}

export function editProduct(
  id: string,
  product: AdminFormProduct,
): Promise<Product> {
  return request<Product>(`/jewelry/editproducts/${id}`, {
    method: 'PUT',
    body: buildProductFormData(product),
    multipart: true,
  })
}

export function deleteProduct(id: string): Promise<{ message: string }> {
  return request<{ message: string }>(`/jewelry/deleteproducts/${id}`, {
    method: 'DELETE',
  })
}

/* -------------------------------------------------------------------------- */
/* Admin                                                                       */
/* -------------------------------------------------------------------------- */

export function getAdminStatus(
  options: RequestSignalOptions = {},
): Promise<{ adminExists: boolean }> {
  return request<{ adminExists: boolean }>('/admin/status', {
    method: 'GET',
    auth: false,
    signal: options.signal,
  })
}

export function adminLogin(
  email: string,
  password: string,
): Promise<{ token: string }> {
  return request<{ token: string }>('/admin/login', {
    method: 'POST',
    auth: false,
    body: JSON.stringify({ email, password }),
  })
}

export function adminRegister(
  fullName: string,
  email: string,
  password: string,
): Promise<{ message: string }> {
  return request<{ message: string }>('/admin/register', {
    method: 'POST',
    auth: false,
    body: JSON.stringify({ fullName, email, password }),
  })
}

export function adminChangePassword(
  currentPassword: string,
  newPassword: string,
): Promise<{ message: string }> {
  return request<{ message: string }>('/admin/changepassword', {
    method: 'PUT',
    body: JSON.stringify({ currentPassword, newPassword }),
  })
}

export type { Availability, CollectionId }
