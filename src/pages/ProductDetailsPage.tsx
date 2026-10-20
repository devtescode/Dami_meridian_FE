import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { PackageX, RefreshCw, TriangleAlert, WifiOff } from 'lucide-react'

import ProductCard from '@/components/ProductCard'
import { ProductDetailView } from '@/components/ProductDetailView'
import { Container, Section } from '@/components/Section'
import { ApiError, getProduct, getProducts } from '@/lib/api'
import { BRAND } from '@/lib/brand'
import { getCollectionName, resolveCollectionId } from '@/lib/collections'
import { cn } from '@/lib/utils'
import type { Product } from '@/types/product'

/**
 * Public product detail route (`/products/:id`).
 *
 * The route id is the MongoDB `_id` and the only thing taken from the URL —
 * name, price and images always come from `getProduct(id)`, never from query
 * parameters, so a doctored link can never spoof a product.
 */

/* -------------------------------------------------------------------------- */
/* Loading skeleton                                                            */
/* -------------------------------------------------------------------------- */

function SkeletonBlock({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      style={{ backgroundSize: '200% 100%' }}
      className={cn(
        'animate-shimmer rounded-lg bg-gradient-to-r from-surface-2 via-elevated to-surface-2',
        className,
      )}
    />
  )
}

function ProductDetailsSkeleton() {
  return (
    <div role="status">
      <span className="sr-only">Loading product…</span>

      {/* Breadcrumb placeholder */}
      <Container className="pb-6 pt-8 sm:pt-10">
        <div className="flex flex-wrap items-center gap-2">
          <SkeletonBlock className="h-3 w-10" />
          <SkeletonBlock className="h-3 w-8" />
          <SkeletonBlock className="h-3 w-24" />
        </div>
      </Container>

      {/* Gallery + details placeholders */}
      <Container className="pb-16 sm:pb-20">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
          <SkeletonBlock className="aspect-square w-full rounded-2xl" />
          <div className="flex flex-col gap-4">
            <SkeletonBlock className="h-3 w-28" />
            <SkeletonBlock className="h-10 w-4/5" />
            <SkeletonBlock className="h-7 w-44" />
            <SkeletonBlock className="mt-2 h-4 w-full" />
            <SkeletonBlock className="h-4 w-11/12" />
            <SkeletonBlock className="h-4 w-3/5" />
            <SkeletonBlock className="mt-2 h-11 w-64 rounded-full" />
          </div>
        </div>
      </Container>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Error states                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Matrix:
 * - 400 (invalid reference) / 404 (gone) → "doesn't exist" + Back to Shop.
 * - 0 (network unreachable)              → offline copy + Retry (+ Back to Shop).
 * - anything else                        → generic copy + Retry (+ Back to Shop).
 */
function ProductErrorState({
  error,
  onRetry,
}: {
  error: ApiError
  onRetry: () => void
}) {
  const isMissing = error.status === 400 || error.status === 404
  const isOffline = error.status === 0

  const heading = isMissing
    ? "This product doesn't exist (or is no longer available)"
    : isOffline
      ? 'You appear to be offline'
      : 'Something went wrong'
  const Icon = isMissing ? PackageX : isOffline ? WifiOff : TriangleAlert

  return (
    <Container className="py-16 sm:py-24">
      <div className="mx-auto flex max-w-xl flex-col items-center gap-5 rounded-2xl border border-border bg-surface px-6 py-12 text-center sm:px-10">
        <span className="flex h-14 w-14 items-center justify-center rounded-full border border-border bg-surface-2 text-primary">
          <Icon size={24} aria-hidden="true" />
        </span>
        <h1 className="font-display text-2xl leading-snug text-foreground sm:text-3xl">
          {heading}
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
          {error.message}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {!isMissing && (
            <button
              type="button"
              onClick={onRetry}
              className="btn-gold btn-gold-hover inline-flex min-h-11 items-center gap-2 rounded-full px-6 py-3 text-xs font-medium uppercase tracking-[0.16em]"
            >
              <RefreshCw size={15} aria-hidden="true" />
              Retry
            </button>
          )}
          <Link
            to="/shop"
            className="btn-outline-gold btn-outline-gold-hover inline-flex min-h-11 items-center rounded-full px-6 py-3 text-xs font-medium uppercase tracking-[0.16em]"
          >
            Back to Shop
          </Link>
        </div>
      </div>
    </Container>
  )
}

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

export default function ProductDetailsPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()

  const [product, setProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<ApiError | null>(null)
  const [retryToken, setRetryToken] = useState(0)
  const [related, setRelated] = useState<Product[]>([])

  // The document title as it was before this route mounted, restored on leave.
  const baseTitleRef = useRef(document.title)

  /* ------------------------------ Primary fetch ------------------------------ */
  useEffect(() => {
    let cancelled = false

    setIsLoading(true)
    setError(null)
    setProduct(null)
    setRelated([])

    getProduct(id)
      .then((data) => {
        if (!cancelled) setProduct(data)
      })
      .catch((reason: unknown) => {
        if (cancelled) return
        setError(
          reason instanceof ApiError
            ? reason
            : new ApiError(
                reason instanceof Error && reason.message
                  ? reason.message
                  : 'Something went wrong while loading this product.',
                -1,
              ),
        )
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [id, retryToken])

  /* ------------------------------- Page title ------------------------------- */
  useEffect(() => {
    if (!product) return
    document.title = `${product.name} — ${BRAND.name}`
    return () => {
      document.title = baseTitleRef.current
    }
  }, [product])

  /* --------------------------- "You may also like" -------------------------- */
  // Optional strip: any failure here is swallowed so it can never take the
  // product page down with it.
  useEffect(() => {
    if (!product) return
    let cancelled = false

    getProducts()
      .then((all) => {
        if (cancelled || !Array.isArray(all)) return
        const collectionId = resolveCollectionId(product)
        const matches = all.filter(
          (candidate) =>
            candidate._id !== undefined &&
            candidate._id !== product._id &&
            resolveCollectionId(candidate) === collectionId,
        )
        setRelated(matches.slice(0, 4))
      })
      .catch(() => {
        if (!cancelled) setRelated([])
      })

    return () => {
      cancelled = true
    }
  }, [product])

  const retry = () => setRetryToken((token) => token + 1)

  // History-aware back: return to wherever the visitor came from (the shop
  // keeps its filters that way), or land on the shop when this is a deep link.
  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1)
    } else {
      navigate('/shop')
    }
  }

  /* --------------------------------- Render --------------------------------- */

  if (error) {
    return (
      <div className="animate-fade-in">
        <ProductErrorState error={error} onRetry={retry} />
      </div>
    )
  }

  if (isLoading || !product) {
    return <ProductDetailsSkeleton />
  }

  const collectionId = resolveCollectionId(product)

  return (
    <div className="animate-fade-in">
      {/* Breadcrumb */}
      <Container className="pb-5 pt-8 sm:pt-10">
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground sm:text-sm">
            <li>
              <Link to="/" className="transition-colors hover:text-primary">
                Home
              </Link>
            </li>
            <li aria-hidden="true" className="text-subtle">
              /
            </li>
            <li>
              <Link to="/shop" className="transition-colors hover:text-primary">
                Shop
              </Link>
            </li>
            <li aria-hidden="true" className="text-subtle">
              /
            </li>
            <li>
              <Link
                to={`/shop?collection=${collectionId}`}
                className="transition-colors hover:text-primary"
              >
                {getCollectionName(product.collection)}
              </Link>
            </li>
            <li aria-hidden="true" className="text-subtle">
              /
            </li>
            <li
              aria-current="page"
              className="max-w-[55vw] truncate text-foreground sm:max-w-md"
            >
              {product.name}
            </li>
          </ol>
        </nav>
      </Container>

      <ProductDetailView product={product} onBack={handleBack} />

      {/* Optional cross-sell strip — silently omitted when there is nothing
          (or the catalogue fetch failed). */}
      {related.length > 0 && (
        <Section
          eyebrow={getCollectionName(product.collection)}
          title="You may also like"
          className="border-t border-border/40"
        >
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((item) => (
              <ProductCard
                key={item._id}
                product={item}
                onViewMore={() => {
                  if (item._id) navigate(`/products/${item._id}`)
                }}
              />
            ))}
          </div>
        </Section>
      )}
    </div>
  )
}
