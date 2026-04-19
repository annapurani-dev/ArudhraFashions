import { Link } from 'react-router-dom'
import { RefreshCw, Home } from 'lucide-react'

function ServerError() {
  return (
    <div className="error-page server-error-page">
      <div className="container">
        <div className="error-content">
          <div className="error-code">500</div>
          <h1>Server Error</h1>
          <p>Something went wrong on our end. We're working to fix it. Please try again later.</p>
          <div className="error-actions">
            <button onClick={() => window.location.reload()} className="btn btn-primary">
              <RefreshCw size={18} />
              Refresh Page
            </button>
            <Link to="/" className="btn btn-outline">
              <Home size={18} />
              Go Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ServerError

