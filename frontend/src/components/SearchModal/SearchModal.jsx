import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, X, Loader2 } from 'lucide-react'
import { productsAPI } from '../../utils/api'
import './SearchModal.css'

function SearchModal({ isOpen, onClose }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const inputRef = useRef(null)
  const modalRef = useRef(null)
  const searchTimeoutRef = useRef(null)

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        onClose()
      }
    }
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  // Debounced search
  const performSearch = useCallback(async (query) => {
    if (!query.trim()) {
      setResults([])
      setHasSearched(false)
      return
    }

    setLoading(true)
    setHasSearched(true)
    
    try {
      const response = await productsAPI.getAll({ 
        search: query.trim(),
        limit: 20
      })
      setResults(response.products || [])
    } catch (err) {
      console.error('Search error:', err)
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Handle input change with debounce
  const handleInputChange = (e) => {
    const value = e.target.value
    setSearchQuery(value)
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    
    // Set new timeout for debounced search
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(value)
    }, 300)
  }

  // Handle form submit
  const handleSubmit = (e) => {
    e.preventDefault()
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    performSearch(searchQuery)
  }

  // Clear search
  const handleClear = () => {
    setSearchQuery('')
    setResults([])
    setHasSearched(false)
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  // Get image URL helper
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null
    if (imagePath.startsWith('http')) return imagePath
    const base = import.meta.env.VITE_API_URL || (import.meta.env.MODE === 'production' ? 'https://api.arudhrafashions.com/api' : 'http://localhost:5001/api')
    return `${base.replace('/api', '')}${imagePath.startsWith('/') ? imagePath : '/' + imagePath}`
  }

  // Navigate to product and close modal
  const handleProductClick = (productId) => {
    window.location.href = `/product/${productId}`
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="search-modal-overlay">
      <div className="search-modal" ref={modalRef}>
        {/* Search Input */}
        <form className="search-modal-input-wrapper" onSubmit={handleSubmit}>
          <Search size={22} className="search-modal-icon" />
          <input
            ref={inputRef}
            type="text"
            className="search-modal-input"
            placeholder="Search for products..."
            value={searchQuery}
            onChange={handleInputChange}
          />
        </form>

        {/* Results Container */}
        <div className="search-modal-results">
          {loading ? (
            <div className="search-modal-loading">
              <Loader2 size={32} className="search-modal-spinner" />
              <p>Searching...</p>
            </div>
          ) : hasSearched && results.length === 0 ? (
            <div className="search-modal-empty">
              <div className="search-modal-empty-icon">🔍</div>
              <p>No products found for "{searchQuery}"</p>
              <span>Try a different search term</span>
            </div>
          ) : results.length > 0 ? (
            <>
              <div className="search-modal-header">
                <span>{results.length} result{results.length !== 1 ? 's' : ''} found</span>
              </div>
              <div className="search-modal-products">
                {results.map((product) => (
                  <div
                    key={product.id || product._id}
                    className="search-modal-product"
                    onClick={() => handleProductClick(product.id || product._id)}
                  >
                    <div className="search-modal-product-image">
                      {product.images?.[0] || product.image ? (
                        <img
                          src={getImageUrl(product.images?.[0] || product.image)}
                          alt={product.name}
                          loading="lazy"
                        />
                      ) : (
                        <div className="search-modal-product-placeholder">
                          <span>No Image</span>
                        </div>
                      )}
                    </div>
                    <div className="search-modal-product-info">
                      <h4 className="search-modal-product-name">{product.name}</h4>
                      <div className="search-modal-product-meta">
                        <span className="search-modal-product-category">
                          {product.category?.name || product.category}
                        </span>
                        <span className="search-modal-product-price">
                          ₹{product.price?.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="search-modal-hint">
              <Search size={48} className="search-modal-hint-icon" />
              <p>Type to search for products</p>
            </div>
          )}
        </div>

        {/* Close Button */}
        <button className="search-modal-close" onClick={onClose}>
          <X size={24} />
        </button>
      </div>
    </div>
  )
}

export default SearchModal
