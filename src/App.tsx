import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

import Navigation from '@/components/Navigation'
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
import Footer from '@/components/Footer'
import WhatsAppButton from '@/components/WhatsAppButton'
import ProductModal from '@/components/ProductModal'
import AdminPage from '@/pages/AdminPage'
import type { Product } from '@/types/product'

function Storefront() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const openModal = (product: Product) => {
    setSelectedProduct(product)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setSelectedProduct(null)
  }

  return (
    <div className="min-h-screen bg-background">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Skip to content
      </a>

      <Navigation />

      <main id="main">
        <Hero />
        <Categories />
        <Collections />
        <Shop onProductClick={openModal} />
        <BrandStory />
        <WhyShop />
        <HowItWorks />
        <Testimonials />
        <FAQ />
        <Contact />
      </main>

      <Footer />
      <WhatsAppButton />

      {modalOpen && selectedProduct && (
        <ProductModal product={selectedProduct} onClose={closeModal} />
      )}
    </div>
  )
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Storefront />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </Router>
  )
}
