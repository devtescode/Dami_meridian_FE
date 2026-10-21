import { useEffect, useMemo, useRef, useState } from 'react'
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
import Pagination from '@/components/Pagination'
import { Section } from '@/components/Section'
import { useProductPageQuery } from '@/hooks/queries/useProductPageQuery'
import type { ProductSort } from '@/lib/api'
import {
  COLLECTIONS,
  COLLECTION_IDS,
  type CollectionId,
} from '@/lib/collections'
import type { Product } from '@/types/product'

type FilterId = 'all' | CollectionId
type SortId = 'featured' | 'price-asc' | 'price-desc' | 'name-asc'

/**
 * The sort options the visitor sees. `featured` is the default ordering and
 * maps onto the backend's `newest` — the catalogue is always served
 * newest-first, so it is the same thing the storefront used to call "featured".
 */
const SORT_LABELS: Record<SortId, string> = {
  featured: 'Newest',
  'price-asc': 'Price: Low to High',
  'price-desc': 'Price: High to Low',
  'name-asc': 'Name: A–Z',
}

/**
 * Translation table from the visitor-facing sort id to the ordering the
 * backend understands. The API client validates this value against a fixed
 * allow-list, so an unknown key would be rejected with a 400.
 */
const SERVER_SORT: Record<SortId, ProductSort> = {
  featured: 'newest',
  'price-asc': 'price-asc',
  'price-desc': 'price-desc',
  'name-asc': 'name-asc',
}

/** Products shown per page. The backend's own default matches this. */
const DEFAULT_PAGE_SIZE = 6

const CHIP_BASE =
  'min-h-[44px] whitespace-nowrap rounded-full border px-4 py-2 text-xs uppercase tracking-[0.14em] transition-colors duration-300'

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

/**
 * Loading placeholder for the grid. It renders exactly as many cards as the
 * page holds, so the layout does not jump when the real grid lands.
 */
function ProductSkeleton({ count = DEFAULT_PAGE_SIZE }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-8"
      aria-hidden="true"
    >
      {Array.from({ length: count }).map((_, index) => (
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
   * skeletons, states, grid, pagination — renders unchanged.
   */
  hideHeader?: boolean
  /**
   * Products per page. Defaults to 6, which is also the backend's default
   * page size. The API caps a request at 60 products per page.
   */
  pageSize?: number
}

export default function Shop({
  onProductClick,
  hideHeader = false,
  pageSize = DEFAULT_PAGE_SIZE,
}: ShopProps) {
  const navigate = useNavigate()

  /** The URL is the source of truth for the collection and search filters. */
  const [searchParams, setSearchParams] = useSearchParams()

  const activeFilter: FilterId =
    parseCollectionParam(searchParams.get('collection')) ?? 'all'

  /** Raw `?q=` exactly as it appears in the URL. */
  const urlQuery = searchParams.get('q') ?? ''

  /**
   * The committed search term is DERIVED from the URL, never stored: state
   * and URL cannot drift apart because there is only one of them. Every
   * filter/sort/count below reads this value.
   */
  const searchTerm = useMemo(
    () => (searchParams.get('q') ?? '').trim().toLowerCase(),
    [searchParams],
  )

  /** The only search state: what the visitor sees in the input box. */
  const [searchInput, setSearchInput] = useState(() => urlQuery)
  const [sort, setSort] = useState<SortId>('featured')

  /** The page currently being viewed (1-based). */
  const [page, setPage] = useState(1)

  /**
   * Reset to page 1 whenever the query, the collection or the ordering
   * changes — a page 4 that no longer exists would otherwise show an empty
   * grid.
   *
   * The comparison happens during render (React's documented "adjust state
   * when a prop changes" pattern) rather than in an effect: the page is
   * already corrected before the data request is issued, so the backend is
   * never asked for a stale page number.
   */
  const filterKey = `${searchTerm}|${activeFilter}|${sort}`
  const [lastFilterKey, setLastFilterKey] = useState(filterKey)
  if (filterKey !== lastFilterKey) {
    setLastFilterKey(filterKey)
    setPage(1)
  }

  /**
   * The catalogue is fetched a page at a time — search, collection and
   * ordering are all applied by the backend, so the browser only ever holds
   * the products of the current page.
   *
   * The page, page size, search term, collection and ordering are part of
   * the query key, so a page already visited is served from the cache
   * without a request, and two views of the same page share one request.
   */
  const {
    products,
    total,
    page: serverPage,
    clampedPage,
    totalPages,
    isLoading,
    error,
    refetch,
  } = useProductPageQuery({
    page,
    limit: pageSize,
    q: searchTerm,
    collection: activeFilter === 'all' ? null : activeFilter,
    sort: SERVER_SORT[sort],
  })

  /**
   * The backend clamps a request for a page past the end of the collection
   * down to the last page. Adopting the page the server actually served
   * keeps the controls and the URL honest — e.g. after the last product is
   * deleted, the grid follows the catalogue to its new final page.
   *
   * `clampedPage` is null while the previous page is still on screen, so
   * this can never snap the grid back a page.
   */
  useEffect(() => {
    if (clampedPage !== null && clampedPage !== page) setPage(clampedPage)
  }, [clampedPage, page])

  /**
   * Adopt a `?q=` written from outside the input. The nav bar navigates to
   * `/shop?q=…` even when this component is already mounted — the state
   * initialiser above only runs once — so without this the input would keep
   * showing the previous term while the URL advertised a new one. One-way
   * contract: URL → input, and it sets ONLY `searchInput` (the committed
   * term already lives in the URL). The normalized-equality guard means it
   * never rewrites the box over case/whitespace differences, so a URL that
   * is already committed can never bounce back through this effect.
   */
  useEffect(() => {
    if (searchInput.trim().toLowerCase() === urlQuery.trim().toLowerCase()) {
      return
    }
    setSearchInput(urlQuery)
  }, [urlQuery])

  /**
   * Debounced write-back into `?q=` so filtered searches stay shareable, and
   * so typing does not re-filter the grid on every keystroke. One-way
   * contract: input → URL. This is the only code that ever writes `?q=`.
   *
   * `setSearchParams` calls `navigate()` even when its updater returns
   * `previous` unchanged, so the guard at the top exits BEFORE scheduling a
   * timer whenever the input already normalizes to the committed term — an
   * equal value therefore causes zero navigation, not even a no-op one. That
   * top-of-effect guard is the only place the LIVE URL is read: it compares
   * against `searchTerm`, which this render derived from the current
   * `searchParams`. The guard inside the updater is NOT a live re-check —
   * react-router invokes it as `nextInit(previous)`, where `previous` is the
   * `searchParams` captured in this render's `setSearchParams` useCallback
   * closure, i.e. the very copy the top guard already tested. It is kept
   * purely as a defensive idempotency belt for the closure-stale case
   * (the debounce timer firing after the URL was changed elsewhere in the
   * meantime). Writes therefore only ever happen when a normalized value
   * actually changed, and each write makes the two sides equal, so nothing
   * can ever write as a reaction to its own write.
   *
   * `searchParams`/`searchTerm` are intentionally not deps: the body only
   * writes when the values DIFFER, which makes the effect idempotent
   * regardless of which render's copy of the URL the closure captured.
   * `replace` keeps keystrokes out of the history stack — Back still works
   * between collections, which push their own entries.
   */
  useEffect(() => {
    const nextTerm = searchInput.trim().toLowerCase()
    if (nextTerm === searchTerm) return
    // Debounce the write so the URL (and grid) settle after typing pauses.
    const timer = window.setTimeout(() => {
      setSearchParams(
        (previous) => {
          // Belt-and-braces, NOT a live re-check: `previous` is the params
          // captured in this render's `setSearchParams` closure — the same
          // copy the top-of-effect guard already tested.
          if ((previous.get('q') ?? '').trim().toLowerCase() === nextTerm) {
            return previous
          }
          const next = new URLSearchParams(previous)
          if (nextTerm) next.set('q', nextTerm)
          else next.delete('q')
          return next
        },
        { replace: true },
      )
    }, 200)
    return () => window.clearTimeout(timer)
  }, [searchInput])

  /**
   * Collection chips write `?collection=`, pushing a history entry per real
   * change; re-selecting the already-active chip navigates nowhere.
   */
  const selectCollection = (id: FilterId) => {
    const next = new URLSearchParams(searchParams)
    if (id === 'all') next.delete('collection')
    else next.set('collection', id)
    if (next.toString() === searchParams.toString()) return
    setSearchParams(next, { replace: false })
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

  /**
   * Price ordering is only offered once the catalogue actually exposes
   * readable prices. The flag LATCHES: a page that happens to contain no
   * priced product must not make the option disappear while the visitor is
   * on another page.
   */
  const [hasNumericPrice, setHasNumericPrice] = useState(false)
  useEffect(() => {
    if (products.some((product) => numericPrice(product) !== null)) {
      setHasNumericPrice(true)
    }
  }, [products])

  // Fall back to the default ordering while the catalogue exposes no prices.
  useEffect(() => {
    if (isLoading) return
    if (!hasNumericPrice && sort !== 'featured') setSort('featured')
  }, [hasNumericPrice, sort, isLoading])

  /** Scroll target for a page change — the filter bar, just above the grid. */
  const controlsRef = useRef<HTMLDivElement>(null)

  const handlePageChange = (next: number) => {
    if (next === page) return
    setPage(next)
    // Bring the visitor back to the top of the results rather than leaving
    // them at the bottom of the previous page. `scroll-mt` clears the
    // sticky navigation bar.
    controlsRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

  /**
   * The skeleton is only for a grid with nothing to show.
   *
   * While the next page loads, the previous page stays on screen (React
   * Query's `keepPreviousData`), so the grid must NOT collapse into
   * skeletons on a page change — only a cold, empty first load does.
   */
  const showSkeleton = isLoading && products.length === 0

  const filtersActive =
    activeFilter !== 'all' || searchTerm.length > 0 || sort !== 'featured'

  /** A collection or a search term actually narrows the result set. */
  const hasNarrowingFilter = activeFilter !== 'all' || searchTerm.length > 0

  const clearFilters = () => {
    // Clear the URL only when there is something to clear — `setSearchParams`
    // navigates unconditionally, and an equal-value push would be noise.
    const next = new URLSearchParams()
    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: false })
    }
    setSearchInput('')
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
      <div
        ref={controlsRef}
        className="mb-10 flex scroll-mt-24 flex-col gap-5 lg:mb-12"
      >
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
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            {showSkeleton
              ? 'Loading the collection…'
              : `Page ${serverPage} of ${totalPages} · ${total} ${
                  total === 1 ? 'piece' : 'pieces'
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

      {showSkeleton ? (
        <ProductSkeleton count={pageSize} />
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
      ) : products.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface/70 p-8 text-center backdrop-blur-sm sm:p-12">
          <PackageOpen
            className="mx-auto mb-4 h-9 w-9 text-primary/70"
            aria-hidden="true"
          />
          <h3 className="font-display text-2xl text-foreground">
            {hasNarrowingFilter
              ? 'No products match those filters'
              : 'The collection is being curated'}
          </h3>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
            {hasNarrowingFilter
              ? 'Try a different collection, widen your search, or reset the filters to see everything we make.'
              : 'New pieces are being photographed and added. Please check back shortly.'}
          </p>
          {hasNarrowingFilter && (
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
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-8">
            {products.map((product, index) => (
              <div
                key={product._id ?? product.id ?? `${product.name}-${index}`}
                className="h-full animate-fade-in-up"
                style={{ animationDelay: `${(index % pageSize) * 70}ms` }}
              >
                <ProductCard
                  product={product}
                  onViewMore={() => handleProductClick(product)}
                />
              </div>
            ))}
          </div>

          {/* Compact pagination strip below the grid. The component owns its
              own range line ("Showing 1–6 of 24 products") and never
              renders anything when the catalogue is empty. */}
          <div className="mt-12">
            <Pagination
              page={serverPage}
              totalPages={totalPages}
              total={total}
              pageSize={pageSize}
              onPageChange={handlePageChange}
              isBusy={isLoading}
            />
          </div>
        </>
      )}
    </Section>
  )
}
