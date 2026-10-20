import { Outlet } from 'react-router-dom'

import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import WhatsAppButton from '@/components/WhatsAppButton'

/**
 * Chrome shared by every public storefront route: sticky navigation, the page
 * itself, the footer and the floating WhatsApp button. Admin routes deliberately
 * do not render through this shell.
 */
export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-background">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Skip to content
      </a>

      <Navigation />

      {/* tabIndex={-1} makes the skip-link target (and route-change focus) actually move focus here in Safari/Firefox; outline-none keeps the ring off a programmatically focused landmark. */}
      <main id="main" tabIndex={-1} className="outline-none">
        <Outlet />
      </main>

      <Footer />
      <WhatsAppButton />
    </div>
  )
}
