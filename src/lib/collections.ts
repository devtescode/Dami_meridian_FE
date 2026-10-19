/**
 * The five DAMI MERIDIAN product collections.
 *
 * `id` values are the exact strings persisted on the backend `collection`
 * field, so filters and API payloads stay in sync. The backend defaults
 * existing records to "jewellery", which keeps pre-rebrand products valid.
 */

export type CollectionId =
  | 'men-tshirts'
  | 'women-tshirts'
  | 'joggers'
  | 'perfumes'
  | 'jewellery'

export interface Collection {
  id: CollectionId
  name: string
  short: string
  description: string
  image: string
  /** Product-type hints used to pick the right imagery on cards. */
  kind: 'apparel' | 'fragrance' | 'jewellery'
}

export const COLLECTIONS: Collection[] = [
  {
    id: 'men-tshirts',
    name: "Men's T-Shirts",
    short: "Men's Tees",
    description:
      'Quality round-neck t-shirts cut for a clean, confident everyday fit.',
    image: '/images/cat-men-tshirts.jpg',
    kind: 'apparel',
  },
  {
    id: 'women-tshirts',
    name: "Women's T-Shirts",
    short: "Women's Tees",
    description:
      'Round-neck t-shirts in premium fabric, styled to sit beautifully on every body.',
    image: '/images/cat-women-tshirts.jpg',
    kind: 'apparel',
  },
  {
    id: 'joggers',
    name: 'Unisex Joggers',
    short: 'Joggers',
    description:
      'Relaxed, heavyweight joggers made to be worn your way — whoever you are.',
    image: '/images/cat-joggers.jpg',
    kind: 'apparel',
  },
  {
    id: 'perfumes',
    name: 'Perfumes',
    short: 'Perfumes',
    description:
      'Captivating fragrances that stay with you long after you leave the room.',
    image: '/images/cat-perfumes.jpg',
    kind: 'fragrance',
  },
  {
    id: 'jewellery',
    name: 'Jewellery',
    short: 'Jewellery',
    description:
      'Carefully selected pieces that finish the look and hold their own.',
    image: '/images/cat-jewellery.jpg',
    kind: 'jewellery',
  },
]

export const COLLECTION_IDS: CollectionId[] = COLLECTIONS.map((c) => c.id)

const COLLECTION_LOOKUP = new Map<string, Collection>(
  COLLECTIONS.map((c) => [c.id, c]),
)

export function getCollection(id?: string | null): Collection | undefined {
  if (!id) return undefined
  return COLLECTION_LOOKUP.get(id)
}

export function getCollectionName(id?: string | null): string {
  return getCollection(id)?.name ?? 'Jewellery'
}

/**
 * Resolves a product's `collection` to one of the five known ids.
 *
 * A product with no `collection` — a pre-rebrand record — is jewellery. So is
 * one whose value was written straight to the database and is not in the
 * enum. Both the storefront grid and the admin table use this so they can
 * never disagree about which collection a product belongs to.
 */
export function resolveCollectionId(product: {
  collection?: string | null
}): CollectionId {
  const value = product.collection?.trim().toLowerCase()
  if (!value) return 'jewellery'
  return (COLLECTION_IDS as string[]).includes(value)
    ? (value as CollectionId)
    : 'jewellery'
}
