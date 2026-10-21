import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent, DragEvent, FormEvent } from 'react'
import { ChevronDown, CircleAlert, ImagePlus, LoaderCircle, Trash2, X } from 'lucide-react'
import Swal from 'sweetalert2'

import { useProductMutations } from '@/hooks/mutations/useProductMutations'
import { ApiError } from '@/lib/api'
import { COLLECTIONS } from '@/lib/collections'
import type { CollectionId } from '@/lib/collections'
import { cn } from '@/lib/utils'
import { AVAILABILITIES } from '@/types/product'
import type { AdminFormProduct, Availability } from '@/types/product'

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/jpg']
const MAX_SIZE_BYTES = 5 * 1024 * 1024
const MAX_SIZE_MB = MAX_SIZE_BYTES / (1024 * 1024)

const FIELD_BASE =
  'w-full min-h-11 rounded-lg border border-border bg-input py-2.5 text-foreground placeholder:text-subtle transition-colors focus:border-primary'

const LABEL_CLASS = 'mb-2 block text-sm font-medium text-foreground'
const HINT_CLASS = 'mt-2 text-xs text-muted-foreground'
const ERROR_CLASS = 'mt-2 flex items-start gap-1.5 text-sm text-destructive'

/** Order in which invalid fields take focus after a failed submit. */
const FOCUS_ORDER = ['name', 'price', 'description', 'images'] as const

type FocusTarget = (typeof FOCUS_ORDER)[number]

interface FieldErrorProps {
  /** Stable id — the owning field points `aria-describedby` at it. */
  id: string
  message?: string
}

/**
 * The message element stays mounted for the whole life of the form: a live
 * region only announces text that is *added* to it, so a conditionally
 * rendered paragraph can be silent in several screen readers. An empty
 * region is inert and stays visually hidden, so nothing shifts.
 */
function FieldError({ id, message }: FieldErrorProps) {
  return (
    <p id={id} role="alert" className={message ? ERROR_CLASS : 'sr-only'}>
      {message ? (
        <>
          <CircleAlert
            size={16}
            className="mt-0.5 shrink-0"
            aria-hidden="true"
          />
          {message}
        </>
      ) : null}
    </p>
  )
}

/** Stable React key for a preview tile (file identity or the saved URL). */
function imageKey(img: File | string, idx: number): string {
  if (typeof img === 'string') return img
  return `${img.name}-${img.size}-${img.lastModified}-${idx}`
}

/** Splits "S, M, L" into a clean array; empty when nothing was entered. */
function parseList(value: string): string[] | undefined {
  const items = value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
  return items.length > 0 ? items : undefined
}

interface FormState {
  name: string
  price: string
  description: string
  availability: Availability
  collection: CollectionId
  sizes: string
  colors: string
  fragranceNotes: string
  volume: string
}

type FieldErrors = Partial<
  Record<'name' | 'price' | 'description' | 'images', string>
>

const EMPTY_FORM: FormState = {
  name: '',
  price: '',
  description: '',
  availability: 'In Stock',
  collection: 'jewellery',
  sizes: '',
  colors: '',
  fragranceNotes: '',
  volume: '',
}

/** Seeds the form from the product being edited (or a blank product). */
function productToForm(product?: AdminFormProduct | null): FormState {
  if (!product) return EMPTY_FORM

  const collection = COLLECTIONS.some((item) => item.id === product.collection)
    ? (product.collection as CollectionId)
    : 'jewellery'

  const availability = AVAILABILITIES.includes(
    product.availability as Availability,
  )
    ? (product.availability as Availability)
    : 'In Stock'

  return {
    name: product.name ?? '',
    price: product.price != null ? String(product.price) : '',
    description: product.description ?? '',
    availability,
    collection,
    sizes: product.sizes?.join(', ') ?? '',
    colors: product.colors?.join(', ') ?? '',
    fragranceNotes: product.fragranceNotes ?? '',
    volume: product.volume ?? '',
  }
}

export default function AdminProductForm({
  product,
  onSave,
}: {
  product?: AdminFormProduct | null
  onSave: () => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)
  const priceRef = useRef<HTMLInputElement>(null)
  const descriptionRef = useRef<HTMLTextAreaElement>(null)

  const { createProduct, updateProduct } = useProductMutations()

  const [form, setForm] = useState<FormState>(() => productToForm(product))
  const [images, setImages] = useState<(string | File)[]>(() =>
    product?.images ? [...product.images] : [],
  )
  const [errors, setErrors] = useState<FieldErrors>({})
  const [isDragging, setIsDragging] = useState(false)
  const [previewUrls, setPreviewUrls] = useState<Map<File, string>>(
    () => new Map(),
  )
  const objectUrls = useRef<Map<File, string>>(new Map())

  // Bumped on every failed submit to trigger the focus effect; the field to
  // focus is kept in a ref so typing never moves the caret on its own.
  const [focusRequest, setFocusRequest] = useState(0)
  const focusTargetRef = useRef<FocusTarget | null>(null)

  const editingId = product?.id
  const isEdit = Boolean(editingId)
  // The save button follows the mutation that is actually running, so the
  // form never shows a spinner for a write that is not in flight.
  const isSaving = isEdit ? updateProduct.isPending : createProduct.isPending

  // Re-seed only when the product identity changes. Depending on the whole
  // object would wipe in-progress edits every time the parent re-renders.
  useEffect(() => {
    setForm(productToForm(product))
    setImages(product?.images ? [...product.images] : [])
    setErrors({})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingId])

  const files = useMemo(
    () => images.filter((image): image is File => image instanceof File),
    [images],
  )

  // Blob URLs are minted here instead of during render: the previous version
  // called URL.createObjectURL on every render and never revoked them, which
  // leaked a URL per preview per render. Only the URLs of files that leave
  // the selection are revoked, so the surviving previews never flicker.
  useEffect(() => {
    const selected = new Set(files)

    objectUrls.current.forEach((url, file) => {
      if (!selected.has(file)) {
        URL.revokeObjectURL(url)
        objectUrls.current.delete(file)
      }
    })

    files.forEach((file) => {
      if (!objectUrls.current.has(file)) {
        objectUrls.current.set(file, URL.createObjectURL(file))
      }
    })

    setPreviewUrls(new Map(objectUrls.current))
  }, [files])

  // Release every remaining blob URL when the form unmounts.
  useEffect(() => {
    return () => {
      objectUrls.current.forEach((url) => URL.revokeObjectURL(url))
      objectUrls.current.clear()
    }
  }, [])

  // Focus the first invalid field only once React has committed the error
  // message and the new aria-invalid / aria-describedby attributes. Moving
  // focus inside the submit handler happened before the DOM update, so a
  // screen reader landed on the field and heard nothing.
  useEffect(() => {
    if (focusRequest === 0) return
    const target = focusTargetRef.current
    if (!target) return
    focusTargetRef.current = null

    if (target === 'name') nameRef.current?.focus()
    else if (target === 'price') priceRef.current?.focus()
    else if (target === 'description') descriptionRef.current?.focus()
    else fileInputRef.current?.focus()
  }, [focusRequest])

  function handleFieldChange<K extends keyof FormState>(
    field: K,
    value: FormState[K],
    errorKey?: keyof FieldErrors,
  ) {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (!errorKey) return
    setErrors((prev) => {
      if (!prev[errorKey]) return prev
      const next = { ...prev }
      delete next[errorKey]
      return next
    })
  }

  const addImageFiles = (fileList: FileList | File[]) => {
    const candidates = Array.from(fileList)
    const accepted = candidates.filter(
      (file) =>
        ACCEPTED_TYPES.includes(file.type) && file.size <= MAX_SIZE_BYTES,
    )
    const rejected = candidates.length - accepted.length

    if (rejected > 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Some files were skipped',
        text: `${rejected} file${rejected > 1 ? 's were' : ' was'} rejected. Only PNG, JPG or JPEG images up to ${MAX_SIZE_MB} MB each are allowed.`,
      })
    }

    if (accepted.length === 0) return

    setImages((prev) => [...prev, ...accepted])
    // An accepted file makes the "at least one image" message stale, and a
    // stale live-region message would be re-announced for no reason.
    setErrors((prev) => {
      if (!prev.images) return prev
      const next = { ...prev }
      delete next.images
      return next
    })
    // Reset the native input so picking the same file twice still fires.
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files
    if (selected && selected.length > 0) addImageFiles(selected)
  }

  const handleDragOver = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (event: DragEvent<HTMLLabelElement>) => {
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) return
    setIsDragging(false)
  }

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragging(false)
    if (event.dataTransfer?.files?.length) {
      addImageFiles(event.dataTransfer.files)
    }
  }

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  const clearImages = () => {
    setImages([])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const validate = (): FieldErrors => {
    const next: FieldErrors = {}
    const price = Number(form.price)

    if (!form.name.trim()) next.name = 'Product name is required.'
    if (!form.price.trim() || !Number.isFinite(price) || price <= 0) {
      next.price = 'Enter a price greater than zero.'
    }
    if (!form.description.trim()) {
      next.description = 'A description is required.'
    }
    if (images.length === 0) {
      next.images = 'Add at least one product image.'
    }

    return next
  }

  const queueFocusFirstError = (next: FieldErrors) => {
    // The field to focus is only recorded here; the actual focus() call
    // happens in an effect, after the error text has been rendered.
    focusTargetRef.current =
      FOCUS_ORDER.find((field) => next[field]) ?? null
    setFocusRequest((count) => count + 1)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const nextErrors = validate()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      queueFocusFirstError(nextErrors)
      return
    }

    focusTargetRef.current = null

    const payload: AdminFormProduct = {
      name: form.name.trim(),
      price: form.price.trim(),
      description: form.description.trim(),
      availability: form.availability,
      collection: form.collection,
      sizes: parseList(form.sizes),
      colors: parseList(form.colors),
      fragranceNotes: form.fragranceNotes.trim() || undefined,
      volume: form.volume.trim() || undefined,
      images,
    }

    try {
      // The mutations are the only network write; everything else here stays
      // local state, so a failed save leaves the form exactly as it was.
      if (editingId) {
        await updateProduct.mutateAsync({ id: editingId, product: payload })
      } else {
        await createProduct.mutateAsync(payload)
      }

      Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2800,
        timerProgressBar: true,
      }).fire({
        icon: 'success',
        title: isEdit ? 'Product updated' : 'Product added',
      })

      onSave()

      // A new product starts fresh; an edited one keeps the saved values so
      // the admin can confirm what was stored.
      if (!isEdit) {
        setForm(EMPTY_FORM)
        setImages([])
        if (fileInputRef.current) fileInputRef.current.value = ''
      }
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : 'Something went wrong while saving the product.'
      Swal.fire({
        icon: 'error',
        title: 'Could not save product',
        text: message,
      })
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <p className="text-xs text-muted-foreground">
        Fields marked <span className="text-primary">*</span> are required.
      </p>

      <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
        {/* PRODUCT NAME */}
        <div className="min-w-0">
          <label htmlFor="product-name" className={LABEL_CLASS}>
            Product Name <span className="text-primary">*</span>
          </label>
          <input
            id="product-name"
            ref={nameRef}
            type="text"
            value={form.name}
            onChange={(event) =>
              handleFieldChange('name', event.target.value, 'name')
            }
            placeholder="e.g. Meridian Signature Chain"
            required
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? 'product-name-error' : undefined}
            className={`${FIELD_BASE} px-4 ${
              errors.name ? 'border-destructive' : ''
            }`}
          />
          <FieldError id="product-name-error" message={errors.name} />
        </div>

        {/* COLLECTION */}
        <div className="min-w-0">
          <label htmlFor="product-collection" className={LABEL_CLASS}>
            Collection <span className="text-primary">*</span>
          </label>
          <div className="relative">
            <select
              id="product-collection"
              value={form.collection}
              onChange={(event) =>
                handleFieldChange('collection', event.target.value as CollectionId)
              }
              required
              className={`${FIELD_BASE} appearance-none px-4 pr-10`}
            >
              {COLLECTIONS.map((collection) => (
                <option key={collection.id} value={collection.id}>
                  {collection.name}
                </option>
              ))}
            </select>
            <ChevronDown
              size={18}
              aria-hidden="true"
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
          </div>
        </div>

        {/* PRICE */}
        <div className="min-w-0">
          <label htmlFor="product-price" className={LABEL_CLASS}>
            Price (₦) <span className="text-primary">*</span>
          </label>
          <div className="relative">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-primary"
            >
              ₦
            </span>
            <input
              id="product-price"
              ref={priceRef}
              type="number"
              inputMode="numeric"
              min={0}
              step="any"
              value={form.price}
              onChange={(event) =>
                handleFieldChange('price', event.target.value, 'price')
              }
              placeholder="0"
              required
              aria-invalid={errors.price ? true : undefined}
              aria-describedby={errors.price ? 'product-price-error' : undefined}
              className={`${FIELD_BASE} appearance-none pl-9 pr-4 ${
                errors.price ? 'border-destructive' : ''
              }`}
            />
          </div>
          <FieldError id="product-price-error" message={errors.price} />
        </div>

        {/* AVAILABILITY */}
        <div className="min-w-0">
          <label htmlFor="product-availability" className={LABEL_CLASS}>
            Availability <span className="text-primary">*</span>
          </label>
          <div className="relative">
            <select
              id="product-availability"
              value={form.availability}
              onChange={(event) =>
                handleFieldChange('availability', event.target.value as Availability)
              }
              required
              className={`${FIELD_BASE} appearance-none px-4 pr-10`}
            >
              {AVAILABILITIES.map((availability) => (
                <option key={availability} value={availability}>
                  {availability}
                </option>
              ))}
            </select>
            <ChevronDown
              size={18}
              aria-hidden="true"
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
          </div>
        </div>

        {/* DESCRIPTION */}
        <div className="min-w-0 md:col-span-2">
          <label htmlFor="product-description" className={LABEL_CLASS}>
            Description <span className="text-primary">*</span>
          </label>
          <textarea
            id="product-description"
            ref={descriptionRef}
            rows={5}
            value={form.description}
            onChange={(event) =>
              handleFieldChange('description', event.target.value, 'description')
            }
            placeholder="Describe the piece — materials, fit, finish and the story behind it."
            required
            aria-invalid={errors.description ? true : undefined}
            aria-describedby={
              errors.description ? 'product-description-error' : undefined
            }
            className={`${FIELD_BASE} resize-y px-4 py-3 ${
              errors.description ? 'border-destructive' : ''
            }`}
          />
          <FieldError id="product-description-error" message={errors.description} />
        </div>

        {/* SIZES */}
        <div className="min-w-0">
          <label htmlFor="product-sizes" className={LABEL_CLASS}>
            Sizes{' '}
            <span className="text-xs font-normal text-muted-foreground">
              (optional)
            </span>
          </label>
          <input
            id="product-sizes"
            type="text"
            value={form.sizes}
            onChange={(event) => handleFieldChange('sizes', event.target.value)}
            placeholder="S, M, L, XL"
            aria-describedby="product-sizes-hint"
            className={`${FIELD_BASE} px-4`}
          />
          <p id="product-sizes-hint" className={HINT_CLASS}>
            Comma separated. Optional — only appears on the product page when
            set.
          </p>
        </div>

        {/* COLORS */}
        <div className="min-w-0">
          <label htmlFor="product-colors" className={LABEL_CLASS}>
            Colors{' '}
            <span className="text-xs font-normal text-muted-foreground">
              (optional)
            </span>
          </label>
          <input
            id="product-colors"
            type="text"
            value={form.colors}
            onChange={(event) => handleFieldChange('colors', event.target.value)}
            placeholder="Gold, Silver"
            aria-describedby="product-colors-hint"
            className={`${FIELD_BASE} px-4`}
          />
          <p id="product-colors-hint" className={HINT_CLASS}>
            Comma separated. Optional — only appears on the product page when
            set.
          </p>
        </div>

        {/* FRAGRANCE NOTES */}
        <div className="min-w-0">
          <label htmlFor="product-fragrance-notes" className={LABEL_CLASS}>
            Fragrance Notes{' '}
            <span className="text-xs font-normal text-muted-foreground">
              (optional)
            </span>
          </label>
          <input
            id="product-fragrance-notes"
            type="text"
            value={form.fragranceNotes}
            onChange={(event) =>
              handleFieldChange('fragranceNotes', event.target.value)
            }
            placeholder="Fragrance notes"
            aria-describedby="product-fragrance-notes-hint"
            className={`${FIELD_BASE} px-4`}
          />
          <p id="product-fragrance-notes-hint" className={HINT_CLASS}>
            Optional — only appears on the product page when set.
          </p>
        </div>

        {/* VOLUME */}
        <div className="min-w-0">
          <label htmlFor="product-volume" className={LABEL_CLASS}>
            Volume{' '}
            <span className="text-xs font-normal text-muted-foreground">
              (optional)
            </span>
          </label>
          <input
            id="product-volume"
            type="text"
            value={form.volume}
            onChange={(event) => handleFieldChange('volume', event.target.value)}
            placeholder="50ml"
            aria-describedby="product-volume-hint"
            className={`${FIELD_BASE} px-4`}
          />
          <p id="product-volume-hint" className={HINT_CLASS}>
            Optional — only appears on the product page when set.
          </p>
        </div>

        {/* IMAGES */}
        <div className="min-w-0 md:col-span-2">
          <p id="product-images-label" className={LABEL_CLASS}>
            Product Images <span className="text-primary">*</span>{' '}
            <span className="text-xs font-normal text-muted-foreground">
              ({images.length} selected)
            </span>
          </p>

          <label
            htmlFor="product-images"
            tabIndex={-1}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            aria-labelledby="product-images-label"
            className={cn(
              'relative flex min-h-[9rem] w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-4 py-8 text-center transition-colors',
              // The file input is visually hidden, so the drop zone itself has
              // to show the focus ring — otherwise the control has no visible
              // focus indication at all (WCAG 2.4.7).
              'focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/70 focus-within:ring-offset-2 focus-within:ring-offset-surface',
              isDragging
                ? 'border-primary bg-primary/10'
                : 'border-primary/50 bg-input/40 hover:border-primary hover:bg-primary/5',
            )}
          >
            <ImagePlus size={36} className="text-primary" aria-hidden="true" />
            <span className="text-sm font-semibold text-foreground">
              Drag &amp; drop or click to upload
            </span>
            <span className="text-xs text-muted-foreground">
              Select multiple images at once — PNG, JPG or JPEG up to{' '}
              {MAX_SIZE_MB} MB each
            </span>
            <input
              id="product-images"
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              multiple
              required
              onChange={handleFileChange}
              aria-describedby={
                errors.images
                  ? 'product-images-hint product-images-error'
                  : 'product-images-hint'
              }
              aria-invalid={errors.images ? true : undefined}
              className="sr-only"
            />
          </label>

          <p id="product-images-hint" className={HINT_CLASS}>
            Images already attached to this product are kept and resubmitted
            as-is.
          </p>

          <FieldError id="product-images-error" message={errors.images} />

          {images.length > 0 && (
            <div className="mt-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {images.map((image, index) => {
                  const source =
                    typeof image === 'string'
                      ? image
                      : previewUrls.get(image)
                  const isSaved = typeof image === 'string'

                  return (
                    <div
                      key={imageKey(image, index)}
                      className="relative aspect-square overflow-hidden rounded-xl border border-border bg-surface-2"
                    >
                      {source ? (
                        <img
                          src={source}
                          alt={`Product image ${index + 1}`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-xs text-subtle">
                          Preparing…
                        </span>
                      )}

                      <span
                        className={`absolute bottom-2 left-2 rounded-full px-2 py-0.5 text-xs font-medium ${
                          isSaved
                            ? 'bg-elevated/90 text-muted-foreground'
                            : 'bg-primary/90 text-primary-foreground'
                        }`}
                      >
                        {isSaved ? 'Saved' : 'New'}
                      </span>

                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        aria-label={`Remove image ${index + 1}`}
                        className="absolute right-1 top-1 flex h-11 w-11 items-center justify-center rounded-full bg-background/80 text-foreground backdrop-blur-sm transition-colors hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <X size={18} aria-hidden="true" />
                      </button>
                    </div>
                  )
                })}
              </div>

              <button
                type="button"
                onClick={clearImages}
                aria-label="Clear all product images"
                className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-destructive/60 hover:text-destructive"
              >
                <Trash2 size={16} aria-hidden="true" />
                Clear all
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          {isEdit
            ? 'Updating replaces the details of this product.'
            : 'New products are added straight to the catalogue.'}
        </p>
        <button
          type="submit"
          disabled={isSaving}
          className="btn-gold btn-gold-hover inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm uppercase tracking-[0.12em] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving && (
            <LoaderCircle size={18} className="animate-spin" aria-hidden="true" />
          )}
          {isSaving
            ? isEdit
              ? 'Updating…'
              : 'Saving…'
            : isEdit
              ? 'Update Product'
              : 'Add Product'}
        </button>
      </div>
    </form>
  )
}
