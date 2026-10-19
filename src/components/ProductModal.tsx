import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, ImageOff, X } from 'lucide-react'
import { FaWhatsapp } from 'react-icons/fa'
import WhatsAppOrderButton from '@/components/WhatsAppOrderButton'
import { formatNaira } from '@/lib/brand'
import { availabilityPillClass } from '@/lib/availability'
import { getCollectionName } from '@/lib/collections'
import { toImageArray } from '@/lib/productImages'
import type { ProductOrderOptions } from '@/lib/whatsapp'
import type { Product } from '@/types/product'

/**
 * Availability pill styling lives in @/lib/availability so the card, the
 * modal, the admin table and the inventory counters cannot drift apart.
 */

/** Matches hex values so colours can be previewed as swatches. */
const HEX_COLOR_PATTERN = /^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

/** Visible, non-disabled elements that can receive keyboard focus. */
function getFocusableElements(root: HTMLElement): HTMLElement[] {
  return Array.from(
    root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
  ).filter(
    (element) =>
      element.getClientRects().length > 0 &&
      element.getAttribute('aria-hidden') !== 'true',
  )
}

function isHexColor(value: string): boolean {
  return HEX_COLOR_PATTERN.test(value.trim())
}

export default function ProductModal({
  product,
  onClose,
}: {
  product: Product
  onClose: () => void
}) {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const restoreFocusRef = useRef<HTMLElement | null>(null)

  const images = useMemo(
    () => toImageArray(product.imageURLs),
    [product.imageURLs],
  )
  const availableSizes = useMemo(
    () => (product.sizes ?? []).filter(Boolean),
    [product.sizes],
  )
  const availableColors = useMemo(
    () => (product.colors ?? []).filter(Boolean),
    [product.colors],
  )

  const [imageIndex, setImageIndex] = useState(0)
  const [sizeChoice, setSizeChoice] = useState<string | null>(null)
  const [colorChoice, setColorChoice] = useState<string | null>(null)
  const [failedImages, setFailedImages] = useState<string[]>([])

  const productKey =
    product._id ?? (product.id !== undefined ? String(product.id) : product.name)

  // A different product means a fresh set of options — reset the local picks.
  useEffect(() => {
    setImageIndex(0)
    setSizeChoice(null)
    setColorChoice(null)
    setFailedImages([])
  }, [productKey])

  // Clamp so a shrinking gallery can never leave the index out of range.
  const activeIndex =
    images.length === 0 ? 0 : Math.min(imageIndex, images.length - 1)
  const currentImage = images[activeIndex]
  const hasMultipleImages = images.length > 1

  // Fall back to the first option whenever the current pick is not valid.
  const selectedSize: string | undefined =
    sizeChoice && availableSizes.includes(sizeChoice)
      ? sizeChoice
      : availableSizes.length > 0
        ? availableSizes[0]
        : undefined
  const selectedColor: string | undefined =
    colorChoice && availableColors.includes(colorChoice)
      ? colorChoice
      : availableColors.length > 0
        ? availableColors[0]
        : undefined

  const collectionName = getCollectionName(product.collection)

  const formattedPrice = formatNaira(product.price)
  const priceLabel =
    !formattedPrice || formattedPrice.includes('NaN')
      ? 'Price on request'
      : formattedPrice

  const availabilityClass = availabilityPillClass(product.category)

  const orderOptions: ProductOrderOptions = {
    imageUrl: currentImage,
    imageIndex: activeIndex,
    totalImages: images.length,
    reference:
      product._id ??
      (product.id !== undefined ? String(product.id) : product.name),
    // Only forward options the product actually offers.
    ...(selectedSize ? { size: selectedSize } : {}),
    ...(selectedColor ? { color: selectedColor } : {}),
  }

  // Focus the close button on open and hand focus back on close.
  useEffect(() => {
    const active = document.activeElement
    restoreFocusRef.current = active instanceof HTMLElement ? active : null
    closeButtonRef.current?.focus()

    return () => {
      restoreFocusRef.current?.focus()
    }
  }, [])

  // Escape closes; Tab is trapped inside the panel.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }

      if (event.key !== 'Tab') return

      const panel = panelRef.current
      if (!panel) return

      const focusable = getFocusableElements(panel)
      if (focusable.length === 0) {
        event.preventDefault()
        panel.focus()
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const current = document.activeElement

      if (event.shiftKey) {
        if (current === first || !panel.contains(current)) {
          event.preventDefault()
          last.focus()
        }
      } else if (current === last || !panel.contains(current)) {
        event.preventDefault()
        first.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  // Stop the page behind the modal from scrolling.
  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [])

  const goToImage = (index: number) => {
    if (!hasMultipleImages) return
    const next = (index + images.length) % images.length
    setImageIndex(next)
  }

  const handleImageError = (src: string) => {
    setFailedImages((previous) =>
      previous.includes(src) ? previous : [...previous, src],
    )
  }

  const imageUnavailable =
    images.length === 0 || (currentImage ? failedImages.includes(currentImage) : true)

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-background/85 backdrop-blur-md sm:items-center sm:p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-[92dvh] w-full max-w-6xl flex-col overflow-hidden rounded-t-2xl border border-border bg-surface shadow-2xl outline-none animate-fade-in-up sm:rounded-2xl"
      >
        <header className="sticky top-0 z-20 flex shrink-0 items-center justify-between gap-3 border-b border-border bg-surface/95 px-4 py-3 backdrop-blur sm:px-6">
          <p className="min-w-0 truncate font-display text-base text-foreground sm:text-lg">
            {product.name}
          </p>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close product details"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain scrollbar-slim">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* ---------------- Gallery ---------------- */}
            <section
              aria-label="Product images"
              className="self-start lg:sticky lg:top-0"
            >
              <div className="relative aspect-square w-full overflow-hidden bg-secondary max-h-[62vh]">
                {imageUnavailable ? (
                  <div className="glass flex h-full w-full flex-col items-center justify-center gap-3 text-muted-foreground">
                    <ImageOff size={34} className="text-subtle" aria-hidden="true" />
                    <p className="text-sm">No image available</p>
                  </div>
                ) : (
                  <img
                    key={`${activeIndex}-${currentImage}`}
                    src={currentImage}
                    alt={`${product.name} — image ${activeIndex + 1} of ${images.length}`}
                    onError={() => handleImageError(currentImage)}
                    className="h-full w-full object-cover animate-fade-in"
                  />
                )}

                {hasMultipleImages && (
                  <>
                    <button
                      type="button"
                      onClick={() => goToImage(activeIndex - 1)}
                      aria-label="Previous image"
                      className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/80 text-foreground backdrop-blur transition-colors hover:border-primary hover:text-primary"
                    >
                      <ChevronLeft size={20} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => goToImage(activeIndex + 1)}
                      aria-label="Next image"
                      className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/80 text-foreground backdrop-blur transition-colors hover:border-primary hover:text-primary"
                    >
                      <ChevronRight size={20} aria-hidden="true" />
                    </button>
                    <div className="absolute bottom-3 right-3 rounded-full border border-border bg-background/80 px-3 py-1 text-xs tabular-nums text-foreground backdrop-blur">
                      {activeIndex + 1} / {images.length}
                    </div>
                  </>
                )}
              </div>

              {hasMultipleImages && (
                <div className="flex gap-2 overflow-x-auto p-4 scrollbar-slim">
                  {images.map((url, index) => {
                    const isActive = index === activeIndex
                    return (
                      <button
                        key={`${url}-${index}`}
                        type="button"
                        onClick={() => goToImage(index)}
                        aria-label={`Show image ${index + 1} of ${images.length}`}
                        aria-current={isActive ? 'true' : undefined}
                        className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                          isActive
                            ? 'border-primary opacity-100'
                            : 'border-border opacity-60 hover:border-primary/60 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={url}
                          alt=""
                          aria-hidden="true"
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      </button>
                    )
                  })}
                </div>
              )}
            </section>

            {/* ---------------- Details ---------------- */}
            <div className="flex flex-col gap-6 px-5 py-6 sm:px-7 sm:py-8 lg:px-8">
              <div>
                <p className="eyebrow">{collectionName}</p>
                <h2
                  id={titleId}
                  className="mt-2 font-display text-3xl leading-tight text-gradient-soft sm:text-4xl lg:text-5xl"
                >
                  {product.name}
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <p className="font-display text-2xl text-primary sm:text-3xl">
                  {priceLabel}
                </p>
                {product.category && (
                  <span
                    className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-[0.14em] ${availabilityClass}`}
                  >
                    {product.category}
                  </span>
                )}
              </div>

              <div className="rule-gold" aria-hidden="true" />

              {product.description && (
                <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                  {product.description}
                </p>
              )}

              {availableSizes.length > 0 && (
                <fieldset>
                  <legend className="eyebrow mb-3">Size</legend>
                  <div className="flex flex-wrap gap-2">
                    {availableSizes.map((size) => {
                      const isActive = size === selectedSize
                      return (
                        <button
                          key={size}
                          type="button"
                          onClick={() => setSizeChoice(size)}
                          aria-pressed={isActive}
                          className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border px-4 text-sm transition-colors ${
                            isActive
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-border bg-surface-2 text-muted-foreground hover:border-primary/60 hover:text-foreground'
                          }`}
                        >
                          {size}
                        </button>
                      )
                    })}
                  </div>
                </fieldset>
              )}

              {availableColors.length > 0 && (
                <fieldset>
                  <legend className="eyebrow mb-3">Colour</legend>
                  <div className="flex flex-wrap gap-2">
                    {availableColors.map((color) => {
                      const isActive = color === selectedColor
                      return (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setColorChoice(color)}
                          aria-pressed={isActive}
                          className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full border px-4 text-sm transition-colors ${
                            isActive
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-border bg-surface-2 text-muted-foreground hover:border-primary/60 hover:text-foreground'
                          }`}
                        >
                          {isHexColor(color) && (
                            <span
                              aria-hidden="true"
                              className="h-4 w-4 shrink-0 rounded-full border border-white/25"
                              style={{ backgroundColor: color }}
                            />
                          )}
                          {color}
                        </button>
                      )
                    })}
                  </div>
                </fieldset>
              )}

              {(product.fragranceNotes || product.volume) && (
                <div className="glass-gold rounded-xl p-4">
                  <p className="eyebrow">Fragrance</p>
                  {product.fragranceNotes && (
                    <p className="mt-2 text-sm text-foreground">
                      {product.fragranceNotes}
                    </p>
                  )}
                  {product.volume && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      Volume: {product.volume}
                    </p>
                  )}
                </div>
              )}

              <div className="mt-auto flex flex-col gap-3 pt-2">
                <WhatsAppOrderButton
                  product={product}
                  orderOptions={orderOptions}
                  className="btn-gold btn-gold-hover flex min-h-13 w-full items-center justify-center gap-2 rounded-full px-6 py-4 text-sm font-medium uppercase tracking-[0.16em]"
                >
                  <FaWhatsapp size={18} aria-hidden="true" />
                  Order on WhatsApp
                </WhatsAppOrderButton>
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-outline-gold btn-outline-gold-hover flex min-h-13 w-full items-center justify-center rounded-full px-6 py-4 text-sm font-medium uppercase tracking-[0.16em]"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
