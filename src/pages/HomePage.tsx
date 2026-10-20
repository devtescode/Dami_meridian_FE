import Hero from '@/components/sections/Hero'
import Categories from '@/components/sections/Categories'
import Collections from '@/components/sections/Collections'
import Shop from '@/components/sections/Shop'
import BrandStory from '@/components/sections/BrandStory'
import WhyShop from '@/components/sections/WhyShop'
import HowItWorks from '@/components/sections/HowItWorks'
import Testimonials from '@/components/sections/Testimonials'
import FAQ from '@/components/sections/FAQ'
import Contact from '@/components/sections/Contact'

/**
 * Landing page: the full storefront scroll, one section after another.
 * PublicLayout supplies the navigation, footer and floating WhatsApp button,
 * and product cards navigate to `/products/:id` on their own — no modal state
 * lives here.
 */
export default function HomePage() {
  return (
    <>
      <Hero />
      <Categories />
      <Collections />
      <Shop />
      <BrandStory />
      <WhyShop />
      <HowItWorks />
      <Testimonials />
      <FAQ />
      <Contact />
    </>
  )
}
