import { useEffect, useState } from 'react'
import { ArrowRight, Check } from 'lucide-react'
import { Section } from '@/components/Section'
import {
  COLLECTIONS,
  COLLECTION_IDS,
  type Collection,
  type CollectionId,
} from '@/lib/collections'

/**
 * Contract with the shop section, which owns the product grid and its filter:
 *  - `dm:collection`        -> fired by these cards. detail: { collection: CollectionId }
 *  - `dm:collection:change` -> fired by the shop.  detail: { collection: string | null }
 *
 * The cards never navigate by URL: they publish an intent and let the shop
 * decide how to pre-filter, which keeps this component route-agnostic.
 */
export const COLLECTION_EVENT = 'dm:collection'
export const COLLECTION_CHANGE_EVENT = 'dm:collection:change'

interface CollectionChangeDetail {
  collection?: string | null
}

/** Narrows an untrusted event payload to one of the five known collections. */
function isCollectionId(value: string): value is CollectionId {
  const ids: string[] = COLLECTION_IDS
  return ids.includes(value)
}

export function Categories() {
  const [selected, setSelected] = useState<CollectionId | null>(null)

  // The shop owns the filter state, so we simply mirror whatever it publishes.
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleChange = (event: Event) => {
      const detail = (event as CustomEvent<CollectionChangeDetail>).detail
      const next = detail?.collection ?? null
      setSelected(next && isCollectionId(next) ? next : null)
    }

    window.addEventListener(COLLECTION_CHANGE_EVENT, handleChange)
    return () => window.removeEventListener(COLLECTION_CHANGE_EVENT, handleChange)
  }, [])

  const browseCollection = (collection: Collection) => {
    // Publish first so the shop can pre-filter before we scroll to it.
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent(COLLECTION_EVENT, {
          detail: { collection: collection.id },
        }),
      )
    }

    setSelected(collection.id)

    if (typeof document !== 'undefined') {
      document
        .getElementById('shop')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const selectedName = selected
    ? COLLECTIONS.find((collection) => collection.id === selected)?.name
    : undefined

  return (
    <Section
      id="categories"
      eyebrow="Collections"
      title={
        <>
          Five ways to{' '}
          <span className="text-gradient">wear your identity</span>
        </>
      }
      description="Everyday tees, heavyweight joggers, signature scents and gold — pick the lane you love and we will take you straight to the pieces inside it."
    >
      {/*
        Twelve-column grid: the first collection is a wide editorial card and
        the remaining four sit three-per-row, so no row is ever left half empty.
      */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
        {COLLECTIONS.map((collection, index) => (
          <CategoryCard
            key={collection.id}
            collection={collection}
            featured={index === 0}
            active={selected === collection.id}
            onBrowse={browseCollection}
          />
        ))}
      </div>

      <p className="sr-only" aria-live="polite">
        {selectedName
          ? `${selectedName} selected. The shop below is filtered to this collection.`
          : 'No collection selected. The shop below shows every product.'}
      </p>
    </Section>
  )
}

interface CategoryCardProps {
  collection: Collection
  featured: boolean
  active: boolean
  onBrowse: (collection: Collection) => void
}

function CategoryCard({
  collection,
  featured,
  active,
  onBrowse,
}: CategoryCardProps) {
  return (
    <article
      className={[
        'card-luxury card-luxury-hover group relative flex overflow-hidden',
        featured
          ? 'flex-col sm:col-span-2 sm:flex-row sm:items-center lg:col-span-12'
          : 'flex-col lg:col-span-3',
        active ? 'ring-2 ring-primary/70' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div
        className={[
          'relative aspect-[4/5] w-full shrink-0 overflow-hidden bg-surface-2',
          featured ? 'sm:w-[42%] lg:w-[36%]' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <img
          src={collection.image}
          alt={collection.name}
          loading={featured ? 'eager' : 'lazy'}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />

        {active && (
          <span className="absolute right-3 top-3 z-10 inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.2em] text-primary-foreground shadow-lg">
            <Check className="h-3.5 w-3.5" aria-hidden="true" />
            Selected
          </span>
        )}
      </div>

      <div
        className={[
          'flex flex-1 flex-col',
          featured
            ? 'justify-center gap-4 p-6 sm:p-8 lg:p-12'
            : 'gap-3 p-5 sm:p-6',
        ].join(' ')}
      >
        <div className="flex flex-wrap items-center gap-3">
          <p className="eyebrow">{collection.short}</p>
          {featured && (
            <span className="rounded-full border border-primary/40 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-gold-light">
              Featured
            </span>
          )}
        </div>

        <h3
          className={[
            'font-display leading-tight text-foreground',
            featured ? 'text-3xl sm:text-4xl' : 'text-2xl',
          ].join(' ')}
        >
          {collection.name}
        </h3>

        <p
          className={[
            'text-muted-foreground',
            featured
              ? 'text-base leading-relaxed sm:text-lg'
              : 'text-sm leading-relaxed',
          ].join(' ')}
        >
          {collection.description}
        </p>

        <div className={featured ? 'mt-2' : 'mt-3'}>
          {/* Visible text stays the prefix of the accessible name (WCAG 2.5.3). */}
          <button
            type="button"
            onClick={() => onBrowse(collection)}
            aria-pressed={active}
            aria-label={`Browse Collection — ${collection.name}`}
            className={[
              'group/btn inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full px-6 py-3 text-[13px] font-medium uppercase tracking-[0.16em]',
              featured ? 'sm:w-auto' : '',
              active ? 'btn-gold btn-gold-hover' : 'btn-outline-gold btn-outline-gold-hover',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <span>Browse Collection</span>
            <ArrowRight
              className="h-4 w-4 shrink-0 transition-transform duration-300 group-hover/btn:translate-x-1"
              aria-hidden="true"
            />
          </button>
        </div>
      </div>
    </article>
  )
}

export default Categories
