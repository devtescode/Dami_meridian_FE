import { Link } from 'react-router-dom'
import { AlertCircle, ArrowRight, ImageOff, Plus, Search } from 'lucide-react'

import InventorySummary from '@/components/admin/InventorySummary'

import { useProductListQuery } from '@/hooks/queries/useProductListQuery'
import { availabilityLabel, availabilityPillClass } from '@/lib/availability'
import { formatNaira } from '@/lib/brand'
import { getCollectionName } from '@/lib/collections'
import { toImageArray } from '@/lib/productImages'
import { cn } from '@/lib/utils'
import type { Product } from '@/types/product'

/** A shimmering placeholder block used while the catalogue loads. */
function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn('animate-pulse rounded-lg bg-surface-2', className)}
    />
  )
}

/**
 * Mirrors the shape of the real dashboard (stats grid + recent cards) so the
 * layout does not jump when the data lands. Purely decorative.
 */
function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="card-luxury rounded-xl p-5">
            <SkeletonBlock className="h-9 w-16" />
            <SkeletonBlock className="mt-3 h-3 w-24" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((item) => (
          <div
            key={item}
            className="card-luxury flex h-full min-w-0 items-start gap-3 rounded-xl p-4"
          >
            <SkeletonBlock className="h-16 w-16 shrink-0" />
            <div className="min-w-0 flex-1 space-y-2">
              <SkeletonBlock className="h-4 w-2/3" />
              <SkeletonBlock className="h-3 w-1/3" />
              <SkeletonBlock className="h-5 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * One entry of the "Recently added" grid. Every card links to the edit route
 * so a product can be reached in a single tap; records without a usable id
 * (they should not exist) degrade to a non-interactive card.
 */
function RecentCard({ product }: { product: Product }) {
  const id = product._id ?? product.id
  const primaryImage = toImageArray(product.imageURLs)[0]

  const body = (
    <>
      <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-surface-2">
        {primaryImage ? (
          <img
            src={primaryImage}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <ImageOff className="h-5 w-5 text-subtle" aria-hidden="true" />
        )}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-foreground">
          {product.name}
        </span>
        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
          {getCollectionName(product.collection)}
        </span>
        <span className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <span className="font-display text-lg leading-none text-primary">
            {formatNaira(product.price) || 'Price on request'}
          </span>
          <span
            className={cn(
              'inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em]',
              availabilityPillClass(product.category),
            )}
          >
            {availabilityLabel(product.category)}
          </span>
        </span>
      </span>
    </>
  )

  const cardClass =
    'card-luxury card-luxury-hover flex h-full min-w-0 items-start gap-3 rounded-xl p-4'

  if (!id) {
    return <div className={cardClass}>{body}</div>
  }

  return (
    <Link
      to={`/admin/products/${id}/edit`}
      aria-label={`Edit ${product.name}`}
      className={cardClass}
    >
      {body}
    </Link>
  )
}

export default function AdminDashboardPage() {
  const { products, isLoading, error, refetch } = useProductListQuery()

  const showSkeletons = isLoading && products.length === 0
  // An empty list is only meaningful when the request actually succeeded —
  // otherwise "no products" would be a lie during an outage.
  const hideContent = !isLoading && error !== null && products.length === 0
  const recent = products.slice(0, 6)

  return (
    <div className="animate-fade-in-up space-y-8">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="eyebrow">Overview</p>
          <h1 className="mt-2 font-display text-3xl text-foreground sm:text-4xl">
            Dashboard
          </h1>
          <div className="rule-gold mt-4 w-28" aria-hidden="true" />
          <p className="mt-4 max-w-xl text-sm text-muted-foreground">
            A live snapshot of the catalogue — every figure on this page is
            calculated from real product data.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/admin/products/new"
            className="btn-gold btn-gold-hover inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm uppercase tracking-[0.12em]"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add Product
          </Link>
          <Link
            to="/admin/products"
            className="btn-outline-gold btn-outline-gold-hover inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm uppercase tracking-[0.12em]"
          >
            View all products
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </header>

      {/* Quick actions — card-style entry points, each ~360px wide. */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[repeat(auto-fit,minmax(360px,1fr))]">
        <Link
          to="/admin/products/lookup"
          className="card-luxury card-luxury-hover flex items-start gap-3 rounded-xl p-4"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-2">
            <Search className="h-4.5 w-4.5 text-primary" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-medium text-foreground">
              Look up by reference
            </span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              Fetch a product's full details from its Reference code.
            </span>
          </span>
        </Link>
      </div>

      {error ? (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-3">
            <AlertCircle
              size={20}
              className="mt-0.5 shrink-0 text-destructive"
              aria-hidden="true"
            />
            <p className="text-sm text-foreground">{error}</p>
          </div>
          <button
            type="button"
            onClick={() => void refetch()}
            className="shrink-0 rounded-lg border border-destructive/50 px-4 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
          >
            Try again
          </button>
        </div>
      ) : null}

      {showSkeletons ? (
        <div role="status">
          <span className="sr-only">Loading products…</span>
          <DashboardSkeleton />
        </div>
      ) : hideContent ? (
        <p className="rounded-xl border border-dashed border-border bg-surface/60 px-6 py-10 text-center text-sm text-muted-foreground">
          The catalogue could not be loaded. Use “Try again” above to retry.
        </p>
      ) : (
        <div className="space-y-8">
          <InventorySummary products={products} />

          <section aria-labelledby="recently-added-heading" className="min-w-0">
            <div className="mb-4">
              <p className="eyebrow">Catalogue</p>
              <h2
                id="recently-added-heading"
                className="mt-2 font-display text-2xl text-foreground sm:text-3xl"
              >
                Recently added
              </h2>
            </div>

            {recent.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-surface/60 px-6 py-10 text-center">
                <p className="font-display text-xl text-foreground">
                  No products yet
                </p>
                <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                  Add your first product to start building the catalogue.
                </p>
                <Link
                  to="/admin/products/new"
                  className="btn-gold btn-gold-hover mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm uppercase tracking-[0.12em]"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Add Product
                </Link>
              </div>
            ) : (
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {recent.map((product, index) => (
                  <li
                    key={
                      product._id ??
                      product.id ??
                      `${product.name}-${index}`
                    }
                    className="min-w-0"
                  >
                    <RecentCard product={product} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
