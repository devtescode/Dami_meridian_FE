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
 * Contains the brand, product name, chosen options, price and an image link
 * so the store can identify exactly what the customer is asking about.
 */
export function buildProductOrderText(
  product: OrderProduct,
  options?: ProductOrderOptions,
): string {
  let message = `Hello ${BRAND.name}, I want to order:\n\n`
  message += `Product: ${product.name}\n`

  const price = formatNaira(product.price)
  if (price) {
    message += `Price: ${price}`
  }

  if (options?.size) {
    message += `\nSize: ${options.size}`
  }

  if (options?.color) {
    message += `\nColour: ${options.color}`
  }

  if (
    options?.totalImages &&
    options.totalImages > 1 &&
    options.imageIndex !== undefined
  ) {
    message += `\nPhoto: ${options.imageIndex + 1} of ${options.totalImages}`
  }

  if (options?.reference) {
    message += `\nReference: ${options.reference}`
  }

  // Every order message carries a link back to the product's own page, so
  // the store can open the exact record behind the reference.
  const reference = options?.reference
  const productUrl =
    options?.productUrl ??
    (isObjectId(reference) ? getProductUrl(reference) : undefined)
  if (productUrl) {
    message += `\nProduct page: ${productUrl}`
  }

  const imageUrl = options?.imageUrl ?? getPrimaryImage(product.imageURLs)
  if (imageUrl) {
    message += `\n\nProduct image:\n${imageUrl}`
  }

  return message
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
