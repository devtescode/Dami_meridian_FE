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
