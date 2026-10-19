import type { CollectionId } from '@/lib/collections'

/** Availability values — mirrors the backend `category` enum exactly. */
export type Availability =
  | 'In Stock'
  | 'Out of Stock'
  | 'Made to Order'
  | 'Coming Soon'

export const AVAILABILITIES: Availability[] = [
  'In Stock',
  'Out of Stock',
  'Coming Soon',
  'Made to Order',
]

/**
 * A product as returned by `GET /jewelry/getallproducts`.
 *
 * `category` is the availability flag (pre-existing backend field, unchanged).
 * `collection` is the product group and is new — pre-rebrand records simply
 * omit it and are treated as jewellery.
 */
export interface Product {
  _id?: string
  /**
   * Legacy numeric id. Mongoose returns `_id` only — this is not sent by the
   * backend and is kept purely as a defensive fallback for older records.
   */
  id?: string
  name: string
  price: string | number
  imageURLs: string | string[]
  description?: string
  /** Availability, e.g. "In Stock". */
  category?: string
  /** Product group: men-tshirts | women-tshirts | joggers | perfumes | jewellery */
  collection?: CollectionId | string
  /** Optional apparel options — only rendered when present. */
  sizes?: string[]
  colors?: string[]
  /** Optional fragrance details — only rendered when present. */
  fragranceNotes?: string
  volume?: string
  createdAt?: string
  updatedAt?: string
}

/** Shape used by the admin add/edit form. */
export interface AdminFormProduct {
  name: string
  price: string
  images: (string | File)[]
  description: string
  availability: string
  collection?: CollectionId | string
  sizes?: string[]
  colors?: string[]
  fragranceNotes?: string
  volume?: string
  id?: string
}
