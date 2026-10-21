import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, Copy, Eye, ImageOff, Package, Pencil, Plus, Search, Trash2, X } from 'lucide-react'

import { formatNaira } from '@/lib/brand'
import { COLLECTIONS, getCollectionName, resolveCollectionId } from '@/lib/collections'
import { availabilityLabel, availabilityPillClass } from '@/lib/availability'
import { toImageArray } from '@/lib/productImages'
import { cn } from '@/lib/utils'
import type { Product } from '@/types/product'

interface ProductTableProps {
  products: Product[]
  onEdit: (product: Product) => void
  onDelete: (product: Product) => void
  onAdd: () => void
}

/** Debounce window for the search box, in milliseconds. */
const SEARCH_DEBOUNCE_MS = 200

/** Maximum number of thumbnails shown before the "+N" overflow chip. */
const MAX_THUMBS = 3

/** How long a row's copy feedback (Check icon + announcement) lingers. */
const COPY_FEEDBACK_MS = 1500

/**
 * Brief blank beat before the feedback shows. A repeat copy of the same row
 * passes through it again, so the icon visibly re-flips and the live region
 * sees a text change (empty → "Reference copied") and re-announces.
 */
const COPY_RESET_MS = 100

/** Thumbnail box sizes, held as literal class strings. */
const THUMB_BOX_CLASS: Record<'sm' | 'lg', string> = {
  sm: 'h-10 w-10',
  lg: 'h-14 w-14',
}

/**
 * Records created before the rebrand carry no `collection`. The backend
 * treats those as jewellery, so the filter agrees with the storefront.
 */
function resolveCollection(product: Product): string {
  return resolveCollectionId(product)
}

function productKey(product: Product, index: number): string {
  return product._id ?? (product.id !== undefined ? String(product.id) : `${product.name}-${index}`)
}

/**
 * The Mongo reference used for the copy action and the lookup link.
 * Returns `undefined` when a record has neither `_id` nor `id`, in which
 * case both row actions are hidden — there is nowhere to navigate and
 * nothing meaningful to copy.
 */
function referenceId(product: Product): string | undefined {
  return product._id ?? product.id
}

interface ThumbStackProps {
  images: string[]
  size?: 'sm' | 'lg'
}

/** Up to three product images with a "+N" chip for the remainder. */
function ThumbStack({ images, size = 'sm' }: ThumbStackProps) {
  const box = THUMB_BOX_CLASS[size]
  const visible = images.slice(0, MAX_THUMBS)
  const overflow = images.length - visible.length

  if (visible.length === 0) {
    return (
      <div
        role="img"
        aria-label="No image"
        className={cn(
          'flex shrink-0 items-center justify-center rounded-md border border-dashed border-border bg-surface-2',
          box,
        )}
      >
        <ImageOff className="h-4 w-4 text-subtle" aria-hidden="true" />
      </div>
    )
  }

  return (
    <div className="flex shrink-0 items-center gap-1.5">
      {visible.map((src, index) => (
        <img
          key={`${src}-${index}`}
          src={src}
          alt=""
          aria-hidden="true"
          loading="lazy"
          className={cn(
            'shrink-0 rounded-md border border-border object-cover',
            box,
          )}
        />
      ))}
      {overflow > 0 ? (
        <span
          className={cn(
            'flex shrink-0 items-center justify-center rounded-md border border-border bg-surface-2 text-[11px] font-medium text-muted-foreground',
            box,
          )}
          aria-label={`${overflow} more image${overflow === 1 ? '' : 's'}`}
        >
          +{overflow}
        </span>
      ) : null}
    </div>
  )
}

function AvailabilityPill({ category }: { category?: string }) {
  const label = availabilityLabel(category)
  const pillClass = availabilityPillClass(category)

  return (
    <span
      className={cn(
        'inline-flex items-center whitespace-nowrap rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-[0.12em]',
        pillClass,
      )}
    >
      {label}
    </span>
  )
}

export default function ProductTable({
  products,
  onEdit,
  onDelete,
  onAdd,
}: ProductTableProps) {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [collection, setCollection] = useState<string>('all')

  // Keep typing responsive: the list only re-filters once typing pauses.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search)
    }, SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [search])

  // Per-row copy feedback: reference -> { expiry, shown }. Each copy lands in
  // a short reset (Copy icon, empty live region) before the Check feedback
  // shows — that reset is what lets a repeat copy of the same row re-flip the
  // icon and re-announce — and every row expires on its own 1.5s window, so
  // copying two rows keeps both checkmarks until each one lapses.
  const [copies, setCopies] = useState<Record<string, { exp: number; shown: boolean }>>({})

  useEffect(() => {
    const entries = Object.entries(copies)
    if (entries.length === 0) return

    // Reset phase: hold the blank beat, then flip every fresh copy to "shown".
    if (entries.some(([, feedback]) => !feedback.shown)) {
      const reset = window.setTimeout(() => {
        setCopies((prev) => {
          const next = { ...prev }
          for (const ref of Object.keys(next)) {
            if (!next[ref].shown) next[ref] = { ...next[ref], shown: true }
          }
          return next
        })
      }, COPY_RESET_MS)
      return () => window.clearTimeout(reset)
    }

    // Shown phase: wake at the earliest expiry and drop every row whose own
    // window has lapsed (a new object always restarts this effect, so an
    // impossibly-early timer simply reschedules instead of getting stuck).
    const timer = window.setTimeout(() => {
      const now = Date.now()
      setCopies((prev) =>
        Object.fromEntries(
          Object.entries(prev).filter(([, feedback]) => feedback.exp > now),
        ),
      )
    }, Math.max(0, Math.min(...entries.map(([, feedback]) => feedback.exp)) - Date.now()))
    return () => window.clearTimeout(timer)
  }, [copies])

  // Copies a product's reference, with a hidden-textarea fallback for
  // browsers/contexts where the async Clipboard API is unavailable.
  async function copyReference(product: Product) {
    const value = referenceId(product)
    if (!value) return

    let copiedOk = false

    try {
      await navigator.clipboard.writeText(value)
      copiedOk = true
    } catch {
      // Clipboard API unavailable (insecure context, denied permission, …):
      // fall back to a hidden textarea + deprecated execCommand.
      try {
        const textarea = document.createElement('textarea')
        textarea.value = value
        textarea.setAttribute('readonly', '')
        textarea.style.position = 'fixed'
        textarea.style.top = '-9999px'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.select()
        copiedOk = document.execCommand('copy')
        document.body.removeChild(textarea)
      } catch {
        copiedOk = false
      }
    }

    if (copiedOk) {
      setCopies((prev) => ({
        ...prev,
        [value]: { exp: Date.now() + COPY_FEEDBACK_MS, shown: false },
      }))
    }
  }

  const filtered = useMemo(() => {
    const needle = debouncedSearch.trim().toLowerCase()
    return products.filter((product) => {
      const name = product.name ?? ''
      const matchesName = needle === '' || name.toLowerCase().includes(needle)
      const matchesCollection =
        collection === 'all' || resolveCollection(product) === collection
      return matchesName && matchesCollection
    })
  }, [products, debouncedSearch, collection])

  const isFiltering =
    debouncedSearch.trim() !== '' || collection !== 'all'

  const resultLabel = isFiltering
    ? `${filtered.length} of ${products.length} shown`
    : `${products.length} ${products.length === 1 ? 'product' : 'products'}`

  const hasCatalog = products.length > 0

  return (
    <section aria-labelledby="product-table-heading" className="animate-fade-in-up">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="eyebrow">Catalogue</p>
          <h2
            id="product-table-heading"
            className="font-display text-2xl text-foreground sm:text-3xl"
          >
            Products
          </h2>
          <p className="mt-1 text-sm text-muted-foreground" aria-live="polite">
            {resultLabel}
          </p>
        </div>

        <button
          type="button"
          onClick={onAdd}
          className="btn-gold btn-gold-hover inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm uppercase tracking-[0.12em]"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add Product
        </button>
      </header>

      {/* Toolbar: search + collection filter */}
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative sm:max-w-xs sm:flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle"
            aria-hidden="true"
          />
          <input
            id="product-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search products…"
            aria-label="Search products by name"
            className="h-11 w-full rounded-lg border border-border bg-surface-2 pl-10 pr-11 text-sm text-foreground placeholder:text-subtle transition-colors focus:border-primary/60"
          />
          {search ? (
            <button
              type="button"
              onClick={() => setSearch('')}
              aria-label="Clear search"
              className="absolute right-0 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center text-subtle transition-colors hover:text-foreground"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          ) : null}
        </div>

        <div className="flex items-center gap-3">
          <label
            htmlFor="collection-filter"
            className="text-xs uppercase tracking-[0.16em] text-muted-foreground"
          >
            Collection
          </label>
          <select
            id="collection-filter"
            value={collection}
            onChange={(event) => setCollection(event.target.value)}
            className="h-11 min-w-0 flex-1 rounded-lg border border-border bg-surface-2 px-3 text-sm text-foreground transition-colors focus:border-primary/60 sm:flex-none"
          >
            <option value="all">All</option>
            {COLLECTIONS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-5 rounded-xl border border-dashed border-border bg-surface/60 px-6 py-12 text-center">
          <EmptyGlyph isEmptyCatalog={!hasCatalog} />
          <p className="mt-4 font-display text-xl text-foreground">
            {hasCatalog
              ? 'No products match your search'
              : 'No products yet — add your first product'}
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            {hasCatalog
              ? 'Try a different name or switch the collection filter back to All.'
              : 'Your catalogue is empty. Add a product to start selling.'}
          </p>
          {!hasCatalog ? (
            <button
              type="button"
              onClick={onAdd}
              className="btn-outline-gold btn-outline-gold-hover mt-6 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm uppercase tracking-[0.12em]"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add Product
            </button>
          ) : null}
        </div>
      ) : (
        <>
          {/* Desktop: a real table. The wrapper owns the horizontal scroll so
              narrow columns never push the page sideways. */}
          <div className="scrollbar-slim mt-5 hidden max-h-[70vh] overflow-x-auto overflow-y-auto rounded-xl border border-border md:block">
            <table className="w-full min-w-[56rem] border-collapse text-left">
              <caption className="sr-only">
                Products in the DAMI MERIDIAN catalogue
              </caption>
              <thead className="bg-surface">
                <tr className="border-b border-border">
                  <th
                    scope="col"
                    className="sticky top-0 z-20 bg-surface px-4 py-3.5 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground"
                  >
                    Images
                  </th>
                  <th
                    scope="col"
                    className="sticky top-0 z-20 bg-surface px-4 py-3.5 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground"
                  >
                    Product
                  </th>
                  <th
                    scope="col"
                    className="sticky top-0 z-20 bg-surface px-4 py-3.5 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground"
                  >
                    Collection
                  </th>
                  <th
                    scope="col"
                    className="sticky top-0 z-20 bg-surface px-4 py-3.5 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground"
                  >
                    Price
                  </th>
                  <th
                    scope="col"
                    className="sticky top-0 z-20 bg-surface px-4 py-3.5 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground"
                  >
                    Availability
                  </th>
                  <th
                    scope="col"
                    className="sticky top-0 z-20 bg-surface px-4 py-3.5 text-right text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((product, index) => {
                  const ref = referenceId(product)
                  const copied = ref !== undefined && copies[ref]?.shown === true

                  return (
                    <tr
                      key={productKey(product, index)}
                      className="transition-colors hover:bg-surface-2/70"
                    >
                      <td className="px-4 py-3 align-middle">
                        <ThumbStack images={toImageArray(product.imageURLs)} />
                      </td>
                      <td className="max-w-[18rem] px-4 py-3 align-middle">
                        <p
                          title={product.name}
                          className="truncate text-sm font-medium text-foreground"
                        >
                          {product.name}
                        </p>
                      </td>
                      <td className="px-4 py-3 align-middle text-sm text-muted-foreground">
                        {getCollectionName(product.collection)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 align-middle text-sm font-medium text-primary">
                        {formatNaira(product.price)}
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <AvailabilityPill category={product.category} />
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => onEdit(product)}
                            aria-label={`Edit ${product.name}`}
                            className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
                          >
                            <Pencil className="h-4 w-4" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDelete(product)}
                            aria-label={`Delete ${product.name}`}
                            className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-destructive/40 text-destructive transition-colors hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </button>
                          {ref ? (
                            <>
                              <button
                                type="button"
                                onClick={() => void copyReference(product)}
                                aria-label={`Copy reference for ${product.name}`}
                                className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
                              >
                                {copied ? (
                                  <Check className="h-4 w-4 text-primary" aria-hidden="true" />
                                ) : (
                                  <Copy className="h-4 w-4" aria-hidden="true" />
                                )}
                              </button>
                              <Link
                                to={`/admin/products/lookup?ref=${ref}`}
                                aria-label={`Look up ${product.name} by reference`}
                                className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
                              >
                                <Eye className="h-4 w-4" aria-hidden="true" />
                              </Link>
                            </>
                          ) : null}
                        </div>
                        {/* Kept mounted so repeated copies re-announce. */}
                        <p role="status" aria-live="polite" className="sr-only">
                          {copied ? 'Reference copied' : ''}
                        </p>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile: a stacked card list — a squeezed table is unusable here. */}
          <ul className="mt-5 space-y-3 md:hidden">
            {filtered.map((product, index) => {
              const ref = referenceId(product)
              const copied = ref !== undefined && copies[ref]?.shown === true

              return (
                <li
                  key={productKey(product, index)}
                  className="card-luxury rounded-xl p-4"
                >
                  <div className="flex items-start gap-3">
                    <ThumbStack
                      images={toImageArray(product.imageURLs)}
                      size="lg"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 break-words text-sm font-medium text-foreground">
                        {product.name}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {getCollectionName(product.collection)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <span className="font-display text-lg text-primary">
                      {formatNaira(product.price)}
                    </span>
                    <AvailabilityPill category={product.category} />
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
                    <button
                      type="button"
                      onClick={() => onEdit(product)}
                      aria-label={`Edit ${product.name}`}
                      className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-lg border border-border text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
                    >
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(product)}
                      aria-label={`Delete ${product.name}`}
                      className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-lg border border-destructive/40 text-sm text-destructive transition-colors hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                      Delete
                    </button>
                    {ref ? (
                      <>
                        <button
                          type="button"
                          onClick={() => void copyReference(product)}
                          aria-label={`Copy reference for ${product.name}`}
                          className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-lg border border-border text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
                        >
                          {copied ? (
                            <Check className="h-4 w-4 text-primary" aria-hidden="true" />
                          ) : (
                            <Copy className="h-4 w-4" aria-hidden="true" />
                          )}
                          Copy
                        </button>
                        <Link
                          to={`/admin/products/lookup?ref=${ref}`}
                          aria-label={`Look up ${product.name} by reference`}
                          className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-lg border border-border text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
                        >
                          <Eye className="h-4 w-4" aria-hidden="true" />
                          View
                        </Link>
                      </>
                    ) : null}
                  </div>
                  {/* Kept mounted so repeated copies re-announce. */}
                  <p role="status" aria-live="polite" className="sr-only">
                    {copied ? 'Reference copied' : ''}
                  </p>
                </li>
              )
            })}
          </ul>
        </>
      )}
    </section>
  )
}

/** Decorative mark for the empty state. */
function EmptyGlyph({ isEmptyCatalog }: { isEmptyCatalog: boolean }) {
  return (
    <span
      aria-hidden="true"
      className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/30"
    >
      {isEmptyCatalog ? (
        <Package className="h-5 w-5 text-primary" />
      ) : (
        <Search className="h-5 w-5 text-primary" />
      )}
    </span>
  )
}
