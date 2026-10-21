import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'

import PublicLayout from '@/components/PublicLayout'
import ScrollToTop from '@/components/ScrollToTop'
import AdminLayout from '@/layouts/AdminLayout'

import HomePage from '@/pages/HomePage'
import ShopPage from '@/pages/ShopPage'
import CollectionsPage from '@/pages/CollectionsPage'
import AboutPage from '@/pages/AboutPage'
import ContactPage from '@/pages/ContactPage'
import ProductDetailsPage from '@/pages/ProductDetailsPage'
import NotFoundPage from '@/pages/NotFoundPage'

import AdminLoginPage from '@/pages/admin/AdminLoginPage'
import AdminRegisterPage from '@/pages/admin/AdminRegisterPage'
import AdminDashboardPage from '@/pages/admin/AdminDashboardPage'
import AdminProductLookupPage from '@/pages/admin/AdminProductLookupPage'
import AdminProductsPage from '@/pages/admin/AdminProductsPage'
import AdminAddProductPage from '@/pages/admin/AdminAddProductPage'
import AdminEditProductPage from '@/pages/admin/AdminEditProductPage'
import AdminSettingsPage from '@/pages/admin/AdminSettingsPage'
import AdminChangePasswordPage from '@/pages/admin/AdminChangePasswordPage'

import { isSessionValid } from '@/lib/session'

/**
 * `/admin` is a landing pad, not a page: an existing session goes straight to
 * the dashboard, everyone else to the login screen (which itself redirects
 * authenticated admins, and offers registration only when the backend's
 * `/admin/status` says no admin exists yet).
 */
function AdminEntry() {
  return (
    <Navigate
      to={isSessionValid() ? '/admin/dashboard' : '/admin/login'}
      replace
    />
  )
}

export default function App() {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        {/* ---------------------------------------------------------------- */}
        {/* Public storefront                                                 */}
        {/* ---------------------------------------------------------------- */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/collections" element={<CollectionsPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/products/:id" element={<ProductDetailsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/* ---------------------------------------------------------------- */}
        {/* Admin                                                             */}
        {/* ---------------------------------------------------------------- */}
        <Route path="/admin" element={<AdminEntry />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin/register" element={<AdminRegisterPage />} />

        {/* Protected — AdminLayout redirects unauthenticated visitors. */}
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          <Route path="/admin/products" element={<AdminProductsPage />} />
          <Route path="/admin/products/new" element={<AdminAddProductPage />} />
          <Route
            path="/admin/products/:id/edit"
            element={<AdminEditProductPage />}
          />
          <Route
            path="/admin/products/lookup"
            element={<AdminProductLookupPage />}
          />
          <Route path="/admin/settings" element={<AdminSettingsPage />} />
          <Route
            path="/admin/change-password"
            element={<AdminChangePasswordPage />}
          />
        </Route>

        {/* Unknown /admin/... paths return to the admin entry. */}
        <Route path="/admin/*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </Router>
  )
}
