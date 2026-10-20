import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

import AdminProductForm from '@/components/admin/AdminProductForm'

import { COLLECTIONS } from '@/lib/collections'

/** Real collection names, listed straight from the shared configuration. */
const COLLECTION_NAMES = COLLECTIONS.map((collection) => collection.name).join(
  ', ',
)

export default function AdminAddProductPage() {
  const navigate = useNavigate()

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
          Add Product
        </h1>
        <div className="rule-gold mt-4 w-28" aria-hidden="true" />
        <p className="mt-4 max-w-xl text-sm text-muted-foreground">
          Publish a new item to the store. Choose the collection it belongs to —{' '}
          {COLLECTION_NAMES} — add its price, description and images, then save.
        </p>
      </div>

      <div className="card-luxury w-full max-w-3xl rounded-xl p-5 sm:p-6">
        <AdminProductForm
          onSave={() => navigate('/admin/products', { replace: true })}
        />
      </div>
    </div>
  )
}
