/**
 * DAMI MERIDIAN — single source of truth for brand identity.
 * Every public-facing string, contact detail and link lives here so the
 * storefront, footer and admin dashboard can never drift apart.
 */

export const BRAND = {
  name: 'DAMI MERIDIAN',
  slogan: 'STYLE. SCENT. IDENTITY.',
  sloganWords: ['STYLE.', 'SCENT.', 'IDENTITY.'],
  tagline: 'Fashion, fragrance and jewellery for those who refuse to blend in.',
  description:
    'DAMI MERIDIAN is a fashion, fragrance and lifestyle brand offering quality men’s and women’s round-neck t-shirts, unisex joggers, perfumes and jewellery.',
  location: 'Elizade University, Ilara Mokin, Ondo State, Nigeria',
  shortLocation: 'Ilara Mokin, Ondo State',
  founded: 'Ondo State, Nigeria',
} as const

/** WhatsApp number in international format, digits only (no + or spaces). */
export const WHATSAPP_NUMBER = '2348155589764'

/** Human-readable local number, used in visible copy. */
export const WHATSAPP_DISPLAY = '0815 558 9764'

/** Calling number in international format, digits only. */
export const PHONE_NUMBER = '2349029794742'

/** Human-readable local number, used in visible copy. */
export const PHONE_DISPLAY = '0902 979 4742'

export const CONTACT = {
  whatsapp: WHATSAPP_DISPLAY,
  phone: PHONE_DISPLAY,
  email: null as string | null,
  location: BRAND.location,
  hours: null as string | null,
} as const

/**
 * Social handles exactly as supplied by the brand.
 * No profile URLs are hard-coded because none have been verified —
 * `SOCIALS` renders the handle as text until a real URL is supplied.
 */
export const SOCIALS = [
  { id: 'tiktok', label: 'TikTok', handle: 'DAMI MERIDIAN', url: "http://www.tiktok.com/@damimeridian" as string | null },
  { id: 'instagram', label: 'Instagram', handle: 'DAMI MERIDIAN', url: null as string | null },
] as const

/** Canonical links. */
export const LINKS = {
  whatsapp: `https://wa.me/${WHATSAPP_NUMBER}`,
  tel: `tel:+${PHONE_NUMBER}`,
} as const

/**
 * Formats a naira amount for display and for WhatsApp order messages.
 * Returns an empty string for a missing or unreadable price so callers can
 * show "Price on request" rather than a false "₦0".
 */
export function formatNaira(price: string | number | undefined | null): string {
  if (price === undefined || price === null || price === '') return ''

  if (typeof price === 'number') {
    if (!Number.isFinite(price)) return ''
    return `₦${price.toLocaleString('en-NG')}`
  }

  const digits = String(price).replace(/[^\d.]/g, '')
  if (!digits) return ''

  const numeric = Number(digits)
  if (!Number.isFinite(numeric)) return ''

  return `₦${numeric.toLocaleString('en-NG')}`
}
