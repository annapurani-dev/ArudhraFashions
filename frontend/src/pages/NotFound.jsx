import { Link } from 'react-router-dom'
import { Home, ShoppingBag } from 'lucide-react'

function NotFound() {
  return (
    <div className="error-page not-found-page">
      <div className="container">
        <div className="error-content">
          <div className="error-code">404</div>
          <h1>Page Not Found</h1>
          <p>Sorry, the page you're looking for doesn't exist or has been moved.</p>
          <div className="error-actions">
            <Link to="/" className="btn btn-primary">
              <Home size={18} />
              Go Home
            </Link>
            <Link to="/products/women" className="btn btn-outline">
              <ShoppingBag size={18} />
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NotFound

