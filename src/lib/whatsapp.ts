import { getPrimaryImage } from '@/lib/productImages'
import { BRAND, WHATSAPP_NUMBER, formatNaira } from '@/lib/brand'
import type { Product } from '@/types/product'

export { WHATSAPP_NUMBER }

/** MongoDB ObjectId format — product references are Mongo `_id` values. */
const OBJECT_ID_PATTERN = /^[a-f0-9]{24}$/i

/** True when `value` is a MongoDB ObjectId (a real product reference). */
function isObjectId(value: string | undefined | null): value is string {
  return typeof value === 'string' && OBJECT_ID_PATTERN.test(value.trim())
}

/**
 * A value that is safe to print on its own line: non-blank once trimmed.
 * Keeps whitespace-only picks (" ") from emitting a label with no value —
 * e.g. a stray blank size on an apparel record must not print "Size:" alone.
 */
function toField(value: string | undefined | null): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

/**
 * The public URL of a product's detail page. Relative references (ids) are
 * resolved against the current origin so the link works from any route.
 */
export function getProductUrl(id: string): string {
  const origin =
    typeof window !== 'undefined' ? window.location.origin : ''
  return `${origin}/products/${id.trim()}`
}

export type OrderProduct = Pick<
  Product,
  'name' | 'price' | 'imageURLs'
> & {
  collection?: string
  sizes?: string[]
  colors?: string[]
}

export interface ProductOrderOptions {
  /** When set (e.g. modal carousel), only this image is referenced — not all product images */
  imageUrl?: string
  imageIndex?: number
  totalImages?: number
  /** Selected apparel size, when the product offers sizes. */
  size?: string
  /** Selected colour, when the product offers colours. */
  color?: string
  /** Extra reference (e.g. product id) appended to the message. */
  reference?: string
  /**
   * Absolute URL of the product's page (`/products/:id`). When omitted but a
   * `reference` that looks like a MongoDB ObjectId is supplied, the link is
   * derived automatically so every order message carries a product URL.
   */
  productUrl?: string
}

/**
 * Builds the prefilled WhatsApp order message.
 * One line per field: brand greeting, product name, price, apparel options,
 * reference, the product's page URL and an image link — everything the store
 * needs to identify exactly what the customer is asking about. Blank fields
 * are omitted rather than emitted as bare labels.
 */
export function buildProductOrderText(
  product: OrderProduct,
  options?: ProductOrderOptions,
): string {
  const lines: string[] = [`Product: ${product.name}`]

  const price = formatNaira(product.price)
  if (price) {
    lines.push(`Price: ${price}`)
  }

  // Blank selections are dropped entirely so a stray empty size can never
  // render a value-less "Size:" line.
  const size = toField(options?.size)
  if (size) {
    lines.push(`Size: ${size}`)
  }

  const color = toField(options?.color)
  if (color) {
    lines.push(`Colour: ${color}`)
  }

  if (
    options?.totalImages &&
    options.totalImages > 1 &&
    options.imageIndex !== undefined
  ) {
    lines.push(`Photo: ${options.imageIndex + 1} of ${options.totalImages}`)
  }

  const reference = toField(options?.reference)
  if (reference) {
    lines.push(`Reference: ${reference}`)
  }

  // Every order message carries a link back to the product's own page, so
  // the store can open the exact record behind the reference.
  const productUrl =
    options?.productUrl ??
    (isObjectId(reference) ? getProductUrl(reference) : undefined)
  if (productUrl) {
    lines.push(`Product page: ${productUrl}`)
  }

  const imageUrl = options?.imageUrl ?? getPrimaryImage(product.imageURLs)
  if (imageUrl) {
    lines.push(`Product image: ${imageUrl}`)
  }

  return `Hello ${BRAND.name}, I want to order:\n\n${lines.join('\n')}`
}

export function buildWhatsAppLink(text?: string): string {
  const base = `https://wa.me/${WHATSAPP_NUMBER}`
  if (!text?.trim()) return base
  return `${base}?text=${encodeURIComponent(text)}`
}

export function getProductWhatsAppLink(
  product: OrderProduct,
  options?: ProductOrderOptions,
): string {
  return buildWhatsAppLink(buildProductOrderText(product, options))
}

export const GENERAL_WHATSAPP_MESSAGE = `Hello ${BRAND.name}, I would like to know more about your collections.`

export function getGeneralWhatsAppLink(): string {
  return buildWhatsAppLink(GENERAL_WHATSAPP_MESSAGE)
}
