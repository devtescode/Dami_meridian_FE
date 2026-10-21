/**
 * Admin — Product Lookup.
 *
 * Fetches one product by its Reference (the MongoDB `_id`) through the shared
 * product query and renders the whole record: gallery, price, availability,
 * options and the copyable reference itself.
 *
 * The products table deep-links here as `?ref=<id>`; that value is pre-filled
 * into the form and looked up once on mount (guarded so a StrictMode
 * double-mount cannot fire the request twice).
 */

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  AlertCircle,
  ArrowLeft,
  Check,
  Copy,
  ImageOff,
  Loader2,
  RefreshCw,
  Search,
} from 'lucide-react'

import { useProductQuery } from '@/hooks/queries/useProductQuery'
import { availabilityLabel, availabilityPillClass } from '@/lib/availability'
import { formatNaira } from '@/lib/brand'
import { COLLECTIONS } from '@/lib/collections'
import { toImageArray } from '@/lib/productImages'

/** MongoDB ObjectId — 24 hex characters, mirroring `@/lib/api`'s own check. */
const OBJECT_ID_PATTERN = /^[0-9a-fA-F]{24}$/

/** Shown under the input whenever the typed value is not a usable reference. */
const REFERENCE_FORMAT_ERROR =
  'A reference is the 24-character code shown as Reference: … on a product (letters and numbers only).'

/** How long the copy button keeps its "Copied ✓" confirmation. */
const COPY_CONFIRM_MS = 2000

type LookupStatus = 'idle' | 'loading' | 'ready' | 'error'

interface LookupFailure {
  message: string
  /** HTTP status; 0 means the request never reached the server. */
  status: number
}

/**
 * Trims the input; when a whole product URL was pasted, silently pulls the
 * 24-character id out of its last path segment. Anything that still is not an
 * ObjectId is returned unchanged so the caller can report the format error.
 */
function normalizeReference(raw: string): string {
  const trimmed = raw.trim()
  if (OBJECT_ID_PATTERN.test(trimmed)) return trimmed

  const withoutQuery = trimmed.split(/[?#]/, 1)[0] ?? ''
  const segments = withoutQuery.split('/').filter(Boolean)
  const lastSegment = segments[segments.length - 1] ?? ''
  if (OBJECT_ID_PATTERN.test(lastSegment)) return lastSegment

  return trimmed
}

export default function AdminProductLookupPage() {
  const [searchParams] = useSearchParams()
  const refParam = searchParams.get('ref')

  const [query, setQuery] = useState('')
  const [inputError, setInputError] = useState<string | null>(null)
  /** The reference currently being fetched; also what Retry re-runs. */
  const [target, setTarget] = useState<string | null>(null)

  const {
    product,
    isError,
    isLoading,
    status: failureStatus,
    error: failureMessage,
    refetch,
  } = useProductQuery(target)

  const inputRef = useRef<HTMLInputElement>(null)
  /** The `?ref=` already acted on — a StrictMode double-mount must not repeat it. */
  const handledRefParam = useRef<string | null | undefined>(undefined)

  /**
   * The failure the API reported. The query hands back the message and the
   * HTTP status, so the screen can still tell "no such reference" (404) from
   * "the server could not be reached" (0).
   */
  const failure: LookupFailure | null = isError
    ? {
        message:
          failureMessage || 'Could not look up this reference. Please try again.',
        status: failureStatus,
      }
    : null

  /**
   * Which screen is on. A request that is still in flight shows the loading
   * skeleton again, so a retry never leaves a stale error on screen.
   */
  const status: LookupStatus =
    !target
      ? 'idle'
      : isError && !isLoading
        ? 'error'
        : product
          ? 'ready'
          : 'loading'

  /**
   * Validates, then starts a lookup. Returns false (and raises the inline
   * error) without touching the network when the value is not an ObjectId.
   */
  const startLookup = useCallback(
    (raw: string): boolean => {
      const reference = normalizeReference(raw)
      if (!OBJECT_ID_PATTERN.test(reference)) {
        // Show the rejected value in the box so the message points at something
        // visible — and never touch the network for it.
        setQuery(raw.trim())
        setInputError(REFERENCE_FORMAT_ERROR)
        return false
      }
      setInputError(null)
      setQuery(reference)
      // The same reference again does not change the query key, so the cached
      // query would not run again on its own: it is refetched explicitly.
      if (reference === target) refetch()
      setTarget(reference)
      return true
    },
    [target, refetch],
  )

  /** Deep link: pre-fill and auto-run exactly once per `?ref=` value.
   *
   *  A layout effect so the pre-filled input and loading state are what first
   *  paints — the idle explainer never flashes on a deep link. The ref guard
   *  makes it StrictMode-safe (mount → cleanup → mount runs it only once). */
  useLayoutEffect(() => {
    if (handledRefParam.current === refParam) return
    handledRefParam.current = refParam
    if (!refParam || refParam.trim() === '') return
    startLookup(refParam)
  }, [refParam, startLookup])

  /** Clears every layer and hands focus back to the input. */
  const resetLookup = useCallback(() => {
    setQuery('')
    setInputError(null)
    // With no target the query is dormant, so the previous result — and the
    // failure that came with it — is dropped along with it.
    setTarget(null)
    inputRef.current?.focus()
  }, [])

  const handleQueryChange = (event: ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value
    // A pasted product link unwraps silently as soon as it lands: keep the
    // extracted 24-hex id, otherwise leave exactly what was typed.
    const normalized = normalizeReference(raw)
    setQuery(
      normalized !== raw && OBJECT_ID_PATTERN.test(normalized)
        ? normalized
        : raw,
    )
    // The error clears as soon as the visitor starts fixing the value.
    if (inputError) setInputError(null)
  }

  const handleFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    startLookup(query)
  }

  const handleRetry = () => {
    // Same instant flip as startLookup — no stale error frame before loading.
    refetch()
  }

  /* ----------------------------- Copy reference ---------------------------- */

  const [copyTick, setCopyTick] = useState(0)
  const copied = copyTick > 0

  // Keyed on the tick so a repeat copy restarts the confirmation window.
  useEffect(() => {
    if (copyTick === 0) return
    const timer = window.setTimeout(() => setCopyTick(0), COPY_CONFIRM_MS)
    return () => window.clearTimeout(timer)
  }, [copyTick])

  const copyReference = async (value: string) => {
    let copiedOk = false

    // Insecure contexts (plain http) expose no `navigator.clipboard` at all.
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(value)
        copiedOk = true
      } catch {
        // Permission denied or the write failed — fall through to the legacy
        // path rather than throwing.
        copiedOk = false
      }
    }

    if (!copiedOk) {
      // Hidden textarea + deprecated execCommand for the fallback path.
      let textarea: HTMLTextAreaElement | null = null
      try {
        textarea = document.createElement('textarea')
        textarea.value = value
        textarea.setAttribute('readonly', '')
        textarea.style.position = 'fixed'
        textarea.style.top = '-9999px'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.select()
        copiedOk = document.execCommand('copy')
      } catch {
        copiedOk = false
      } finally {
        // Removed even when execCommand threw, so nothing leaks into the DOM.
        textarea?.remove()
      }
    }

    if (copiedOk) setCopyTick((value) => value + 1)
  }

  /* ------------------------------- Gallery -------------------------------- */

  const images = product ? toImageArray(product.imageURLs) : []
  const [imageIndex, setImageIndex] = useState(0)
  const [failedImages, setFailedImages] = useState<string[]>([])

  // A different result always opens a fresh gallery.
  const resultKey = product ? (product._id ?? product.name) : null
  useEffect(() => {
    setImageIndex(0)
    setFailedImages([])
  }, [resultKey])

  // Clamp so a shrinking gallery can never leave the index out of range.
  const activeIndex =
    images.length === 0 ? 0 : Math.min(imageIndex, images.length - 1)
  const currentImage = images[activeIndex]
  const hasMultipleImages = images.length > 1
  const imageFailed = currentImage ? failedImages.includes(currentImage) : true

  const markImageFailed = (src: string) => {
    setFailedImages((previous) =>
      previous.includes(src) ? previous : [...previous, src],
    )
  }

  /* ------------------------------ Result data ----------------------------- */

  const reference = product?._id
  const availability = product?.category?.trim()
  // Only a known collection id renders a label — nothing is inferred.
  const rawCollection = product?.collection?.trim().toLowerCase()
  const collection = rawCollection
    ? COLLECTIONS.find((item) => item.id === rawCollection)
    : undefined
  const formattedPrice = product ? formatNaira(product.price) : ''
  const sizes = (product?.sizes ?? []).filter((value) => Boolean(value?.trim()))
  const colors = (product?.colors ?? []).filter((value) => Boolean(value?.trim()))
  const descriptionParagraphs = (product?.description ?? '')
    .split(/\r?\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
  // Trimmed so a whitespace-only value never renders an empty line.
  const fragrance = product?.fragranceNotes?.trim()
  const volume = product?.volume?.trim()

  return (
    <div className="animate-fade-in-up space-y-6">
      {/* ------------------------------- Header ------------------------------ */}
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
          Product Lookup
        </h1>
        <div className="rule-gold mt-4 w-28" aria-hidden="true" />
        <p className="mt-4 max-w-xl text-sm text-muted-foreground">
          Fetch any product by its Reference code to see the full record —
          images, price, availability and options.
        </p>
      </div>

      {/* ---------------------------- Lookup form ---------------------------- */}
      <form
        noValidate
        onSubmit={handleFormSubmit}
        className="rounded-xl border border-border bg-surface/60 p-5 sm:p-6"
      >
        <label
          htmlFor="product-reference"
          className="text-xs uppercase tracking-[0.16em] text-muted-foreground"
        >
          Product reference
        </label>

        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <input
            ref={inputRef}
            id="product-reference"
            name="product-reference"
            type="text"
            value={query}
            onChange={handleQueryChange}
            autoComplete="off"
            spellCheck={false}
            placeholder="6ad734bdd711f71ea815a5fc"
            aria-invalid={inputError ? true : undefined}
            aria-describedby={
              inputError
                ? 'product-reference-hint product-reference-error'
                : 'product-reference-hint'
            }
            className="h-11 w-full min-w-0 flex-1 rounded-lg border border-border bg-surface-2 px-3 font-mono text-sm text-foreground placeholder:text-subtle transition-colors focus:border-primary/60"
          />
          <button
            type="submit"
            className="btn-gold btn-gold-hover inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg px-6 text-sm uppercase tracking-[0.12em]"
          >
            <Search className="h-4 w-4" aria-hidden="true" />
            Lookup
          </button>
        </div>

        <p id="product-reference-hint" className="mt-2 text-xs text-subtle">
          24 characters — letters and numbers only. Paste a product link and the
          code is picked out for you.
        </p>

        {inputError ? (
          <p
            id="product-reference-error"
            role="alert"
            className="mt-3 text-sm text-destructive"
          >
            {inputError}
          </p>
        ) : null}
      </form>

      {/* A result arriving is announced once; the region itself always
          exists (empty otherwise) so screen readers reliably report the
          text change. */}
      <p role="status" aria-live="polite" className="sr-only">
        {status === 'ready' && product
          ? `Loaded ${product.name}${formattedPrice ? `, ${formattedPrice}` : ''}.`
          : ''}
      </p>

      {/* ------------------------------- States ------------------------------ */}
      {status === 'idle' ? (
        <section className="card-luxury rounded-xl p-5 sm:p-6">
          <span
            aria-hidden="true"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/30"
          >
            <Search className="h-5 w-5 text-primary" />
          </span>

          <h2 className="mt-4 font-display text-xl text-foreground sm:text-2xl">
            What is a product reference?
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            It is the product&apos;s 24-character code — letters and numbers
            only, for example{' '}
            <span className="select-all font-mono text-xs text-foreground">
              6ad734bdd711f71ea815a5fc
            </span>
            . Enter one above to load that exact record.
          </p>

          <ul className="mt-4 space-y-2 border-t border-border pt-4 text-sm leading-relaxed text-muted-foreground">
            <li>
              On a product page it sits on the{' '}
              <span className="text-foreground">Reference:</span> line under the
              price.
            </li>
            <li>
              Copy it from a row in the{' '}
              <Link
                to="/admin/products"
                className="text-primary underline-offset-4 hover:underline"
              >
                Products table
              </Link>
              .
            </li>
            <li>
              Or read it under the product name on the Edit Product page.
            </li>
          </ul>
        </section>
      ) : status === 'loading' ? (
        <div role="status" className="card-luxury rounded-xl p-5 sm:p-6">
          <div className="flex items-center gap-2.5">
            <Loader2
              className="h-4 w-4 animate-spin text-primary"
              aria-hidden="true"
            />
            <p className="text-sm text-muted-foreground">
              Looking up reference…
            </p>
          </div>

          <div aria-hidden="true" className="mt-4 flex gap-4">
            <div className="aspect-[4/5] w-16 shrink-0 animate-pulse rounded-lg bg-surface-2" />
            <div className="min-w-0 flex-1 space-y-2.5">
              <div className="h-4 w-2/3 animate-pulse rounded-lg bg-surface-2" />
              <div className="h-3 w-1/3 animate-pulse rounded-lg bg-surface-2" />
              <div className="h-5 w-24 animate-pulse rounded-lg bg-surface-2" />
            </div>
          </div>
        </div>
      ) : failure ? (
        <div role="alert" className="card-luxury rounded-xl p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-destructive/10 ring-1 ring-destructive/30"
            >
              <AlertCircle className="h-5 w-5 text-destructive" />
            </span>
            <div className="min-w-0">
              <h2 className="font-display text-xl text-foreground sm:text-2xl">
                {failure.status === 404
                  ? 'No product with that reference'
                  : 'Could not look up that reference'}
              </h2>
              <p className="mt-2 break-words text-sm text-muted-foreground">
                {failure.message}
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            {failure.status === 0 ? (
              <button
                type="button"
                onClick={handleRetry}
                className="btn-gold btn-gold-hover inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-5 text-sm uppercase tracking-[0.12em]"
              >
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                Retry
              </button>
            ) : null}
            <button
              type="button"
              onClick={resetLookup}
              className="btn-outline-gold btn-outline-gold-hover inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-5 text-sm uppercase tracking-[0.12em]"
            >
              Look up another
            </button>
          </div>
        </div>
      ) : product ? (
        /* ------------------------------ Result ------------------------------ */
        <article className="card-luxury overflow-hidden rounded-xl">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* Gallery — first in the DOM, so it stacks above the details at 360px. */}
            <section
              aria-label="Product images"
              className="border-b border-border lg:border-b-0 lg:border-r"
            >
              <div className="relative aspect-[4/5] w-full overflow-hidden bg-surface-2">
                {!currentImage || imageFailed ? (
                  <div className="glass gold-hairline flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
                    <ImageOff
                      className="h-7 w-7 text-primary/70"
                      aria-hidden="true"
                    />
                    <span className="text-[11px] uppercase tracking-[0.2em]">
                      No image
                    </span>
                  </div>
                ) : (
                  <img
                    key={`${activeIndex}-${currentImage}`}
                    src={currentImage}
                    alt={`${product.name} — image ${activeIndex + 1} of ${images.length}`}
                    onError={() => markImageFailed(currentImage)}
                    className="h-full w-full object-cover"
                  />
                )}

                {hasMultipleImages ? (
                  <div className="absolute bottom-3 right-3 rounded-full border border-border bg-background/80 px-3 py-1 text-xs tabular-nums text-foreground backdrop-blur">
                    {activeIndex + 1} / {images.length}
                  </div>
                ) : null}
              </div>

              {hasMultipleImages ? (
                <div className="scrollbar-slim flex gap-2 overflow-x-auto p-3">
                  {images.map((url, index) => {
                    const isActive = index === activeIndex
                    return (
                      <button
                        key={`${url}-${index}`}
                        type="button"
                        onClick={() => setImageIndex(index)}
                        aria-label={`Show image ${index + 1} of ${images.length}`}
                        aria-current={isActive ? 'true' : undefined}
                        className={`h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
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
                          onError={() => markImageFailed(url)}
                          className="h-full w-full object-cover"
                        />
                      </button>
                    )
                  })}
                </div>
              ) : null}
            </section>

            {/* Details */}
            <div className="p-5 sm:p-6">
              <h2 className="break-words font-display text-2xl text-foreground sm:text-3xl">
                {product.name}
              </h2>

              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
                {collection ? (
                  <span className="text-[11px] uppercase tracking-[0.16em] text-primary">
                    {collection.name}
                  </span>
                ) : null}
                {availability ? (
                  <span
                    className={`inline-flex items-center whitespace-nowrap rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-[0.12em] ${availabilityPillClass(
                      product.category,
                    )}`}
                  >
                    {availabilityLabel(product.category)}
                  </span>
                ) : null}
              </div>

              {formattedPrice ? (
                <p className="mt-3 font-display text-2xl text-primary sm:text-3xl">
                  {formattedPrice}
                </p>
              ) : (
                <p className="mt-3 text-sm italic text-muted-foreground">
                  Price on request
                </p>
              )}

              <div className="rule-gold mt-4" aria-hidden="true" />

              {reference ? (
                <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                      Reference
                    </p>
                    <p className="mt-1 select-all break-all font-mono text-xs text-foreground">
                      {reference}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void copyReference(reference)}
                    className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg border border-border px-4 text-xs uppercase tracking-[0.1em] text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-primary" aria-hidden="true" />
                    ) : (
                      <Copy className="h-4 w-4" aria-hidden="true" />
                    )}
                    <span aria-live="polite">
                      {copied ? (
                        <>
                          Copied ✓
                          {/* Hidden tail keeps the live text changing so a
                              repeat copy inside the same window re-announces. */}
                          {copyTick > 1 ? (
                            <span className="sr-only"> (copy {copyTick})</span>
                          ) : null}
                        </>
                      ) : (
                        'Copy reference'
                      )}
                    </span>
                  </button>
                </div>
              ) : null}

              {descriptionParagraphs.length > 0 ? (
                <div className="mt-5 border-t border-border pt-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                    Description
                  </p>
                  <div className="mt-2 space-y-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                    {descriptionParagraphs.map((paragraph, index) => (
                      <p key={`${index}-${paragraph}`}>{paragraph}</p>
                    ))}
                  </div>
                </div>
              ) : null}

              {sizes.length > 0 ? (
                <div className="mt-5 border-t border-border pt-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                    Sizes
                  </p>
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {sizes.map((size) => (
                      <li
                        key={size}
                        className="inline-flex items-center rounded-full border border-border bg-surface-2 px-3 py-1.5 text-xs text-foreground"
                      >
                        {size}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {colors.length > 0 ? (
                <div className="mt-5 border-t border-border pt-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                    Colours
                  </p>
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {colors.map((color) => (
                      <li
                        key={color}
                        className="inline-flex items-center rounded-full border border-border bg-surface-2 px-3 py-1.5 text-xs text-foreground"
                      >
                        {color}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {fragrance || volume ? (
                <div className="glass-gold mt-5 rounded-xl p-4">
                  <p className="eyebrow">Fragrance</p>
                  {fragrance ? (
                    <p className="mt-2 text-sm text-foreground">{fragrance}</p>
                  ) : null}
                  {volume ? (
                    <p className="mt-1 text-sm text-muted-foreground">
                      Volume: {volume}
                    </p>
                  ) : null}
                </div>
              ) : null}

              <div className="mt-6 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:flex-wrap">
                {reference ? (
                  <>
                    <Link
                      to={`/admin/products/${reference}/edit`}
                      className="btn-gold btn-gold-hover inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg px-5 text-sm uppercase tracking-[0.12em] sm:w-auto"
                    >
                      Edit product
                    </Link>
                    <Link
                      to={`/products/${reference}`}
                      className="btn-outline-gold btn-outline-gold-hover inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg px-5 text-sm uppercase tracking-[0.12em] sm:w-auto"
                    >
                      View storefront page
                    </Link>
                  </>
                ) : null}
                <button
                  type="button"
                  onClick={resetLookup}
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-border px-5 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary sm:w-auto"
                >
                  Look up another
                </button>
              </div>
            </div>
          </div>
        </article>
      ) : null}
    </div>
  )
}
