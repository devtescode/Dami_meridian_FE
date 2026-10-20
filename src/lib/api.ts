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
import type { CollectionId } from '@/lib/collections'

/**
 * The base URL comes from `VITE_API_URL` (see `.env.example`). The live
 * Render deployment is the fallback so the app works out of the box; set the
 * environment variable to point at a local backend (`http://localhost:4000`)
 * or a staging deployment.
 */
const FALLBACK_API_URL = 'http://localhost:4500'


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

/** Fired when the backend rejects the admin session. */
export const UNAUTHORIZED_EVENT = 'dm:unauthorized'

const DEFAULT_TIMEOUT_MS = 20_000

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const {
    auth = true,
    multipart = false,
    headers,
    timeoutMs = DEFAULT_TIMEOUT_MS,
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

  let response: Response
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...rest,
      headers: finalHeaders,
      signal: controller.signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError('The server took too long to respond. Please try again.', 0)
    }
    throw new ApiError(
      'Could not reach the server. Check your connection and try again.',
      0,
    )
  } finally {
    clearTimeout(timer)
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

export function getProducts(): Promise<Product[]> {
  // The catalogue is public, so the admin token must not be sent to it.
  return request<Product[]>('/jewelry/getallproducts', {
    method: 'GET',
    auth: false,
  })
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
export function getProduct(id: string): Promise<Product> {
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

export function getAdminStatus(): Promise<{ adminExists: boolean }> {
  return request<{ adminExists: boolean }>('/admin/status', {
    method: 'GET',
    auth: false,
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
