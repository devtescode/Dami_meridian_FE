import { Link } from 'react-router-dom'

import { Container } from '@/components/Section'
import Categories from '@/components/sections/Categories'
import Collections from '@/components/sections/Collections'
import { usePageTitle } from '@/hooks/usePageTitle'

/**
 * `/collections` — the two catalogue showcases, stacked under one editorial
 * header. Both sections are self-contained (their tiles link straight into
 * `/shop?collection=…`), so the page needs no filter state of its own.
 */
export default function CollectionsPage() {
  usePageTitle('Collections')

  return (
    <>
      <Container className="pt-8 sm:pt-12 lg:pt-16">
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.2em]">
            <li>
              <Link
                to="/"
                className="text-subtle transition-colors hover:text-primary"
              >
                Home
              </Link>
              <span aria-hidden="true" className="ml-2 text-border">
                /
              </span>
            </li>
            <li aria-current="page" className="text-muted-foreground">
              Collections
            </li>
          </ol>
        </nav>

        <header className="mt-8 max-w-3xl sm:mt-10">
          <p className="eyebrow mb-4">Shop the Range</p>

          <h1 className="text-4xl leading-[1.08] text-foreground sm:text-5xl lg:text-6xl">
            The <span className="text-gradient">Collections</span>
          </h1>

          <div className="rule-gold mt-7 w-24" aria-hidden="true" />

          <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Men&rsquo;s and women&rsquo;s round-neck t-shirts, unisex joggers,
            perfumes and jewellery &mdash; the full DAMI MERIDIAN range, sorted
            so you can go straight to the pieces you came for.
          </p>
        </header>
      </Container>

      {/* Five image-led cards, then the bento — each tile links into the
          shop pre-filtered to its collection. */}
      <Categories />
      <Collections />
    </>
  )
}
