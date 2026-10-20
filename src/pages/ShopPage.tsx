import { Link } from 'react-router-dom'

import { Container } from '@/components/Section'
import Shop from '@/components/sections/Shop'
import { usePageTitle } from '@/hooks/usePageTitle'

/**
 * Dedicated, shareable catalogue route. The grid reads `?collection=` and
 * `?q=` straight from the URL, so a link — or a category card elsewhere on
 * the site — lands the visitor pre-filtered. The Shop section renders with
 * `hideHeader` so its section heading never stacks under this page header.
 */
export default function ShopPage() {
  usePageTitle('Shop')

  return (
    <div className="bg-background">
      {/* Clear the sticky nav before the editorial header begins. */}
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
            </li>
            <li aria-hidden="true" className="text-border">
              /
            </li>
            <li aria-current="page" className="text-muted-foreground">
              Shop
            </li>
          </ol>
        </nav>

        <header className="mt-8 max-w-3xl sm:mt-10">
          <p className="eyebrow mb-4">Shop</p>

          <h1 className="text-4xl leading-[1.08] text-foreground sm:text-5xl lg:text-6xl">
            The Full Collection
          </h1>

          <div className="rule-gold mt-7 w-24" aria-hidden="true" />

          <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Every piece we make in one place — filter by collection, search by
            name, and order directly on WhatsApp.
          </p>
        </header>
      </Container>

      <Shop hideHeader />
    </div>
  )
}
