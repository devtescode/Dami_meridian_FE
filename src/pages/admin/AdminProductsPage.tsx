import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertCircle, Plus, Search } from 'lucide-react'
import Swal from 'sweetalert2'

import ProductTable from '@/components/admin/ProductTable'

import { useProductMutations } from '@/hooks/mutations/useProductMutations'
import { useProductListQuery } from '@/hooks/queries/useProductListQuery'
import { ApiError } from '@/lib/api'
import type { Product } from '@/types/product'

/** Shimmering stand-in for the table while the first load is in flight. */
function TableSkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((item) => (
        <div key={item} className="card-luxury flex items-start gap-3 p-4">
          <div
            aria-hidden="true"
            className="h-14 w-14 shrink-0 animate-pulse rounded-lg bg-surface-2"
          />
          <div className="min-w-0 flex-1 space-y-2">
            <div
              aria-hidden="true"
              className="h-4 w-2/3 animate-pulse rounded-lg bg-surface-2"
            />
            <div
              aria-hidden="true"
              className="h-3 w-1/3 animate-pulse rounded-lg bg-surface-2"
            />
            <div
              aria-hidden="true"
              className="h-5 w-24 animate-pulse rounded-lg bg-surface-2"
            />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function AdminProductsPage() {
  const navigate = useNavigate()
  const { products, isLoading, error, refetch } = useProductListQuery()
  const { removeProduct } = useProductMutations()

  const [isDeleting, setIsDeleting] = useState(false)
  // A ref, not just state: it is read synchronously at the top of the handler,
  // so a second click cannot slip through before the next render.
  const deleteInFlight = useRef(false)

  const showSkeleton = isLoading && products.length === 0
  // An empty list is only true when the request actually succeeded — during
  // an outage, ProductTable's "No products yet" empty state would be a lie.
  const hideContent = !isLoading && error !== null && products.length === 0

  const confirmAndDelete = async (product: Product) => {
    if (deleteInFlight.current) return

    const id = product._id ?? product.id
    if (!id) {
      await Swal.fire({
        icon: 'error',
        title: 'Cannot delete product',
        text: 'This product has no usable reference. Reload the page and try again.',
      })
      return
    }

    const result = await Swal.fire({
      title: 'Delete product?',
      // `text`, not `html`: the name comes from the backend and must be
      // rendered as data, never parsed as markup.
      text: `“${product.name}” will be permanently removed from the catalogue.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#ef4444',
      focusCancel: true,
    })

    if (!result.isConfirmed) return

    deleteInFlight.current = true
    setIsDeleting(true)
    try {
      // The mutation invalidates the product queries on success, so the
      // table refreshes on its own — no explicit refetch needed here.
      await removeProduct.mutateAsync(id)
      Swal.fire({
        icon: 'success',
        title: 'Deleted',
        text: 'Product deleted successfully.',
        timer: 1500,
        showConfirmButton: false,
      })
    } catch (err) {
      // The API client surfaces the backend's own wording through ApiError —
      // show it instead of a generic "something went wrong".
      Swal.fire({
        icon: 'error',
        title: 'Could not delete',
        text: err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Something went wrong. Please try again.',
      })
    } finally {
      deleteInFlight.current = false
      setIsDeleting(false)
    }
  }

  return (
    <div className="animate-fade-in-up space-y-6">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="eyebrow">Catalogue</p>
          <h1 className="mt-2 font-display text-3xl text-foreground sm:text-4xl">
            Products
          </h1>
          <div className="rule-gold mt-4 w-28" aria-hidden="true" />
          <p className="mt-4 max-w-xl text-sm text-muted-foreground">
            Search, edit and remove items from the store. Changes here are
            reflected on the storefront right away.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 sm:shrink-0 sm:justify-end">
          <Link
            to="/admin/products/new"
            className="btn-gold btn-gold-hover inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm uppercase tracking-[0.12em]"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add Product
          </Link>
          <Link
            to="/admin/products/lookup"
            title="Find a product by its Reference code"
            className="btn-outline-gold btn-outline-gold-hover inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm uppercase tracking-[0.12em]"
          >
            <Search className="h-4 w-4" aria-hidden="true" />
            Look up reference
          </Link>
        </div>
      </header>

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

      {showSkeleton ? (
        <div role="status">
          <span className="sr-only">Loading products…</span>
          <TableSkeleton />
        </div>
      ) : hideContent ? (
        <p className="rounded-xl border border-dashed border-border bg-surface/60 px-6 py-10 text-center text-sm text-muted-foreground">
          The catalogue could not be loaded. Use “Try again” above to retry.
        </p>
      ) : (
        <ProductTable
          products={products}
          onAdd={() => navigate('/admin/products/new')}
          onEdit={(product) => {
            // Records without a usable id have nowhere to navigate to.
            const id = product._id ?? product.id
            if (id) navigate(`/admin/products/${id}/edit`)
          }}
          onDelete={(product) => void confirmAndDelete(product)}
        />
      )}

      {isDeleting ? (
        <p role="status" className="text-sm text-muted-foreground">
          Deleting product…
        </p>
      ) : null}
    </div>
  )
}
