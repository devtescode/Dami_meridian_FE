import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  AlertCircle,
  ChevronDown,
  PackageOpen,
  RefreshCw,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import ProductCard from '@/components/ProductCard'
import { Section } from '@/components/Section'
import { useProducts } from '@/hooks/useProducts'
import {
  COLLECTIONS,
  COLLECTION_IDS,
  type CollectionId,
} from '@/lib/collections'
import type { Product } from '@/types/product'

type FilterId = 'all' | CollectionId
type SortId = 'featured' | 'price-asc' | 'price-desc' | 'name-asc'

const SORT_LABELS: Record<SortId, string> = {
  featured: 'Featured',
  'price-asc': 'Price: Low to High',
  'price-desc': 'Price: High to Low',
  'name-asc': 'Name: A–Z',
}

const CHIP_BASE =
  'min-h-[44px] whitespace-nowrap rounded-full border px-4 py-2 text-xs uppercase tracking-[0.14em] transition-colors duration-300'

/**
 * Pre-rebrand records carry no `collection` field. The backend treats them as
 * jewellery, so the storefront does the same to keep filters and labels in
 * agreement.
 */
function resolveCollection(product: Product): CollectionId {
  const id = product.collection
  if (!id) return 'jewellery'
  const match = COLLECTIONS.find((collection) => collection.id === id)
  return match ? match.id : 'jewellery'
}

/** Reads `?collection=` into a known id, or null when absent/unknown. */
function parseCollectionParam(raw: string | null): CollectionId | null {
  if (!raw) return null
  return COLLECTION_IDS.find((id) => id === raw) ?? null
}

/** Parses a price into a number, or null when it cannot be read. */
function numericPrice(product: Product): number | null {
  const raw =
    typeof product.price === 'number'
      ? String(product.price)
      : String(product.price).trim()
  if (!raw) return null

  const digits = raw.replace(/[^\d.]/g, '')
  if (!digits) return null

  const value = Number(digits)
  return Number.isFinite(value) ? value : null
}

function ProductSkeleton() {
  return (
    <div
      className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-8"
      aria-hidden="true"
    >
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="card-luxury overflow-hidden rounded-2xl">
          <div className="aspect-[4/5] w-full animate-pulse bg-surface-2" />
          <div className="space-y-3 p-4 sm:p-5">
            <div className="h-3 w-28 animate-pulse rounded bg-surface-2" />
            <div className="h-5 w-4/5 animate-pulse rounded bg-surface-2" />
            <div className="h-7 w-28 animate-pulse rounded bg-surface-2" />
            <div className="h-11 w-full animate-pulse rounded-lg bg-surface-2" />
          </div>
        </div>
      ))}
    </div>
  )
}

export interface ShopProps {
  /** Optional override; defaults to navigating to `/products/:id`. */
  onProductClick?: (product: Product) => void
  /**
   * Hides the section's own eyebrow/heading/description/gold-rule block when
   * the host page already renders a page header (e.g. `/shop`), so the two
   * headers never stack. Everything else — search, sort, chips, counts,
   * skeletons, states, grid — renders unchanged.
   */
  hideHeader?: boolean
}

export default function Shop({ onProductClick, hideHeader = false }: ShopProps) {
  const { products, isLoading, error, refetch } = useProducts()
  const navigate = useNavigate()

  /** The URL is the source of truth for the collection and search filters. */
  const [searchParams, setSearchParams] = useSearchParams()

  const activeFilter: FilterId =
    parseCollectionParam(searchParams.get('collection')) ?? 'all'

  const [searchInput, setSearchInput] = useState(
    () => searchParams.get('q') ?? '',
  )
  const [searchTerm, setSearchTerm] = useState(
    () => (searchParams.get('q') ?? '').trim().toLowerCase(),
  )
  const [sort, setSort] = useState<SortId>('featured')

  // Debounce the search so typing does not re-filter the grid on every keystroke.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearchTerm(searchInput.trim().toLowerCase())
    }, 200)
    return () => window.clearTimeout(timer)
  }, [searchInput])

  const urlQuery = searchParams.get('q') ?? ''

  /**
   * Adopt a `?q=` written from outside the input. The nav bar navigates to
   * `/shop?q=…` even when this component is already mounted — the state
   * initialisers above only run once — so without this the grid would keep
   * filtering on the previous term while the URL advertised a new one. The
   * equality guard stops the effect from undoing the visitor's own typing:
   * the debounced write-back below always lands on exactly this value.
   */
  useEffect(() => {
    if (searchInput.trim().toLowerCase() === urlQuery.trim().toLowerCase()) {
      return
    }
    setSearchInput(urlQuery)
    setSearchTerm(urlQuery.trim().toLowerCase())
  }, [urlQuery])

  /**
   * Mirror the debounced term into `?q=` so filtered searches stay shareable.
   * `replace` keeps keystrokes out of the history stack — Back still works
   * between collections, which push their own entries.
   */
  useEffect(() => {
    setSearchParams(
      (previous) => {
        if ((previous.get('q') ?? '').trim().toLowerCase() === searchTerm) {
          return previous
        }
        const next = new URLSearchParams(previous)
        if (searchTerm) next.set('q', searchTerm)
        else next.delete('q')
        return next
      },
      { replace: true },
    )
  }, [searchTerm, setSearchParams])

  /** Collection chips write `?collection=`, pushing a history entry each time. */
  const selectCollection = (id: FilterId) => {
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous)
        if (id === 'all') next.delete('collection')
        else next.set('collection', id)
        return next
      },
      { replace: false },
    )
  }

  const handleProductClick = (product: Product) => {
    if (onProductClick) {
      onProductClick(product)
      return
    }
    const id = product._id ?? product.id
    if (!id) return
    navigate(`/products/${id}`)
  }

  const hasNumericPrice = useMemo(
    () => products.some((product) => numericPrice(product) !== null),
    [products],
  )

  // Price sorting is only meaningful once the catalogue exposes numeric prices.
  useEffect(() => {
    if (!hasNumericPrice && sort !== 'featured') setSort('featured')
  }, [hasNumericPrice, sort])

  const visibleProducts = useMemo(() => {
    const filtered = products.filter((product) => {
      const matchesCollection =
        activeFilter === 'all' || resolveCollection(product) === activeFilter
      if (!matchesCollection) return false

      if (!searchTerm) return true

      const haystack = `${String(product.name)} ${String(
        product.description ?? '',
      )}`.toLowerCase()
      return haystack.includes(searchTerm)
    })

    if (sort === 'featured') return filtered

    const sorted = [...filtered]
    if (sort === 'name-asc') {
      sorted.sort((a, b) =>
        String(a.name).localeCompare(String(b.name), 'en', {
          sensitivity: 'base',
        }),
      )
    } else {
      sorted.sort((a, b) => {
        const priceA = numericPrice(a)
        const priceB = numericPrice(b)
        // Pieces without a readable price always sink to the bottom.
        if (priceA === null && priceB === null) return 0
        if (priceA === null) return 1
        if (priceB === null) return -1
        return sort === 'price-asc' ? priceA - priceB : priceB - priceA
      })
    }
    return sorted
  }, [products, activeFilter, searchTerm, sort])

  const filtersActive =
    activeFilter !== 'all' || searchTerm.length > 0 || sort !== 'featured'

  const clearFilters = () => {
    setSearchParams({}, { replace: false })
    setSearchInput('')
    setSearchTerm('')
    setSort('featured')
  }

  const activeCollectionName =
    activeFilter === 'all'
      ? null
      : (COLLECTIONS.find((collection) => collection.id === activeFilter)
          ?.name ?? null)

  return (
    <Section
      id="shop"
      // Omitting the header props skips the eyebrow/heading/rule block while
      // the Section wrapper (vertical rhythm, Container) renders unchanged.
      {...(hideHeader
        ? {}
        : {
            eyebrow: 'The Collection',
            title: (
              <>
                Shop <span className="text-gradient">DAMI MERIDIAN</span>
              </>
            ),
            description:
              'Premium t-shirts, joggers, fragrances and jewellery — every piece selected to carry identity. Filter the catalogue, find your fit, and order directly on WhatsApp.',
          })}
    >
      <div className="mb-10 flex flex-col gap-5 lg:mb-12">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search t-shirts, perfumes, jewellery…"
              aria-label="Search the catalogue"
              className="w-full min-h-[44px] rounded-full border border-border bg-surface-2 py-3 pl-11 pr-4 text-sm text-foreground placeholder:text-subtle transition-colors focus:border-primary/60"
            />
          </div>

          <div className="relative w-full sm:w-auto">
            <label
              htmlFor="shop-sort"
              className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
              Sort
            </label>
            <select
              id="shop-sort"
              value={sort}
              onChange={(event) => setSort(event.target.value as SortId)}
              className="w-full min-h-[44px] appearance-none rounded-full border border-border bg-surface-2 py-2 pl-4 pr-10 text-sm text-foreground transition-colors focus:border-primary/60 scheme-dark sm:w-auto"
            >
              <option value="featured">{SORT_LABELS.featured}</option>
              {hasNumericPrice && (
                <>
                  <option value="price-asc">{SORT_LABELS['price-asc']}</option>
                  <option value="price-desc">
                    {SORT_LABELS['price-desc']}
                  </option>
                </>
              )}
              <option value="name-asc">{SORT_LABELS['name-asc']}</option>
            </select>
            <ChevronDown
              className="pointer-events-none absolute bottom-3.5 right-4 h-4 w-4 text-muted-foreground"
              aria-hidden="true"
            />
          </div>
        </div>

        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="Filter by collection"
        >
          <button
            type="button"
            onClick={() => selectCollection('all')}
            aria-pressed={activeFilter === 'all'}
            className={`${CHIP_BASE} ${
              activeFilter === 'all'
                ? 'border-primary bg-primary/15 text-gold-light'
                : 'border-border bg-surface text-muted-foreground hover:border-primary/40 hover:text-foreground'
            }`}
          >
            All
          </button>
          {COLLECTIONS.map((collection) => (
            <button
              key={collection.id}
              type="button"
              onClick={() => selectCollection(collection.id)}
              aria-pressed={activeFilter === collection.id}
              className={`${CHIP_BASE} ${
                activeFilter === collection.id
                  ? 'border-primary bg-primary/15 text-gold-light'
                  : 'border-border bg-surface text-muted-foreground hover:border-primary/40 hover:text-foreground'
              }`}
            >
              {collection.name}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <p
            className="text-xs uppercase tracking-[0.18em] text-muted-foreground"
            role="status"
            aria-live="polite"
          >
            {isLoading
              ? 'Loading the collection…'
              : `Showing ${visibleProducts.length} of ${products.length} ${
                  products.length === 1 ? 'piece' : 'pieces'
                }`}
            {activeCollectionName ? ` · ${activeCollectionName}` : ''}
          </p>
          {filtersActive && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-xs uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:border-primary/50 hover:text-gold-light"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
              Clear filters
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <ProductSkeleton />
      ) : error ? (
        <div className="rounded-2xl border border-destructive/40 bg-surface/70 p-8 text-center backdrop-blur-sm sm:p-12">
          <AlertCircle
            className="mx-auto mb-4 h-9 w-9 text-destructive"
            aria-hidden="true"
          />
          <h3 className="font-display text-2xl text-foreground">
            We couldn’t load the collection
          </h3>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
            {error}
          </p>
          <button
            type="button"
            onClick={() => {
              void refetch()
            }}
            className="btn-outline-gold btn-outline-gold-hover mt-6 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg px-6 text-xs uppercase tracking-[0.16em]"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Try again
          </button>
        </div>
      ) : visibleProducts.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface/70 p-8 text-center backdrop-blur-sm sm:p-12">
          <PackageOpen
            className="mx-auto mb-4 h-9 w-9 text-primary/70"
            aria-hidden="true"
          />
          <h3 className="font-display text-2xl text-foreground">
            {products.length === 0
              ? 'The collection is being curated'
              : 'No products match those filters'}
          </h3>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
            {products.length === 0
              ? 'New pieces are being photographed and added. Please check back shortly.'
              : 'Try a different collection, widen your search, or reset the filters to see everything we make.'}
          </p>
          {products.length > 0 && (
            <button
              type="button"
              onClick={clearFilters}
              className="btn-outline-gold btn-outline-gold-hover mt-6 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg px-6 text-xs uppercase tracking-[0.16em]"
            >
              <X className="h-4 w-4" aria-hidden="true" />
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-8">
          {visibleProducts.map((product, index) => (
            <div
              key={product._id ?? product.id ?? `${product.name}-${index}`}
              className="h-full animate-fade-in-up"
              style={{ animationDelay: `${(index % 6) * 70}ms` }}
            >
              <ProductCard
                product={product}
                onViewMore={() => handleProductClick(product)}
              />
            </div>
          ))}
        </div>
      )}
    </Section>
  )
}
