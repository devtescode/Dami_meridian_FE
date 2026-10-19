/**
 * Availability is a single concept that appears on the product card, in the
 * product modal, in the admin table and in the inventory counters. It used to
 * be styled by three separate maps that had already drifted apart — the same
 * product showed an emerald pill on the storefront and a grey one in the
 * admin table for the same value, and `"in stock"` matched in one place but
 * not another. This module is the single source of truth.
 *
 * The class strings are written out in full (no interpolated class names) so
 * Tailwind's scanner can see every colour it needs to generate.
 */

export const AVAILABILITY_LABELS = {
  inStock: 'In Stock',
  outOfStock: 'Out of Stock',
  madeToOrder: 'Made to Order',
  comingSoon: 'Coming Soon',
} as const

export type AvailabilityKey = keyof typeof AVAILABILITY_LABELS

const PILL_CLASSES: Record<AvailabilityKey, string> = {
  inStock: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
  outOfStock: 'border-red-500/40 bg-red-500/10 text-red-300',
  madeToOrder: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
  comingSoon: 'border-border bg-surface-2 text-muted-foreground',
}

/** Shown when a product has no availability recorded, or an unknown one. */
export const NEUTRAL_PILL_CLASS = PILL_CLASSES.comingSoon

/**
 * Normalises the raw `category` value into an availability key.
 * Matching is case-insensitive and ignores surrounding whitespace, because
 * the value is free text on the way in and has been written by hand.
 */
export function resolveAvailabilityKey(
  category?: string | null,
): AvailabilityKey | null {
  const needle = (category ?? '').trim().toLowerCase()
  if (!needle) return null

  switch (needle) {
    case 'in stock':
      return 'inStock'
    case 'out of stock':
      return 'outOfStock'
    case 'made to order':
      return 'madeToOrder'
    case 'coming soon':
      return 'comingSoon'
    default:
      return null
  }
}

/** The label to render, falling back to the raw value for unknown ones. */
export function availabilityLabel(category?: string | null): string {
  const key = resolveAvailabilityKey(category)
  if (key) return AVAILABILITY_LABELS[key]
  const raw = (category ?? '').trim()
  return raw || 'Unspecified'
}

/** The pill classes for a raw availability value. */
export function availabilityPillClass(category?: string | null): string {
  const key = resolveAvailabilityKey(category)
  return key ? PILL_CLASSES[key] : NEUTRAL_PILL_CLASS
}
