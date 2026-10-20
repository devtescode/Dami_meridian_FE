import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { Section } from '@/components/Section'
import { COLLECTIONS, type CollectionId } from '@/lib/collections'

/**
 * Titles are resolved from the shared catalogue so this section can never
 * drift away from the names the shop filters already use.
 */
const COLLECTION_BY_ID = new Map(
  COLLECTIONS.map((collection) => [collection.id, collection] as const),
)

interface Tile {
  id: CollectionId
  image: string
  alt: string
  /** One-line editorial descriptor shown under the collection name. */
  descriptor: string
  /** Explicit aspect class keeps the frame from shifting while images load. */
  frame: string
  /** Explicit `lg` placement keeps the bento deterministic in any DOM order. */
  placement: string
}

const TILES: Tile[] = [
  {
    id: 'jewellery',
    image: '/images/hero-jewelry.jpg',
    alt: 'DAMI MERIDIAN gold jewellery resting on a dark surface',
    descriptor: 'Pieces that finish the look',
    frame: 'aspect-[4/5] lg:aspect-auto',
    placement: 'lg:col-start-1 lg:row-start-1 lg:col-span-2 lg:row-span-2',
  },
  {
    id: 'men-tshirts',
    image: '/images/collection-1.jpg',
    alt: 'Model wearing a DAMI MERIDIAN men’s round-neck t-shirt',
    descriptor: 'Clean everyday essentials',
    frame: 'aspect-[4/5]',
    placement: 'lg:col-start-3 lg:row-start-1',
  },
  {
    id: 'women-tshirts',
    image: '/images/collection-2.jpg',
    alt: 'Model wearing a DAMI MERIDIAN women’s round-neck t-shirt',
    descriptor: 'Premium tees, styled to flatter',
    frame: 'aspect-[4/5]',
    placement: 'lg:col-start-4 lg:row-start-1',
  },
  {
    id: 'joggers',
    image: '/images/collection-3.jpg',
    alt: 'Model wearing DAMI MERIDIAN heavyweight unisex joggers',
    descriptor: 'Heavyweight, worn your way',
    frame: 'aspect-[4/5]',
    placement: 'lg:col-start-3 lg:row-start-2',
  },
  {
    id: 'perfumes',
    image: '/images/collection-4.jpg',
    alt: 'DAMI MERIDIAN perfume bottle on a dark studio surface',
    descriptor: 'Scents that linger',
    // The last tile closes the two-column tablet grid as a wide band.
    frame: 'aspect-[4/5] sm:aspect-[16/10] lg:aspect-[4/5]',
    placement:
      'sm:col-span-2 lg:col-span-1 lg:col-start-4 lg:row-start-2',
  },
]

/**
 * Category-correct fallbacks used if a tile photograph fails to load.
 * Each entry points at the matching category shot in `public/images`,
 * so a broken file degrades to a relevant image rather than a blank frame.
 */
const IMAGE_FALLBACKS: Record<string, string> = {
  '/images/hero-jewelry.jpg': '/images/cat-jewellery.jpg',
  '/images/collection-1.jpg': '/images/cat-men-tshirts.jpg',
  '/images/collection-2.jpg': '/images/cat-women-tshirts.jpg',
  '/images/collection-3.jpg': '/images/cat-joggers.jpg',
  '/images/collection-4.jpg': '/images/cat-perfumes.jpg',
}

/**
 * Each tile is a real link into the routed shop: `/shop?collection=<id>`
 * pre-filters the grid there, so navigation replaces the old
 * window-event dispatch + in-page anchor scroll.
 */
function CollectionTile({
  tile,
  index,
  featured,
}: {
  tile: Tile
  index: number
  featured: boolean
}) {
  const name = COLLECTION_BY_ID.get(tile.id)?.name ?? tile.id

  return (
    <Link
      to={`/shop?collection=${tile.id}`}
      aria-label={`Browse ${name}`}
      style={{ animationDelay: `${index * 90}ms` }}
      className={`group relative block w-full animate-fade-in-up overflow-hidden rounded-2xl border border-border bg-surface text-left transition-all duration-500 hover:-translate-y-1 hover:border-primary/60 hover:shadow-2xl hover:shadow-primary/10 focus-visible:border-primary/60 ${tile.frame} ${tile.placement}`}
    >
      <img
        src={tile.image}
        alt={tile.alt}
        loading="lazy"
        decoding="async"
        onError={(event) => {
          const fallback = IMAGE_FALLBACKS[tile.image]
          if (fallback && !event.currentTarget.src.endsWith(fallback)) {
            event.currentTarget.src = fallback
          }
        }}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 group-focus-visible:scale-105"
      />

      {/* Scrim keeps the serif title legible over any photograph. */}
      <span
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-background via-background/55 to-transparent"
      />

      <span
        aria-hidden="true"
        className="absolute left-4 top-4 text-[10px] tracking-[0.3em] text-muted-foreground sm:left-5 sm:top-5"
      >
        {String(index + 1).padStart(2, '0')}
      </span>

      <span className="absolute inset-x-0 bottom-0 block p-4 sm:p-5 lg:p-6">
        <span
          className={`block font-display leading-tight text-foreground transition-colors duration-500 group-hover:text-gradient group-focus-visible:text-gradient ${
            featured ? 'text-3xl sm:text-4xl lg:text-5xl' : 'text-xl sm:text-2xl'
          }`}
        >
          {name}
        </span>

        <span
          className={`mt-1.5 block text-muted-foreground ${
            featured ? 'text-sm lg:text-base' : 'text-xs sm:text-sm'
          }`}
        >
          {tile.descriptor}
        </span>

        {/* Affordance is decorative: the whole tile is the click target. */}
        <span className="eyebrow mt-3 inline-flex items-center gap-1.5 transition-opacity duration-500 sm:translate-y-1 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100 sm:group-focus-visible:translate-y-0 sm:group-focus-visible:opacity-100">
          Explore
          <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </span>
      </span>
    </Link>
  )
}

export default function Collections() {
  return (
    <Section
      id="collections"
      eyebrow="Featured Collections"
      align="left"
      title={
        <>
          Five signatures,{' '}
          <span className="text-gradient">one point of view</span>
        </>
      }
      description="From the everyday tee to the scent that lingers — the pieces that define DAMI MERIDIAN, designed and delivered from Ondo State for those who refuse to blend in."
      className="relative scroll-mt-20 overflow-hidden border-y border-border/40 bg-gradient-to-b from-surface/60 via-background to-background"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-primary/10 blur-3xl"
      />

      <div className="relative z-10 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4 lg:gap-6">
        {TILES.map((tile, index) => (
          <CollectionTile
            key={tile.id}
            tile={tile}
            index={index}
            featured={index === 0}
          />
        ))}
      </div>
    </Section>
  )
}
