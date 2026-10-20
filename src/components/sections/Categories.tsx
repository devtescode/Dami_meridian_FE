import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Section } from '@/components/Section'
import { COLLECTIONS, type Collection } from '@/lib/collections'

export function Categories() {
  return (
    <Section
      id="categories"
      eyebrow="Shop by Category"
      title={
        <>
          Five ways to{' '}
          <span className="text-gradient">wear your identity</span>
        </>
      }
      description="Everyday tees, heavyweight joggers, signature scents and gold — pick the lane you love and the shop opens straight onto the pieces inside it."
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
          />
        ))}
      </div>
    </Section>
  )
}

interface CategoryCardProps {
  collection: Collection
  featured: boolean
}

/**
 * The whole card is one link into the routed shop: `/shop?collection=<id>`
 * is the query the shop page reads to pre-filter its grid, so navigation
 * replaces the old event-dispatch + anchor-scroll coupling entirely.
 * The accessible name keeps "Browse Collection" as its prefix (WCAG 2.5.3)
 * so the visible affordance always matches what screen readers announce.
 */
function CategoryCard({ collection, featured }: CategoryCardProps) {
  return (
    <article
      className={
        featured ? 'sm:col-span-2 lg:col-span-12' : 'lg:col-span-3'
      }
    >
      <Link
        to={`/shop?collection=${collection.id}`}
        aria-label={`Browse Collection — ${collection.name}`}
        className={[
          'card-luxury card-luxury-hover group relative flex h-full min-w-0 overflow-hidden',
          featured ? 'flex-col sm:flex-row sm:items-center' : 'flex-col',
        ].join(' ')}
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
            alt=""
            loading={featured ? 'eager' : 'lazy'}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
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
            <span
              className={[
                'group/btn inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full px-6 py-3 text-[13px] font-medium uppercase tracking-[0.16em] btn-outline-gold',
                featured ? 'sm:w-auto' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <span>Browse Collection</span>
              <ArrowRight
                className="h-4 w-4 shrink-0 transition-transform duration-300 group-hover/btn:translate-x-1"
                aria-hidden="true"
              />
            </span>
          </div>
        </div>
      </Link>
    </article>
  )
}

export default Categories
