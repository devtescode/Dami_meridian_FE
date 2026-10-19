import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, Menu, Plus, RefreshCw, X } from 'lucide-react'
import Swal from 'sweetalert2'

import AdminSidebar, { type AdminSection } from '@/components/admin/AdminSidebar'
import AdminProductForm from '@/components/admin/AdminProductForm'
import InventorySummary from '@/components/admin/InventorySummary'
import ProductTable from '@/components/admin/ProductTable'
import ChangePasswordForm from '@/components/admin/ChangePasswordForm'

import { deleteProduct } from '@/lib/api'
import { BRAND } from '@/lib/brand'
import { toImageArray } from '@/lib/productImages'
import { useProducts } from '@/hooks/useProducts'
import type { AdminFormProduct, Product } from '@/types/product'

interface AdminDashboardProps {
  onLogout: () => void
}

/** Maps a catalogue product onto the shape the edit form expects. */
function toFormProduct(product: Product): AdminFormProduct {
  return {
    name: product.name,
    price: String(product.price),
    images: toImageArray(product.imageURLs),
    description: product.description ?? '',
    availability: product.category ?? 'In Stock',
    collection: product.collection ?? 'jewellery',
    sizes: product.sizes ?? [],
    colors: product.colors ?? [],
    fragranceNotes: product.fragranceNotes ?? '',
    volume: product.volume ?? '',
    id: product._id,
  }
}

export default function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const { products, isLoading, error, refetch } = useProducts()

  const [activeSection, setActiveSection] = useState<AdminSection>('dashboard')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<AdminFormProduct | null>(
    null,
  )
  const [isDeleting, setIsDeleting] = useState(false)
  const drawerToggleRef = useRef<HTMLButtonElement>(null)

  const closeDrawer = useCallback(() => setDrawerOpen(false), [])

  /**
   * Focus the trigger before opening so the drawer always has an element to
   * hand focus back to when it closes.
   */
  const openDrawer = useCallback(() => {
    drawerToggleRef.current?.focus()
    setDrawerOpen(true)
  }, [])

  // Escape closes the off-canvas drawer, mirroring the sidebar's own behaviour.
  useEffect(() => {
    if (!drawerOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeDrawer()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [drawerOpen, closeDrawer])

  const openAddForm = () => {
    setEditingProduct(null)
    setFormOpen(true)
    setActiveSection('products')
  }

  const openEditForm = (product: Product) => {
    setEditingProduct(toFormProduct(product))
    setFormOpen(true)
    setActiveSection('products')
  }

  const closeForm = () => {
    setFormOpen(false)
    setEditingProduct(null)
  }

  /** Called by the form once the backend has accepted the product. */
  const handleSaveProduct = () => {
    closeForm()
    void refetch()
  }

  const handleDeleteProduct = async (product: Product) => {
    const result = await Swal.fire({
      title: 'Delete product?',
      html: `<strong>${product.name}</strong> will be permanently removed from the catalogue.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#d33',
      focusCancel: true,
    })

    if (!result.isConfirmed) return
    if (!product._id) return

    setIsDeleting(true)
    try {
      await deleteProduct(product._id)
      await refetch()
      Swal.fire({
        icon: 'success',
        title: 'Deleted',
        text: 'Product deleted successfully.',
        timer: 1500,
        showConfirmButton: false,
      })
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Could not delete',
        text:
          err instanceof Error
            ? err.message
            : 'Something went wrong. Please try again.',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleLogout = () => {
    setDrawerOpen(false)
    onLogout()
  }

  const heading: Record<AdminSection, string> = {
    dashboard: 'Dashboard',
    products: 'Products',
    settings: 'Settings',
    password: 'Change Password',
  }

  return (
    <div className="min-h-screen bg-background lg:flex">
      <AdminSidebar
        active={activeSection}
        onSelect={(section) => {
          setActiveSection(section)
          setDrawerOpen(false)
        }}
        onLogout={handleLogout}
        isOpen={drawerOpen}
        onClose={closeDrawer}
      />

      <div className="min-w-0 flex-1">
        {/* Top bar — the sidebar becomes a drawer below `lg` */}
        <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-md">
          <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                ref={drawerToggleRef}
                type="button"
                onClick={openDrawer}
                className="-ml-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-surface lg:hidden"
                aria-label="Open admin menu"
                aria-expanded={drawerOpen}
                aria-controls="admin-drawer"
              >
                <Menu size={22} aria-hidden="true" />
              </button>

              <div className="min-w-0">
                <h1 className="truncate font-display text-2xl text-foreground sm:text-3xl">
                  {BRAND.name}
                </h1>
                <p className="truncate text-sm text-muted-foreground">
                  Admin · {heading[activeSection]}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <Link
                to="/"
                className="hidden rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary sm:inline-flex"
              >
                View store
              </Link>
              <button
                type="button"
                onClick={() => void refetch()}
                disabled={isLoading}
                className="flex h-11 w-11 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary disabled:opacity-50"
                aria-label="Refresh products"
              >
                <RefreshCw
                  size={18}
                  aria-hidden="true"
                  className={isLoading ? 'animate-spin' : undefined}
                />
              </button>
            </div>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          {error && (
            <div
              role="alert"
              className="mb-6 flex flex-col gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4 sm:flex-row sm:items-center sm:justify-between"
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
                className="shrink-0 rounded-lg border border-destructive/50 px-4 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
              >
                Try again
              </button>
            </div>
          )}

          {activeSection === 'dashboard' && (
            <div className="space-y-8">
              <InventorySummary products={products} />

              <section>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="font-display text-2xl text-foreground">
                    Recently added
                  </h2>
                  <button
                    type="button"
                    onClick={openAddForm}
                    className="btn-gold btn-gold-hover inline-flex min-h-11 items-center gap-2 rounded-lg px-5 text-sm font-medium"
                  >
                    <Plus size={18} aria-hidden="true" />
                    Add product
                  </button>
                </div>

                {isLoading ? (
                  <p className="text-sm text-muted-foreground">Loading products…</p>
                ) : products.length === 0 ? (
                  <p className="rounded-xl border border-border bg-surface p-6 text-sm text-muted-foreground">
                    No products yet. Use “Add product” to publish your first
                    item.
                  </p>
                ) : (
                  // `grid-cols-1` keeps the track at minmax(0, 1fr) so the
                  // truncated product name can never widen the card.
                  <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {products.slice(0, 6).map((product) => (
                      <li
                        key={product._id ?? product.id ?? product.name}
                        className="card-luxury card-luxury-hover flex min-w-0 items-center gap-3 rounded-xl p-3"
                      >
                        <span className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-surface-2">
                          {toImageArray(product.imageURLs)[0] ? (
                            <img
                              src={toImageArray(product.imageURLs)[0]}
                              alt={product.name}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          ) : null}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-foreground">
                            {product.name}
                          </span>
                          <span className="block text-xs text-muted-foreground">
                            {product.category ?? 'In Stock'}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          )}

          {activeSection === 'products' && (
            <div className="space-y-6">
              {formOpen && (
                <section className="rounded-xl border border-border bg-surface p-5 sm:p-6">
                  <div className="mb-5 flex items-start justify-between gap-4">
                    <h2 className="font-display text-2xl text-foreground">
                      {editingProduct ? 'Edit product' : 'Add product'}
                    </h2>
                    <button
                      type="button"
                      onClick={closeForm}
                      className="-mr-1 -mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground"
                      aria-label="Close product form"
                    >
                      <X size={20} aria-hidden="true" />
                    </button>
                  </div>

                  <AdminProductForm
                    key={editingProduct?.id ?? 'new'}
                    product={editingProduct}
                    onSave={handleSaveProduct}
                  />
                </section>
              )}

              <ProductTable
                products={products}
                onEdit={openEditForm}
                onDelete={(product) => void handleDeleteProduct(product)}
                onAdd={openAddForm}
              />

              {isDeleting && (
                <p className="text-sm text-muted-foreground" role="status">
                  Deleting product…
                </p>
              )}
            </div>
          )}

          {(activeSection === 'settings' || activeSection === 'password') && (
            <ChangePasswordForm />
          )}
        </main>
      </div>
    </div>
  )
}
