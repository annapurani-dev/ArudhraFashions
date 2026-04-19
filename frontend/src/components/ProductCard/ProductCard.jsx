import { Link, useNavigate } from 'react-router-dom'
import { Heart, ShoppingCart, Star, Eye, Share2, Instagram, MessageCircle, GitCompare } from 'lucide-react'
import { useState, useEffect } from 'react'
import QuickView from '../QuickView/QuickView'
import { useToast } from '../Toast/ToastContainer'
import { wishlistAPI, cartAPI, compareAPI } from '../../utils/api'
import { useAuth } from '../../context/AuthContext'

function ProductCard({ product, compact = false }) {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [isInCompare, setIsInCompare] = useState(false)
  const [showQuickView, setShowQuickView] = useState(false)
  const [showShareMenu, setShowShareMenu] = useState(false)
  const { success, error: showError } = useToast()

  const productId = product._id || product.id

  // Check if product is in wishlist
  useEffect(() => {
    if (isAuthenticated && productId) {
      wishlistAPI.check(productId)
        .then(result => setIsWishlisted(result.isInWishlist))
        .catch(() => setIsWishlisted(false))
    }
  }, [isAuthenticated, productId])

  // Check if product is in compare list
  useEffect(() => {
    if (isAuthenticated && productId) {
      compareAPI.check(productId)
        .then(result => setIsInCompare(result.isInCompare || false))
        .catch(() => setIsInCompare(false))
    } else if (productId && !isAuthenticated) {
      // For guests, use localStorage as fallback
      const compareIds = JSON.parse(localStorage.getItem('compareItems') || '[]')
      setIsInCompare(compareIds.includes(productId))
    }
  }, [isAuthenticated, productId])

  const handleWishlist = async (e) => {
    e.preventDefault()
    e.stopPropagation()

    if (!isAuthenticated) {
      showError('Please login to add items to wishlist')
      navigate('/dashboard', { state: { tab: 'login', redirectPath: window.location.pathname } })
      return
    }

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        showError('Please login again')
        return
      }

      if (isWishlisted) {
        await wishlistAPI.remove(productId)
        setIsWishlisted(false)
        success('Removed from wishlist')
      } else {
        await wishlistAPI.add(productId)
        setIsWishlisted(true)
        success('Added to wishlist')
      }
      window.dispatchEvent(new Event('wishlistUpdated'))
    } catch (err) {
      console.error('Failed to update wishlist:', err)
      const errorMessage = err.message || 'Failed to update wishlist'
      showError(errorMessage)
      if (errorMessage.includes('authorized') || errorMessage.includes('401')) {
        showError('Session expired. Please login again.')
      }
    }
  }

  const handleAddToCart = async (e) => {
    e.preventDefault()
    e.stopPropagation()

    // If product has selectable options (sizes or colors), open quick view modal
    const hasOptions = (Array.isArray(product.inventory) && product.inventory.length > 0) ||
      (product.sizes && product.sizes.length > 0) ||
      (product.colors && product.colors.length > 0)
    if (hasOptions) {
      setShowQuickView(true)
      return
    }

    // For products without options, require authentication and add directly
    if (!isAuthenticated) {
      showError('Please login to add items to cart')
      navigate('/dashboard', { state: { tab: 'login', redirectPath: window.location.pathname } })
      return
    }

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        showError('Please login again')
        return
      }

      await cartAPI.addItem(productId, 1)
      success('Added to cart!')
      window.dispatchEvent(new Event('cartUpdated'))
    } catch (err) {
      console.error('Failed to add to cart:', err)
      const errorMessage = err.message || 'Failed to add to cart'
      showError(errorMessage)
      if (errorMessage.includes('authorized') || errorMessage.includes('401')) {
        showError('Session expired. Please login again.')
      }
    }
  }

  const handleShare = (platform, e) => {
    e.preventDefault()
    e.stopPropagation()
    const url = window.location.origin + `/product/${productId}`
    const text = `Check out ${product.name} at Arudhra Fashions!`

    if (platform === 'whatsapp') {
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`
      window.open(whatsappUrl, '_blank')
    } else if (platform === 'instagram') {
      navigator.clipboard.writeText(url)
      success('Link copied! Paste it in Instagram')
    }
    setShowShareMenu(false)
  }

  const handleCopyLink = (e) => {
    e.preventDefault()
    e.stopPropagation()
    const url = window.location.origin + `/product/${productId}`
    navigator.clipboard.writeText(url)
    success('Link copied to clipboard!')
    setShowShareMenu(false)
  }

  const handleCompare = async (e) => {
    e.preventDefault()
    e.stopPropagation()

    if (!isAuthenticated) {
      showError('Please login to add items to compare')
      navigate('/dashboard', { state: { tab: 'login', redirectPath: window.location.pathname } })
      return
    }

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        showError('Please login again')
        return
      }

      if (isInCompare) {
        await compareAPI.remove(productId)
        setIsInCompare(false)
        window.dispatchEvent(new Event('compareUpdated'))
        success('Removed from compare')
      } else {
        await compareAPI.add(productId)
        setIsInCompare(true)
        window.dispatchEvent(new Event('compareUpdated'))
        success('Added to compare')
      }
    } catch (err) {
      console.error('Failed to update compare:', err)
      const errorMessage = err.message || 'Failed to update compare'
      showError(errorMessage)
      if (errorMessage.includes('authorized') || errorMessage.includes('401')) {
        showError('Session expired. Please login again.')
      }
    }
  }

  // Calculate price - ensure it's always a number
  const getPrice = () => {
    if (product.price === null || product.price === undefined) return 0
    const priceValue = typeof product.price === 'number' ? product.price : parseFloat(product.price)
    return isNaN(priceValue) ? 0 : priceValue
  }

  const price = getPrice()
  const originalPrice = product.originalPrice
    ? (typeof product.originalPrice === 'number' ? product.originalPrice : parseFloat(product.originalPrice))
    : null

  // Calculate if actually in stock based on inventory if present
  const isInStock = product.inventory && Array.isArray(product.inventory)
    ? product.inventory.some(group => group.sizes && group.sizes.some(s => parseInt(s.stock) > 0))
    : product.inStock

  return (
    <>
      <div className="product-card-new">
        <Link to={`/product/${productId}`} className="product-link-new">
          <div className="product-image-wrapper-new">
            <img
              src={product.images?.[0] || product.image}
              alt={product.name}
              loading="lazy"
            />
            {product.onSale && <span className="product-badge product-badge-sale">Sale</span>}
            {product.new && <span className="product-badge product-badge-new">New</span>}
            {!isInStock && <span className="product-badge product-badge-soldout">Sold Out</span>}
            <div className="product-actions-new">
              <button
                className="product-action-btn-new"
                onClick={handleWishlist}
                aria-label="Add to wishlist"
              >
                <Heart size={18} fill={isWishlisted ? 'currentColor' : 'none'} />
              </button>
              <button
                className="product-action-btn-new"
                onClick={handleCompare}
                aria-label={isInCompare ? 'Remove from compare' : 'Add to compare'}
              >
                <GitCompare size={18} fill={isInCompare ? 'currentColor' : 'none'} />
              </button>
              <button
                className="product-action-btn-new"
                onClick={(e) => {
                  e.preventDefault()
                  setShowQuickView(true)
                }}
                aria-label="Quick view"
              >
                <Eye size={18} />
              </button>
              <div className="share-menu-wrapper-new">
                <button
                  className="product-action-btn-new"
                  onClick={(e) => {
                    e.preventDefault()
                    setShowShareMenu(!showShareMenu)
                  }}
                  aria-label="Share"
                >
                  <Share2 size={18} />
                </button>
                {showShareMenu && (
                  <div className="share-menu-new" onClick={(e) => e.stopPropagation()}>
                    <button onClick={(e) => handleShare('instagram', e)} className="share-option-new">
                      <Instagram size={16} />
                      Instagram
                    </button>
                    <button onClick={(e) => handleShare('whatsapp', e)} className="share-option-new">
                      <MessageCircle size={16} />
                      WhatsApp
                    </button>
                    <button onClick={handleCopyLink} className="share-option-new">
                      <Share2 size={16} />
                      Copy Link
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="product-info-new">
            <h3 className="product-name-new">{product.name}</h3>
            <p className="product-category-new">
              {product.category?.name || product.category}
              {product.subcategory && ` - ${product.subcategory?.name || product.subcategory}`}
            </p>
            {product.rating && !compact && (
              <div className="product-rating-new">
                <div className="stars-new">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={14}
                      fill={i < Math.floor(product.rating || 0) ? '#C89E7E' : 'none'}
                      color="#C89E7E"
                    />
                  ))}
                </div>
                <span className="rating-text-new">({product.reviews || 0})</span>
              </div>
            )}
            <div className="product-price-container-new">
              {originalPrice && originalPrice > price && originalPrice > 0 && (
                <span className="product-original-price-new">₹{originalPrice.toFixed(2)}</span>
              )}
              <span className="product-current-price-new">₹{price.toFixed(2)}</span>
            </div>
          </div>
        </Link>
        {!compact && (
          <button className="add-to-cart-btn-new" onClick={handleAddToCart}>
            <ShoppingCart size={16} />
            Add to Cart
          </button>
        )}
      </div>
      <QuickView product={product} isOpen={showQuickView} onClose={() => setShowQuickView(false)} />
    </>
  )
}

export default ProductCard
