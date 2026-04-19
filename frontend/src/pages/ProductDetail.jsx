import { useParams, Link, useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { Heart, ShoppingCart, ShoppingBag, Star, Share2, Minus, Plus, ChevronLeft, ChevronRight, Check, Package, Truck, RotateCcw, Shield, Instagram, MessageCircle, GitCompare, Edit2, Trash2, X } from 'lucide-react'
import ProductCard from '../components/ProductCard/ProductCard'
import Loading from '../components/Loading/Loading'
import { ProductDetailSkeleton } from '../components/Skeletons/PageSkeletons'
import { useToast } from '../components/Toast/ToastContainer'
import { productsAPI, cartAPI, wishlistAPI, compareAPI, authAPI, checkoutAPI } from '../utils/api'
import { useAuth } from '../context/AuthContext'
import { useLoginModal } from '../context/LoginModalContext'

function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const { openModal } = useLoginModal()
  const [product, setProduct] = useState(null)
  const [reviews, setReviews] = useState([])
  const [relatedProducts, setRelatedProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedSize, setSelectedSize] = useState('M')
  const [selectedColor, setSelectedColor] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [isInCompare, setIsInCompare] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewComment, setReviewComment] = useState('')
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)
  const [hasUserReviewed, setHasUserReviewed] = useState(false)
  const [editingReviewId, setEditingReviewId] = useState(null)
  const [editReviewRating, setEditReviewRating] = useState(0)
  const [editReviewComment, setEditReviewComment] = useState('')
  const [isUpdatingReview, setIsUpdatingReview] = useState(false)
  const [deletingReviewId, setDeletingReviewId] = useState(null)
  const { success, error: showError } = useToast()

  // Ref to track pending buy now action after login
  const pendingBuyNowRef = useRef(false)

  // Fetch product data
  useEffect(() => {
    const fetchProductData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch product
        const productData = await productsAPI.getById(id)
        setProduct(productData)

        // Set default color/size from inventory if available - prioritizing first available stock
        if (Array.isArray(productData.inventory) && productData.inventory.length > 0) {
          // Find first color group that has any stock
          const availableColorGroup = productData.inventory.find(group =>
            group.sizes && group.sizes.some(s => (parseInt(s.stock) || 0) > 0)
          ) || productData.inventory[0];

          setSelectedColor(availableColorGroup.colorName || '');

          if (availableColorGroup.sizes && availableColorGroup.sizes.length > 0) {
            // Find first size with stock within that color group
            const availableSize = availableColorGroup.sizes.find(s => (parseInt(s.stock) || 0) > 0);
            setSelectedSize(availableSize ? availableSize.size : availableColorGroup.sizes[0].size || '');
          }
        } else {
          // Fallback legacy support
          if (productData.colors && productData.colors.length > 0) {
            setSelectedColor(typeof productData.colors[0] === 'string'
              ? productData.colors[0]
              : productData.colors[0].name || productData.colors[0].value)
          }

          if (productData.sizes && productData.sizes.length > 0) {
            setSelectedSize(productData.sizes[0])
          }
        }

        // Fetch reviews
        try {
          const reviewsData = await productsAPI.getReviews(id)
          // Backend returns array directly, not wrapped in reviews property
          const reviewsList = Array.isArray(reviewsData) ? reviewsData : (reviewsData.reviews || [])
          setReviews(reviewsList)
        } catch (err) {
          console.error('Failed to fetch reviews:', err)
          setReviews([])
        }

        // Fetch related products
        try {
          const relatedData = await productsAPI.getRelated(id)
          // Backend returns array directly, not wrapped in products property
          setRelatedProducts(Array.isArray(relatedData) ? relatedData : (relatedData.products || []))
        } catch (err) {
          console.error('Failed to fetch related products:', err)
          setRelatedProducts([])
        }

        // Check if product is in wishlist (if authenticated)
        if (isAuthenticated) {
          try {
            const wishlist = await wishlistAPI.getAll()
            setIsWishlisted(wishlist.some(item => item.product?._id === id || item.productId === id))
          } catch (err) {
            console.error('Failed to check wishlist:', err)
          }
        }
      } catch (err) {
        console.error('Failed to fetch product:', err)
        setError('Failed to load product. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchProductData()
    }
  }, [id, isAuthenticated])

  const [currentUserId, setCurrentUserId] = useState(null)

  // Get current user ID
  useEffect(() => {
    const getCurrentUserId = async () => {
      if (isAuthenticated) {
        try {
          const token = localStorage.getItem('token')
          if (token) {
            const userData = await authAPI.getMe()
            setCurrentUserId(userData.id || userData._id)
          }
        } catch (err) {
          console.error('Failed to get current user:', err)
          setCurrentUserId(null)
        }
      } else {
        setCurrentUserId(null)
      }
    }
    getCurrentUserId()
  }, [isAuthenticated])

  // Check if logged-in user has already reviewed this product
  useEffect(() => {
    if (currentUserId && reviews.length > 0) {
      const userReviewed = reviews.some(review => {
        const reviewUserId = review.userId || review.user?._id || review.user?.id
        return reviewUserId?.toString() === currentUserId?.toString()
      })
      setHasUserReviewed(userReviewed)
    } else {
      setHasUserReviewed(false)
    }
  }, [reviews, currentUserId])

  // Match product-info-wrapper height to product-images container
  useEffect(() => {
    if (!product) return

    const matchHeights = () => {
      const productImagesEl = document.querySelector('.product-images')
      const productInfoWrapperEl = document.querySelector('.product-info-wrapper')

      if (productImagesEl && productInfoWrapperEl) {
        const imagesHeight = productImagesEl.offsetHeight
        productInfoWrapperEl.style.minHeight = `${imagesHeight}px`
      }
    }

    // Use setTimeout to ensure DOM is fully rendered
    const timeoutId = setTimeout(matchHeights, 100)
    window.addEventListener('resize', matchHeights)

    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('resize', matchHeights)
    }
  }, [product])

  const nextImage = () => {
    if (productImages && productImages.length > 0) {
      setSelectedImageIndex((prev) => (prev + 1) % productImages.length)
    }
  }

  const prevImage = () => {
    if (productImages && productImages.length > 0) {
      setSelectedImageIndex((prev) => (prev - 1 + productImages.length) % productImages.length)
    }
  }

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      showError('Please login to add items to cart')
      navigate('/dashboard', { state: { tab: 'login', redirectPath: window.location.pathname } })
      return
    }

    if (isOutOfStock) {
      showError('Sorry, this variant is out of stock')
      return
    }

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        showError('Please login again')
        return
      }

      await cartAPI.addItem(id, quantity, selectedSize, selectedColor)
      success('Product added to cart!')
      // Dispatch cart update event
      window.dispatchEvent(new Event('cartUpdated'))
    } catch (err) {
      console.error('Failed to add to cart:', err)
      const errorMessage = err.message || 'Failed to add product to cart'
      showError(errorMessage)
      // If unauthorized, might need to re-login
      if (errorMessage.includes('authorized') || errorMessage.includes('401')) {
        showError('Session expired. Please login again.')
      }
    }
  }

  // Watch for authentication changes to complete pending buy now
  useEffect(() => {
    if (isAuthenticated && pendingBuyNowRef.current) {
      pendingBuyNowRef.current = false
      // User just logged in, proceed with buy now
      proceedWithBuyNow()
    }
  }, [isAuthenticated])

  // Actual buy now logic after authentication
  const proceedWithBuyNow = async () => {
    if (isOutOfStock) {
      showError('Selected variant is out of stock')
      return
    }

    try {
      const resp = await checkoutAPI.initiate(id, quantity, selectedSize, selectedColor)
      const session = resp.session || resp
      if (!session) {
        showError('Failed to initiate checkout')
        return
      }
      // Navigate to checkout page with one-off session data
      navigate('/checkout', { state: { buyNowSession: session } })
    } catch (err) {
      console.error('Buy Now error:', err)
      const errorMessage = err.message || 'Failed to initiate checkout'
      showError(errorMessage)
    }
  }

  const handleBuyNow = async () => {
    if (isOutOfStock) {
      showError('Selected variant is out of stock')
      return
    }

    // Check if user is authenticated
    if (!isAuthenticated) {
      // Store intent to buy now after login
      pendingBuyNowRef.current = true
      // Open login modal - user can login or register
      openModal('login')
      return
    }

    // User is authenticated, proceed directly
    await proceedWithBuyNow()
  }

  const handleToggleWishlist = async () => {
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
        await wishlistAPI.remove(id)
        setIsWishlisted(false)
        success('Removed from wishlist')
      } else {
        await wishlistAPI.add(id)
        setIsWishlisted(true)
        success('Added to wishlist')
      }
      // Dispatch wishlist update event
      window.dispatchEvent(new Event('wishlistUpdated'))
    } catch (err) {
      console.error('Failed to update wishlist:', err)
      const errorMessage = err.message || 'Failed to update wishlist'
      showError(errorMessage)
      // If unauthorized, might need to re-login
      if (errorMessage.includes('authorized') || errorMessage.includes('401')) {
        showError('Session expired. Please login again.')
      }
    }
  }

  // Check if product is in compare list
  useEffect(() => {
    const checkCompareStatus = async () => {
      if (id && isAuthenticated) {
        try {
          const response = await compareAPI.check(id)
          setIsInCompare(response.isInCompare || false)
        } catch (err) {
          console.error('Failed to check compare status:', err)
          setIsInCompare(false)
        }
      } else if (id && !isAuthenticated) {
        // For guests, use localStorage as fallback
        const compareIds = JSON.parse(localStorage.getItem('compareItems') || '[]')
        setIsInCompare(compareIds.includes(id))
      }
    }
    checkCompareStatus()
  }, [id, isAuthenticated])

  const handleSubmitReview = async () => {
    if (!isAuthenticated) {
      showError('Please login to add a review')
      return
    }

    if (reviewRating === 0) {
      showError('Please select a rating')
      return
    }

    if (!reviewComment.trim()) {
      showError('Please enter a review comment')
      return
    }

    try {
      setIsSubmittingReview(true)
      const newReview = await productsAPI.addReview(id, reviewRating, reviewComment)

      // Refresh reviews list
      const reviewsData = await productsAPI.getReviews(id)
      const reviewsList = Array.isArray(reviewsData) ? reviewsData : (reviewsData.reviews || [])
      setReviews(reviewsList)

      // Refresh product to get updated rating
      const updatedProduct = await productsAPI.getById(id)
      setProduct(updatedProduct)

      // Reset form
      setReviewRating(0)
      setReviewComment('')
      setHasUserReviewed(true)

      success('Review submitted successfully!')
    } catch (err) {
      console.error('Failed to submit review:', err)
      showError(err.message || 'Failed to submit review')
    } finally {
      setIsSubmittingReview(false)
    }
  }

  const handleEditReview = (review) => {
    setEditingReviewId(review._id || review.id)
    setEditReviewRating(review.rating || 0)
    setEditReviewComment(review.comment || '')
  }

  const handleCancelEdit = () => {
    setEditingReviewId(null)
    setEditReviewRating(0)
    setEditReviewComment('')
  }

  const handleUpdateReview = async (reviewId) => {
    if (editReviewRating === 0) {
      showError('Please select a rating')
      return
    }

    if (!editReviewComment.trim()) {
      showError('Please enter a review comment')
      return
    }

    try {
      setIsUpdatingReview(true)
      await productsAPI.updateReview(id, reviewId, editReviewRating, editReviewComment)

      // Refresh reviews list
      const reviewsData = await productsAPI.getReviews(id)
      const reviewsList = Array.isArray(reviewsData) ? reviewsData : (reviewsData.reviews || [])
      setReviews(reviewsList)

      // Refresh product to get updated rating
      const updatedProduct = await productsAPI.getById(id)
      setProduct(updatedProduct)

      // Reset edit form
      setEditingReviewId(null)
      setEditReviewRating(0)
      setEditReviewComment('')

      success('Review updated successfully!')
    } catch (err) {
      console.error('Failed to update review:', err)
      showError(err.message || 'Failed to update review')
    } finally {
      setIsUpdatingReview(false)
    }
  }

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
      return
    }

    try {
      setDeletingReviewId(reviewId)
      await productsAPI.deleteReview(id, reviewId)

      // Refresh reviews list
      const reviewsData = await productsAPI.getReviews(id)
      const reviewsList = Array.isArray(reviewsData) ? reviewsData : (reviewsData.reviews || [])
      setReviews(reviewsList)

      // Refresh product to get updated rating
      const updatedProduct = await productsAPI.getById(id)
      setProduct(updatedProduct)

      // Check if user still has a review
      if (reviewsList.length > 0) {
        const token = localStorage.getItem('token')
        if (token) {
          try {
            const userData = await authAPI.getMe()
            const userReviewed = reviewsList.some(review => {
              const reviewUserId = review.userId || review.user?._id || review.user?.id
              const currentUserId = userData.id || userData._id
              return reviewUserId?.toString() === currentUserId?.toString()
            })
            setHasUserReviewed(userReviewed)
          } catch (err) {
            console.error('Failed to check user review status:', err)
          }
        }
      } else {
        setHasUserReviewed(false)
      }

      success('Review deleted successfully!')
    } catch (err) {
      console.error('Failed to delete review:', err)
      showError(err.message || 'Failed to delete review')
    } finally {
      setDeletingReviewId(null)
    }
  }

  const handleToggleCompare = async () => {
    if (!isAuthenticated) {
      showError('Please login to add items to compare')
      navigate('/dashboard', { state: { tab: 'login', redirectPath: window.location.pathname } })
      return
    }

    try {
      if (isInCompare) {
        // Remove from compare
        await compareAPI.remove(id)
        setIsInCompare(false)
        // Dispatch event to update header count
        window.dispatchEvent(new Event('compareUpdated'))
        success('Removed from compare')
      } else {
        // Add to compare (max 4 items handled by backend)
        await compareAPI.add(id)
        setIsInCompare(true)
        // Dispatch event to update header count
        window.dispatchEvent(new Event('compareUpdated'))
        success('Added to compare')
      }
    } catch (err) {
      console.error('Failed to update compare:', err)
      const errorMessage = err.message || 'Failed to update compare'
      showError(errorMessage)
      // If unauthorized, might need to re-login
      if (errorMessage.includes('authorized') || errorMessage.includes('401')) {
        showError('Session expired. Please login again.')
      }
    }
  }

  if (loading) {
    return (
      <div className="product-detail-page">
        <div className="container">
          <ProductDetailSkeleton />
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="product-detail-page">
        <div className="container">
          <div className="error-message">
            <p>{error || 'Product not found'}</p>
            <Link to="/products" className="btn btn-primary">Back to Products</Link>
          </div>
        </div>
      </div>
    )
  }

  // NEW INVENTORY LOGIC: Normalize product data for display
  const inventory = Array.isArray(product.inventory) ? product.inventory : []

  // Find the current selected color group
  const colorGroup = inventory.find(group =>
    (group.colorName || '') === (selectedColor || '')
  ) || inventory[0]

  // Use color-specific images if available, otherwise fallback to global images
  const productImages = colorGroup?.images && colorGroup.images.length > 0
    ? colorGroup.images
    : product.images && product.images.length > 0
      ? product.images
      : product.image
        ? [product.image]
        : ['https://via.placeholder.com/600x800']

  // Available colors are derived from the inventory groups that have a name
  const productColors = inventory
    .filter(item => item.colorName !== null && item.colorName !== undefined && item.colorName !== '')
    .map(item => item.colorName)

  // Available sizes are derived from the selected color's sizes array
  const productSizes = colorGroup?.sizes || []

  // Check stock for the currently selected variant
  const selectedVariantSizeObj = productSizes.find(s => s.size === selectedSize)
  const availableStock = selectedVariantSizeObj ? (parseInt(selectedVariantSizeObj.stock) || 0) : 0
  const isOutOfStock = inventory.length > 0 ? availableStock <= 0 : !product.inStock

  // Helper to change color and auto-select first available size for that color
  const handleColorChange = (colorName) => {
    setSelectedColor(colorName)
    const newGroup = inventory.find(g => g.colorName === colorName)
    if (newGroup && newGroup.sizes && newGroup.sizes.length > 0) {
      // Find first size that has stock
      const availableSize = newGroup.sizes.find(s => (parseInt(s.stock) || 0) > 0)
      setSelectedSize(availableSize ? availableSize.size : newGroup.sizes[0].size || '')
    }
    setSelectedImageIndex(0) // Reset to first image of new color
  }


  return (
    <div className="product-detail-page">
      <div className="container">
        {/* Breadcrumb */}
        <nav className="breadcrumb">
          <Link to="/">Home</Link>
          <span>/</span>
          {product.category && (
            <>
              <Link to={`/products/${product.category.slug || product.category.name?.toLowerCase() || 'category'}`}>
                {product.category.name || product.category}
              </Link>
              <span>/</span>
            </>
          )}
          {product.subcategory && (
            <>
              <Link to={`/products/${product.category?.slug || product.category?.name?.toLowerCase() || 'category'}/${product.subcategory.slug || product.subcategory.name?.toLowerCase() || 'subcategory'}`}>
                {product.subcategory.name || product.subcategory}
              </Link>
              <span>/</span>
            </>
          )}
          <span>{product.name}</span>
        </nav>

        <div className="product-detail">
          <div className="product-images">
            <div className="main-image-wrapper">
              <div className="main-image">
                <img
                  src={productImages[selectedImageIndex]}
                  alt={product.name}
                  className="fade-in"
                  key={selectedImageIndex}
                  onLoad={(e) => e.currentTarget.classList.remove('fade-in')}
                  onError={(e) => e.currentTarget.classList.remove('fade-in')}
                />
                {product.onSale && <span className="sale-badge">Sale</span>}
                {product.new && <span className="new-badge">New</span>}
                {isOutOfStock && <span className="soldout-badge">Sold Out</span>}
                {productImages.length > 1 && (
                  <>
                    <button className="image-nav-btn prev-btn" onClick={prevImage} aria-label="Previous image">
                      <ChevronLeft size={24} />
                    </button>
                    <button className="image-nav-btn next-btn" onClick={nextImage} aria-label="Next image">
                      <ChevronRight size={24} />
                    </button>
                  </>
                )}
              </div>
            </div>
            {productImages.length > 1 && (
              <div className="thumbnail-images">
                {productImages.map((img, idx) => (
                  <button
                    key={idx}
                    className={`thumbnail-btn ${selectedImageIndex === idx ? 'active' : ''}`}
                    onClick={() => setSelectedImageIndex(idx)}
                  >
                    <img src={img} alt={`${product.name} ${idx + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="product-info-wrapper">
            <div className="product-info">
              <div className="product-header">
                <div className="product-header-top">
                  <div className="product-title-section">
                    <span className="product-brand">{product.brand || 'Arudhra Fashions'}</span>
                    <h1>{product.name}</h1>
                    <div className="product-rating">
                      <div className="stars">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={18}
                            fill={i < Math.floor(product.rating || 0) ? '#C89E7E' : 'none'}
                            color="#C89E7E"
                          />
                        ))}
                      </div>
                      <span className="rating-text">({product.reviews || 0} reviews)</span>
                    </div>
                  </div>
                  <div className="product-share-wrapper">
                    <button
                      className="product-share-btn"
                      onClick={() => setShowShareMenu(!showShareMenu)}
                      aria-label="Share product"
                    >
                      <Share2 size={20} />
                      Share
                    </button>
                    {showShareMenu && (
                      <div className="product-share-menu">
                        <button onClick={() => {
                          const url = window.location.href
                          navigator.clipboard.writeText(url)
                          setShowShareMenu(false)
                          success('Link copied! Paste it in Instagram')
                        }} className="share-menu-item">
                          <Instagram size={18} />
                          Instagram
                        </button>
                        <button onClick={() => {
                          const url = window.location.href
                          const text = `Check out ${product.name} at Arudhra Fashions!`
                          const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`
                          window.open(whatsappUrl, '_blank')
                          setShowShareMenu(false)
                          success('Opening WhatsApp...')
                        }} className="share-menu-item">
                          <MessageCircle size={18} />
                          WhatsApp
                        </button>
                        <button onClick={() => {
                          navigator.clipboard.writeText(window.location.href)
                          setShowShareMenu(false)
                          success('Link copied to clipboard!')
                        }} className="share-menu-item">
                          <Share2 size={18} />
                          Copy Link
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="product-price-section">
                <div className="product-price">
                  {product.originalPrice && typeof product.originalPrice === 'number' && (
                    <span className="original-price">₹{product.originalPrice.toFixed(2)}</span>
                  )}
                  <span className="current-price">₹{(typeof product.price === 'number' ? product.price : parseFloat(product.price) || 0).toFixed(2)}</span>
                  {product.onSale && product.originalPrice && typeof product.originalPrice === 'number' && (
                    <span className="discount-badge">
                      {Math.round(((product.originalPrice - (typeof product.price === 'number' ? product.price : parseFloat(product.price) || 0)) / product.originalPrice) * 100)}% OFF
                    </span>
                  )}
                </div>
              </div>

              <p className="product-description">{product.description}</p>

              {/* Material and Care Instructions */}
              {(product.material || product.care) && (
                <div className="product-material-care">
                  {product.material && (
                    <div className="material-care-item">
                      <strong>Material:</strong>
                      <span>{product.material}</span>
                    </div>
                  )}
                  {product.care && (
                    <div className="material-care-item">
                      <strong>Care Instructions:</strong>
                      <span>{product.care}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="product-options">
                {productSizes.length > 0 && productSizes.some(s => s.size !== null && s.size !== '') && (
                  <div className="option-group">
                    <label>Size</label>
                    <div className="size-options">
                      {productSizes.map((sizeObj, idx) => {
                        const sizeValue = sizeObj.size
                        const stock = parseInt(sizeObj.stock) || 0
                        const isSoldOut = stock <= 0

                        return (
                          <button
                            key={sizeValue || idx}
                            className={`size-btn ${selectedSize === sizeValue ? 'active' : ''} ${isSoldOut ? 'sold-out' : ''}`}
                            onClick={() => setSelectedSize(sizeValue)}
                            title={isSoldOut ? 'Out of Stock' : ''}
                          >
                            {sizeValue}
                            {isSoldOut && <span className="size-sold-out-slash"></span>}
                          </button>
                        )
                      })}
                    </div>
                    <Link to="/size-guide" className="size-guide-link">
                      Size Guide
                    </Link>
                  </div>
                )}

                {productColors.length > 0 && (
                  <div className="option-group">
                    <label>Color</label>
                    <div className="color-options">
                      {productColors.map((colorName, idx) => {
                        const isSelected = selectedColor === colorName

                        return (
                          <button
                            key={colorName || idx}
                            className={`color-btn ${isSelected ? 'active' : ''}`}
                            onClick={() => handleColorChange(colorName)}
                            title={colorName}
                          >
                            {/* Use text label for dynamic colors if no hex value exists */}
                            <span className="color-label-text">{colorName}</span>
                            {isSelected && <span className="check-mark">✓</span>}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                <div className="option-group">
                  <label>Quantity</label>
                  <div className="quantity-selector">
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                      <Minus size={16} />
                    </button>
                    <span>{quantity}</span>
                    <button onClick={() => setQuantity(quantity + 1)}>
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="product-actions">
                <button
                  className="btn btn-primary btn-large add-to-cart-btn-main"
                  onClick={handleBuyNow}
                  disabled={isOutOfStock}
                >
                  <ShoppingBag size={20} />
                  {!isOutOfStock ? 'Buy Now' : 'Out of Stock'}
                </button>
                <div className="product-actions-secondary">
                  <button
                    className="btn btn-icon"
                    onClick={handleToggleWishlist}
                    title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                  >
                    <Heart size={20} fill={isWishlisted ? 'currentColor' : 'none'} />
                  </button>
                  <button
                    className="btn btn-icon"
                    onClick={handleToggleCompare}
                    title={isInCompare ? 'Remove from compare' : 'Add to compare'}
                  >
                    <GitCompare size={20} fill={isInCompare ? 'currentColor' : 'none'} />
                  </button>
                  <button
                    className="btn btn-icon"
                    onClick={handleAddToCart}
                    title={!isOutOfStock ? "Add to cart" : "Out of Stock"}
                    disabled={isOutOfStock}
                  >
                    <ShoppingCart size={20} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="product-tabs-section">
          <div className="reviews-header">
            <h3>Customer Reviews</h3>
            <div className="average-rating">
              <div className="rating-display">
                <span className="rating-number">{product.rating || 0}</span>
                <div className="stars">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={20}
                      fill={i < Math.floor(product.rating || 0) ? '#C89E7E' : 'none'}
                      color="#C89E7E"
                    />
                  ))}
                </div>
                <span className="review-count">Based on {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}</span>
              </div>
            </div>
          </div>

          {/* Add Review Form - Only for logged-in users */}
          {isAuthenticated && !hasUserReviewed && (
            <div className="add-review-section">
              <h4>Write a Review</h4>
              <div className="add-review-form">
                <div className="review-rating-input">
                  <label>Your Rating</label>
                  <div className="rating-stars-input">
                    {[...Array(5)].map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        className="rating-star-btn"
                        onClick={() => setReviewRating(i + 1)}
                        onMouseEnter={() => { }}
                      >
                        <Star
                          size={28}
                          fill={i < reviewRating ? '#C89E7E' : 'none'}
                          color="#C89E7E"
                          style={{ cursor: 'pointer' }}
                        />
                      </button>
                    ))}
                    {reviewRating > 0 && (
                      <span className="rating-value-text">{reviewRating} {reviewRating === 1 ? 'star' : 'stars'}</span>
                    )}
                  </div>
                </div>
                <div className="review-comment-input">
                  <label htmlFor="review-comment">Your Review</label>
                  <textarea
                    id="review-comment"
                    className="review-textarea"
                    placeholder="Share your experience with this product..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    rows={5}
                  />
                </div>
                <button
                  className="btn btn-primary submit-review-btn"
                  onClick={handleSubmitReview}
                  disabled={isSubmittingReview || reviewRating === 0 || !reviewComment.trim()}
                >
                  {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </div>
          )}

          {isAuthenticated && hasUserReviewed && (
            <div className="review-already-submitted">
              <p>You have already reviewed this product.</p>
            </div>
          )}

          {!isAuthenticated && (
            <div className="review-login-prompt">
              <p>Please <Link to="/dashboard" className="login-link">login</Link> to add a review.</p>
            </div>
          )}

          <div className="reviews-list">
            <h4 className="reviews-list-title">All Reviews</h4>
            {reviews.length > 0 ? (
              reviews.map(review => {
                const reviewId = review._id || review.id
                const reviewerName = review.userName || review.user?.name || review.name || 'Anonymous'
                const reviewDate = review.createdAt
                  ? new Date(review.createdAt).toLocaleDateString()
                  : review.date || 'N/A'

                // Check if this review belongs to the logged-in user
                const reviewUserId = review.userId || review.user?._id || review.user?.id
                const isOwnReview = currentUserId && reviewUserId?.toString() === currentUserId?.toString()
                const isEditing = editingReviewId === reviewId

                return (
                  <div key={reviewId} className="review-item">
                    <div className="review-header">
                      <div>
                        <strong>{reviewerName}</strong>
                        {!isEditing && (
                          <div className="review-rating">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                size={14}
                                fill={i < (review.rating || 0) ? '#C89E7E' : 'none'}
                                color="#C89E7E"
                              />
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="review-header-right">
                        <span className="review-date">{reviewDate}</span>
                        {isOwnReview && !isEditing && (
                          <div className="review-actions">
                            <button
                              className="review-action-btn edit-btn"
                              onClick={() => handleEditReview(review)}
                              title="Edit review"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              className="review-action-btn delete-btn"
                              onClick={() => handleDeleteReview(reviewId)}
                              disabled={deletingReviewId === reviewId}
                              title="Delete review"
                            >
                              {deletingReviewId === reviewId ? (
                                <span className="loading-dots"><span>.</span><span>.</span><span>.</span></span>
                              ) : (
                                <Trash2 size={16} />
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {isEditing ? (
                      <div className="edit-review-form">
                        <div className="review-rating-input">
                          <label>Your Rating</label>
                          <div className="rating-stars-input">
                            {[...Array(5)].map((_, i) => (
                              <button
                                key={i}
                                type="button"
                                className="rating-star-btn"
                                onClick={() => setEditReviewRating(i + 1)}
                              >
                                <Star
                                  size={24}
                                  fill={i < editReviewRating ? '#C89E7E' : 'none'}
                                  color="#C89E7E"
                                  style={{ cursor: 'pointer' }}
                                />
                              </button>
                            ))}
                            {editReviewRating > 0 && (
                              <span className="rating-value-text">{editReviewRating} {editReviewRating === 1 ? 'star' : 'stars'}</span>
                            )}
                          </div>
                        </div>
                        <div className="review-comment-input">
                          <label htmlFor={`edit-review-comment-${reviewId}`}>Your Review</label>
                          <textarea
                            id={`edit-review-comment-${reviewId}`}
                            className="review-textarea"
                            placeholder="Share your experience with this product..."
                            value={editReviewComment}
                            onChange={(e) => setEditReviewComment(e.target.value)}
                            rows={5}
                          />
                        </div>
                        <div className="edit-review-actions">
                          <button
                            className="btn btn-primary"
                            onClick={() => handleUpdateReview(reviewId)}
                            disabled={isUpdatingReview || editReviewRating === 0 || !editReviewComment.trim()}
                          >
                            {isUpdatingReview ? 'Updating...' : 'Update Review'}
                          </button>
                          <button
                            className="btn btn-secondary"
                            onClick={handleCancelEdit}
                            disabled={isUpdatingReview}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="review-comment">{review.comment || ''}</p>
                    )}
                  </div>
                )
              })
            ) : (
              <p className="no-reviews-message">No reviews yet. Be the first to review this product!</p>
            )}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="related-products-section">
            <h2>You May Also Like</h2>
            <div className="related-products-grid">
              {relatedProducts.slice(0, 3).map(product => (
                <ProductCard key={product._id || product.id} product={product} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProductDetail

