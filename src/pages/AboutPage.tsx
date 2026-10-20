import { Link } from 'react-router-dom'

import { Container } from '@/components/Section'
import BrandStory from '@/components/sections/BrandStory'
import WhyShop from '@/components/sections/WhyShop'
import HowItWorks from '@/components/sections/HowItWorks'
import { usePageTitle } from '@/hooks/usePageTitle'
import { BRAND } from '@/lib/brand'

/**
 * `/about` — the brand statement, the trust block and the ordering flow.
 * Each section keeps its own heading and eyebrow, so the page header below
 * stays clear of them: "About" vs "Our Story" / "Why DAMI MERIDIAN" /
 * "How to Order".
 */
export default function AboutPage() {
  usePageTitle('About')

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
              About
            </li>
          </ol>
        </nav>

        <header className="mt-8 max-w-3xl sm:mt-10">
          <p className="eyebrow mb-4">About the Brand</p>

          <h1 className="text-4xl leading-[1.08] text-foreground sm:text-5xl lg:text-6xl">
            {BRAND.name}
          </h1>

          <div className="rule-gold mt-7 w-24" aria-hidden="true" />

          <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            {BRAND.tagline} Based at {BRAND.location} &mdash; and every order is
            arranged in conversation with the team.
          </p>
        </header>
      </Container>

      {/* Brand story, trust block and the four-step ordering flow. */}
      <BrandStory />
      <WhyShop />
      <HowItWorks />
    </>
  )
}
