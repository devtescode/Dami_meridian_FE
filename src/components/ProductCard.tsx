import { ImageOff, MessageCircle } from 'lucide-react'
import WhatsAppOrderButton from '@/components/WhatsAppOrderButton'
import { availabilityLabel, availabilityPillClass } from '@/lib/availability'
import { formatNaira } from '@/lib/brand'
import { getCollectionName } from '@/lib/collections'
import { getPrimaryImage, toImageArray } from '@/lib/productImages'
import type { Product } from '@/types/product'

/**
 * Prices arrive from the API as strings that may already contain currency
 * symbols or separators. Anything we cannot read as a number is presented as
 * "Price on request" rather than a broken "₦NaN".
 */
function priceLabel(price: string | number): string {
  const raw = typeof price === 'number' ? String(price) : String(price).trim()
  if (!raw) return 'Price on request'

  const digits = raw.replace(/[^\d.]/g, '')
  if (!digits) return 'Price on request'

  const numeric = Number(digits)
  if (!Number.isFinite(numeric)) return 'Price on request'

  return formatNaira(numeric)
}

export default function ProductCard({
  product,
  onViewMore,
}: {
  product: Product
  onViewMore: () => void
}) {
  const images = toImageArray(product.imageURLs)
  const primaryImage = getPrimaryImage(product.imageURLs)
  const extraImages = images.length - 1

  const collectionName = getCollectionName(product.collection)
  const availability = product.category ? product.category.trim() : ''
  const pill = availability
    ? {
        label: availabilityLabel(availability),
        className: availabilityPillClass(availability),
      }
    : null
  const price = priceLabel(product.price)
  const hasPrice = price !== 'Price on request'

  return (
    <article className="card-luxury card-luxury-hover group flex h-full flex-col overflow-hidden rounded-2xl">
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-surface-2">
        {primaryImage ? (
          <img
            src={primaryImage}
            alt={product.name}
            loading="lazy"
            decoding="async"
            onError={(event) => {
              // A dead URL from the media host must not leave the browser's
              // broken-image glyph inside the frame.
              event.currentTarget.style.display = 'none'
            }}
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          />
        ) : (
          // Never render a broken <img> — fall back to a branded placeholder.
          <div className="glass gold-hairline flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <ImageOff className="h-7 w-7 text-primary/70" aria-hidden="true" />
            <span className="text-[11px] uppercase tracking-[0.2em]">No image</span>
          </div>
        )}

        {/* Kept in the top-left so it can never sit under the action buttons. */}
        {extraImages > 0 && (
          <span className="absolute left-3 top-3 inline-flex items-center rounded-full border border-primary/30 bg-background/75 px-2.5 py-1 text-[11px] font-medium tracking-[0.08em] text-gold-light backdrop-blur-sm">
            +{extraImages}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="text-[11px] uppercase tracking-[0.16em] text-primary">
            {collectionName}
          </span>
          {pill && (
            <span
              className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] ${pill.className}`}
            >
              {pill.label}
            </span>
          )}
        </div>

        <h3 className="line-clamp-2 break-words font-display text-xl leading-snug text-foreground sm:text-2xl">
          {product.name}
        </h3>

        {hasPrice ? (
          <p className="font-display text-2xl leading-none text-primary">
            {price}
          </p>
        ) : (
          <p className="text-sm italic text-muted-foreground">Price on request</p>
        )}

        {/* Stacked full-width so the long WhatsApp label never overflows the card. */}
        <div className="mt-auto flex flex-col gap-2 pt-2">
          <button
            type="button"
            onClick={onViewMore}
            aria-label={`View details for ${product.name}`}
            className="btn-outline-gold btn-outline-gold-hover inline-flex min-h-[44px] w-full items-center justify-center rounded-lg px-4 text-xs font-medium uppercase tracking-[0.12em]"
          >
            View Details
          </button>

          <WhatsAppOrderButton
            product={product}
            orderOptions={{
              imageUrl: primaryImage,
              imageIndex: 0,
              totalImages: images.length,
              // Without a reference the store cannot tell which order this
              // message refers to, especially for a repeated product name.
              reference:
                product._id ??
                (product.id !== undefined ? String(product.id) : product.name),
            }}
            // emerald-700 keeps the WhatsApp green but puts white at 5.36:1 on
            // the button, which the 12px label needs. The hover state is
            // darker, never lighter, so it can never fall below the bar.
            className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 text-xs font-medium uppercase tracking-[0.12em] text-white transition-colors duration-300 hover:bg-emerald-800"
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            <span>Order on WhatsApp</span>
            <span className="sr-only">({product.name})</span>
          </WhatsAppOrderButton>
        </div>
      </div>
    </article>
  )
}
