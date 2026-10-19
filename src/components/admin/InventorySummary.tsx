import { useMemo } from 'react'
import {
  CheckCircle2,
  Clock,
  Package,
  XCircle,
  type LucideIcon,
} from 'lucide-react'

import { formatNaira } from '@/lib/brand'
import { cn } from '@/lib/utils'
import { AVAILABILITIES, type Product } from '@/types/product'

interface InventorySummaryProps {
  products: Product[]
}

/** The four availability buckets the dashboard reports on. */
type AvailabilityKey = 'inStock' | 'outOfStock' | 'madeToOrder' | 'comingSoon'

interface StatCard {
  key: string
  label: string
  value: number
  icon: LucideIcon
  /** Icon colour only — the circle behind it stays gold-tinted. */
  iconClass: string
}

/**
 * Parses a price that may arrive as a number, a numeric string or a string
 * with stray formatting. Non-numeric values are ignored rather than guessed.
 */
function parsePrice(value: string | number | undefined | null): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null
  }
  if (typeof value !== 'string') return null
  // Strip everything that is not a digit or a decimal point. A stray minus
  // sign must not survive: a negative price would otherwise make the
  // inventory total go negative while the storefront showed a positive one.
  const cleaned = value.replace(/[^\d.]/g, '')
  if (!cleaned) return null
  const parsed = Number(cleaned)
  return Number.isFinite(parsed) ? parsed : null
}

/**
 * Maps a raw `category` (the backend's availability field) onto one of the
 * known buckets, ignoring casing. Unknown or missing values return null.
 */
function matchAvailability(category?: string): string | null {
  if (!category) return null
  const needle = category.trim().toLowerCase()
  if (!needle) return null
  const hit = AVAILABILITIES.find((item) => item.toLowerCase() === needle)
  return hit ?? null
}

function deriveStats(products: Product[]) {
  let inStock = 0
  let outOfStock = 0
  let madeToOrder = 0
  let comingSoon = 0
  let inventoryValue = 0
  let minPrice = Number.POSITIVE_INFINITY
  let maxPrice = 0
  let pricedCount = 0

  for (const product of products) {
    const availability = matchAvailability(product.category)

    // A product with a missing or unknown category is still a product, so it
    // counts towards the total — but assigning it to a bucket would be a
    // guess, so it is deliberately left out of all four counts.
    if (availability === 'In Stock') inStock += 1
    else if (availability === 'Out of Stock') outOfStock += 1
    else if (availability === 'Made to Order') madeToOrder += 1
    else if (availability === 'Coming Soon') comingSoon += 1

    const price = parsePrice(product.price)
    if (price === null) continue
    pricedCount += 1
    inventoryValue += price
    if (price < minPrice) minPrice = price
    if (price > maxPrice) maxPrice = price
  }

  // Nothing priced yet means there is no meaningful range to show.
  if (pricedCount === 0) {
    minPrice = 0
    maxPrice = 0
  }

  return {
    total: products.length,
    inStock,
    outOfStock,
    madeToOrder,
    comingSoon,
    inventoryValue,
    minPrice,
    maxPrice,
    pricedCount,
  }
}

export default function InventorySummary({ products }: InventorySummaryProps) {
  const stats = useMemo(() => deriveStats(products), [products])

  const cards: StatCard[] = [
    {
      key: 'total',
      label: 'Total Products',
      value: stats.total,
      icon: Package,
      iconClass: 'text-primary',
    },
    {
      key: 'inStock',
      label: 'In Stock',
      value: stats.inStock,
      icon: CheckCircle2,
      iconClass: 'text-primary',
    },
    {
      key: 'outOfStock',
      label: 'Out of Stock',
      value: stats.outOfStock,
      icon: XCircle,
      iconClass: 'text-destructive',
    },
    {
      key: 'madeToOrder',
      label: 'Made to Order',
      value: stats.madeToOrder,
      icon: Clock,
      iconClass: 'text-gold-light',
    },
  ]

  const priceRange = `${formatNaira(stats.minPrice)} — ${formatNaira(stats.maxPrice)}`
  const isEmpty = stats.total === 0

  return (
    <section
      aria-labelledby="inventory-summary-heading"
      className="animate-fade-in-up"
    >
      <header className="flex flex-col gap-1">
        <p className="eyebrow">Catalogue</p>
        <h2
          id="inventory-summary-heading"
          className="font-display text-2xl text-foreground sm:text-3xl"
        >
          Inventory Overview
        </h2>
        <p className="text-sm text-muted-foreground">
          Every figure below is calculated live from your product catalogue.
        </p>
      </header>

      {/* 1 column on the smallest screens, 2 from `sm`, 4 from `xl`. */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <article
              key={card.key}
              className="card-luxury card-luxury-hover rounded-xl p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-display text-4xl leading-none text-foreground">
                    {card.value.toLocaleString('en-NG')}
                  </p>
                  <p className="mt-3 text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                    {card.label}
                  </p>
                </div>
                <span
                  className={cn(
                    'flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/30',
                    card.iconClass,
                  )}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
              </div>
            </article>
          )
        })}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 rounded-xl border border-border bg-surface-2/60 p-5 sm:grid-cols-2 lg:grid-cols-3">
        <div className="min-w-0">
          <p className="eyebrow">Inventory Value</p>
          <p className="mt-2 truncate font-display text-2xl text-foreground">
            {formatNaira(stats.inventoryValue)}
          </p>
          <p className="mt-1 text-xs text-subtle">
            Sum of {stats.pricedCount} priced product
            {stats.pricedCount === 1 ? '' : 's'}
          </p>
        </div>
        <div className="min-w-0 sm:border-l sm:border-border sm:pl-5">
          <p className="eyebrow">Price Range</p>
          <p className="mt-2 truncate font-display text-2xl text-foreground">
            {priceRange}
          </p>
          <p className="mt-1 text-xs text-subtle">
            Lowest to highest listed price
          </p>
        </div>
        <div className="min-w-0 lg:border-l lg:border-border lg:pl-5">
          <p className="eyebrow">Coming Soon</p>
          <p className="mt-2 truncate font-display text-2xl text-foreground">
            {stats.comingSoon.toLocaleString('en-NG')}
          </p>
          <p className="mt-1 text-xs text-subtle">Listed but not yet released</p>
        </div>
      </div>

      {isEmpty ? (
        <p className="mt-4 rounded-xl border border-dashed border-border bg-surface/60 px-5 py-4 text-sm text-muted-foreground">
          No products yet. Add your first product to see your inventory
          breakdown.
        </p>
      ) : null}
    </section>
  )
}
