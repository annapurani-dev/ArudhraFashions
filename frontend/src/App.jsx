import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { AuthProvider } from './context/AuthContext'
import { AdminAuthProvider } from './context/AdminAuthContext'
import { ToastProvider } from './components/Toast/ToastContainer'
import { LoginModalProvider, useLoginModal } from './context/LoginModalContext'
import { NewsletterProvider, useNewsletter } from './context/NewsletterContext'
import { Header, Footer, SaleStrip } from './components/Layout'
import ErrorBoundary from './components/ErrorBoundary'
import LoginModal from './components/LoginModal'
import Newsletter from './components/Newsletter/Newsletter'
import Home from './pages/Home'
import Products from './pages/Products'
import ProductsIndex from './pages/ProductsIndex'
import ProductDetail from './pages/ProductDetail'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import Dashboard from './pages/Dashboard'
import Wishlist from './pages/Wishlist'
import SizeGuide from './pages/SizeGuide'
import Compare from './pages/Compare'
import OrderTracking from './pages/OrderTracking'
import Contact from './pages/Contact'
import FAQ from './pages/FAQ'
import Shipping from './pages/Shipping'
import Returns from './pages/Returns'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'
import ResetPassword from './pages/ResetPassword'
import NotFound from './pages/NotFound'
import ServerError from './pages/ServerError'
import AdminDashboard from './pages/Admin/AdminDashboard'
import TopProgress from './components/TopProgress/TopProgress'
// Splash (landing modal) removed

// Scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}

// Layout wrapper for public pages
function PublicLayout({ children }) {
  const { isOpen, closeModal, initialMode } = useLoginModal()
  const { showNewsletter, closeNewsletter } = useNewsletter()
  
  return (
    <div className="App">
      <SaleStrip />
      <Header />
      <main>{children}</main>
      <Footer />
      <LoginModal isOpen={isOpen} onClose={closeModal} initialMode={initialMode} />
      {showNewsletter && <Newsletter onClose={closeNewsletter} />}
    </div>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <TopProgress />
      <AuthProvider>
        <AdminAuthProvider>
          <ToastProvider>
            <LoginModalProvider>
              <NewsletterProvider>
                <Router>
              <ScrollToTop />
              <Routes>
                {/* Admin Routes - No Header/Footer */}
                <Route path="/admin" element={<Navigate to="/" replace />} />
                <Route path="/admin/*" element={<AdminDashboard />} />
                
                {/* Public Routes - With Header/Footer */}
                <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
                <Route path="/products" element={<PublicLayout><ProductsIndex /></PublicLayout>} />
                <Route path="/products/:category/:subcategory?" element={<PublicLayout><Products /></PublicLayout>} />
                <Route path="/product/:id" element={<PublicLayout><ProductDetail /></PublicLayout>} />
                <Route path="/cart" element={<PublicLayout><Cart /></PublicLayout>} />
                <Route path="/checkout" element={<PublicLayout><Checkout /></PublicLayout>} />
                <Route path="/dashboard" element={<PublicLayout><Dashboard /></PublicLayout>} />
                <Route path="/wishlist" element={<PublicLayout><Wishlist /></PublicLayout>} />
                <Route path="/size-guide" element={<PublicLayout><SizeGuide /></PublicLayout>} />
                <Route path="/compare" element={<PublicLayout><Compare /></PublicLayout>} />
                <Route path="/order/:id" element={<PublicLayout><OrderTracking /></PublicLayout>} />
                <Route path="/track/:tracking" element={<PublicLayout><OrderTracking /></PublicLayout>} />
                <Route path="/contact" element={<PublicLayout><Contact /></PublicLayout>} />
                <Route path="/faq" element={<PublicLayout><FAQ /></PublicLayout>} />
                <Route path="/shipping" element={<PublicLayout><Shipping /></PublicLayout>} />
                <Route path="/returns" element={<PublicLayout><Returns /></PublicLayout>} />
                <Route path="/privacy" element={<PublicLayout><Privacy /></PublicLayout>} />
                <Route path="/terms" element={<PublicLayout><Terms /></PublicLayout>} />
                <Route path="/reset-password" element={<PublicLayout><ResetPassword /></PublicLayout>} />
                <Route path="/500" element={<PublicLayout><ServerError /></PublicLayout>} />
                <Route path="*" element={<PublicLayout><NotFound /></PublicLayout>} />
              </Routes>
            </Router>
              </NewsletterProvider>
            </LoginModalProvider>
          </ToastProvider>
        </AdminAuthProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
