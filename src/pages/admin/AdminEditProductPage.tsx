import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Check, Copy, PackageSearch, RefreshCw } from 'lucide-react'

import AdminProductForm from '@/components/admin/AdminProductForm'

import { useProductQuery } from '@/hooks/queries/useProductQuery'
import { toImageArray } from '@/lib/productImages'
import type { AdminFormProduct, Product } from '@/types/product'

/** MongoDB ObjectId — mirrors the API client's own pre-validation. */
const OBJECT_ID_PATTERN = /^[a-f0-9]{24}$/i

type LoadState = 'loading' | 'ready' | 'error' | 'notFound'

/** Maps a catalogue product onto the shape the edit form expects. */
function toFormProduct(product: Product): AdminFormProduct {
  return {
    id: product._id,
    name: product.name,
    price: String(product.price ?? ''),
    images: toImageArray(product.imageURLs),
    description: product.description ?? '',
    availability: product.category ?? 'In Stock',
    collection: product.collection ?? 'jewellery',
    sizes: product.sizes,
    colors: product.colors,
    fragranceNotes: product.fragranceNotes,
    volume: product.volume,
  }
}

/** Shimmering stand-in shaped like the form so the page does not jump. */
function FormSkeleton() {
  return (
    <div role="status" className="card-luxury rounded-xl p-5 sm:p-6">
      <span className="sr-only">Loading product…</span>
      <div aria-hidden="true" className="space-y-6">
        <div className="space-y-2">
          <div className="h-4 w-20 animate-pulse rounded-lg bg-surface-2" />
          <div className="h-11 w-full animate-pulse rounded-lg bg-surface-2" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-16 animate-pulse rounded-lg bg-surface-2" />
          <div className="h-11 w-full animate-pulse rounded-lg bg-surface-2" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-24 animate-pulse rounded-lg bg-surface-2" />
          <div className="h-28 w-full animate-pulse rounded-lg bg-surface-2" />
        </div>
        <div className="h-32 w-full animate-pulse rounded-lg border border-dashed border-border bg-surface-2" />
        <div className="h-11 w-36 animate-pulse rounded-lg bg-surface-2" />
      </div>
    </div>
  )
}

export default function AdminEditProductPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()

  const isValidId = OBJECT_ID_PATTERN.test(id)

  // A malformed URL never reaches the network: no request, no 404 guessing.
  const {
    product,
    isError,
    isLoading,
    status,
    error: loadError,
    refetch,
  } = useProductQuery(isValidId ? id : null)

  /**
   * 400 (bad reference) and 404 (deleted product) are the same screen for the
   * admin: the product is not here. A request that is still in flight shows
   * the skeleton again, so a retry never leaves a stale error on screen.
   */
  const state: LoadState =
    !isValidId || status === 400 || status === 404
      ? 'notFound'
      : isError && !isLoading
        ? 'error'
        : product
          ? 'ready'
          : 'loading'

  // Briefly swaps the Copy icon for a Check after a successful copy.
  // A tick (not a boolean): a repeat copy retriggers the state and restarts
  // the confirmation window instead of no-oping on an unchanged value.
  const [copyTick, setCopyTick] = useState(0)
  const copied = copyTick > 0

  useEffect(() => {
    if (copyTick === 0) return
    const timer = window.setTimeout(() => setCopyTick(0), 1500)
    return () => window.clearTimeout(timer)
  }, [copyTick])

  const referenceId = product?._id

  async function copyReference(value: string) {
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

    if (copiedOk) setCopyTick((value) => value + 1)
  }

  const mapped = product ? toFormProduct(product) : null

  return (
    <div className="animate-fade-in-up space-y-6">
      <div>
        <Link
          to="/admin/products"
          className="inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to products
        </Link>

        <p className="eyebrow mt-4">Catalogue</p>
        <h1 className="mt-2 font-display text-3xl text-foreground sm:text-4xl">
          Edit Product
        </h1>
        <div className="rule-gold mt-4 w-28" aria-hidden="true" />
        {/* Gated on 'ready' so a stale product never shows its header or
            reference row while a different id (or a retry) is loading. */}
        {state === 'ready' && product ? (
          <div className="mt-4">
            <p className="text-sm text-muted-foreground">
              Editing{' '}
              <span className="font-medium text-foreground">{product.name}</span>
            </p>

            {referenceId ? (
              <div className="mt-3 flex items-start justify-between gap-3 border-t border-border pt-3">
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                    Reference
                  </p>
                  <p className="mt-1 break-all font-mono text-xs text-foreground">
                    {referenceId}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void copyReference(referenceId)}
                  aria-label={`Copy reference for ${product.name}`}
                  title="Copy reference"
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-primary" aria-hidden="true" />
                  ) : (
                    <Copy className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            ) : null}

            {/* Kept mounted so repeated copies re-announce; the tick keeps the
                text unique so each copy within the window announces again. */}
            <p aria-live="polite" className="sr-only">
              {copied
                ? `Reference copied${copyTick > 1 ? ` (copy ${copyTick})` : ''}`
                : ''}
            </p>
          </div>
        ) : null}
      </div>

      {state === 'loading' ? (
        <FormSkeleton />
      ) : state === 'notFound' ? (
        <div className="card-luxury rounded-xl px-6 py-12 text-center">
          <span
            aria-hidden="true"
            className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/30"
          >
            <PackageSearch className="h-5 w-5 text-primary" />
          </span>
          <p className="mt-4 font-display text-xl text-foreground">
            Product not found
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            This product may have been deleted, or the link is incorrect.
          </p>
          <Link
            to="/admin/products"
            className="btn-outline-gold btn-outline-gold-hover mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm uppercase tracking-[0.12em]"
          >
            Back to products
          </Link>
        </div>
      ) : state === 'error' ? (
        <div
          role="alert"
          className="flex flex-col gap-4 rounded-xl border border-destructive/40 bg-destructive/10 p-5 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="min-w-0">
            <p className="font-medium text-foreground">
              Could not load this product
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{loadError}</p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void refetch()}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-destructive/50 px-4 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Retry
            </button>
            <Link
              to="/admin/products"
              className="btn-outline-gold btn-outline-gold-hover inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm"
            >
              Back to products
            </Link>
          </div>
        </div>
      ) : mapped ? (
        <div className="card-luxury w-full max-w-3xl rounded-xl p-5 sm:p-6">
          <AdminProductForm
            key={id}
            product={mapped}
            onSave={() => navigate('/admin/products', { replace: true })}
          />
        </div>
      ) : null}
    </div>
  )
}
