import { Link, useNavigate } from 'react-router-dom'
import { X, Star, ShoppingCart, GitCompare, ChevronLeft, ChevronRight, Eye } from 'lucide-react'
import { useState } from 'react'
import { cartAPI } from '../utils/api'
import { useToast } from '../components/Toast/ToastContainer'
import Loading from '../components/Loading/Loading'
import { CompareSkeleton } from '../components/Skeletons/PageSkeletons'

function CompareMobile({ compareItems, loading, removeFromCompare, isAuthenticated }) {
  const navigate = useNavigate()
  const { success, error: showError } = useToast()
  const [currentPairIndex, setCurrentPairIndex] = useState(0)

  // Group products into pairs (2 products per comparison)
  const productPairs = []
  for (let i = 0; i < compareItems.length; i += 2) {
    productPairs.push(compareItems.slice(i, i + 2))
  }

  const currentPair = productPairs[currentPairIndex] || []
  const hasMultiplePairs = productPairs.length > 1

  const goToNextPair = () => {
    if (currentPairIndex < productPairs.length - 1) {
      setCurrentPairIndex(currentPairIndex + 1)
    }
  }

  const goToPrevPair = () => {
    if (currentPairIndex > 0) {
      setCurrentPairIndex(currentPairIndex - 1)
    }
  }

  const comparisonFields = [
    { key: 'price', label: 'Price' },
    { key: 'rating', label: 'Rating' },
    { key: 'reviews', label: 'Reviews' },
    { key: 'brand', label: 'Brand' },
    { key: 'material', label: 'Material' },
    { key: 'care', label: 'Care Instructions' },
    { key: 'sizes', label: 'Available Sizes' },
    { key: 'colors', label: 'Available Colors' },
    { key: 'inStock', label: 'In Stock' }
  ]

  const getFieldValue = (item, fieldKey) => {
    const itemId = item._id || item.id
    
    switch (fieldKey) {
      case 'price':
        const productPrice = typeof item.price === 'number' ? item.price : parseFloat(item.price) || 0
        const productOriginalPrice = typeof item.originalPrice === 'number' ? item.originalPrice : null
        return { type: 'price', price: productPrice, originalPrice: productOriginalPrice }
      
      case 'rating':
        return { type: 'rating', rating: item.rating || 0 }
      
      case 'reviews':
        return { type: 'text', value: `${item.reviews?.length || 0} reviews` }
      
      case 'brand':
        return { type: 'text', value: item.brand || 'N/A' }
      
      case 'material':
        return { type: 'text', value: item.material || 'N/A' }
      
      case 'care':
        return { type: 'text', value: item.care || 'N/A' }
      
      case 'sizes':
        return { type: 'sizes', sizes: item.sizes || [] }
      
      case 'colors':
        return { type: 'colors', colors: item.colors || [] }
      
      case 'inStock':
        const inStock = item.inStock !== false && (item.stockCount || 0) > 0
        return { type: 'stock', inStock }
      
      default:
        return { type: 'text', value: 'N/A' }
    }
  }

  const handleAddToCart = async (itemId) => {
    if (!isAuthenticated) {
      showError('Please login to add items to cart')
      navigate('/dashboard', { state: { tab: 'login', redirectPath: window.location.pathname } })
      return
    }
    try {
      await cartAPI.addItem(itemId, 1)
      success('Added to cart!')
      window.dispatchEvent(new Event('cartUpdated'))
    } catch (err) {
      console.error('Failed to add to cart:', err)
      showError('Failed to add to cart')
    }
  }

  if (loading) {
    return (
      <div className="compare-products-page-mobile">
        <div className="container">
          <CompareSkeleton />
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="compare-products-page-mobile">
        <div className="container">
          <div className="compare-header-mobile">
            <div className="compare-header-content-mobile">
              <h1>Compare Products</h1>
              <p>Compare up to 4 products side by side</p>
            </div>
          </div>
          <div className="empty-compare-mobile">
            <div className="empty-compare-content">
              <div className="empty-compare-icon">
                <GitCompare size={64} />
              </div>
              <h2>Please Login to View Compare List</h2>
              <p>Login to save products to your compare list</p>
              <Link to="/dashboard" className="btn btn-primary btn-large">
                Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (compareItems.length === 0) {
    return (
      <div className="compare-products-page-mobile">
        <div className="container">
          <div className="compare-header-mobile">
            <div className="compare-header-content-mobile">
              <h1>Compare Products</h1>
              <p>Compare up to 4 products side by side</p>
            </div>
          </div>
          <div className="empty-compare-mobile">
            <div className="empty-compare-content">
              <div className="empty-compare-icon">
                <GitCompare size={64} />
              </div>
              <h2>No products to compare</h2>
              <p>Add products to compare by clicking the compare button on product pages</p>
              <p className="empty-compare-hint">You can compare up to 4 products at a time</p>
              <Link to="/products" className="btn btn-primary btn-large">
                Start Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="compare-products-page-mobile">
      <div className="container">
        <div className="compare-header-mobile">
          <div className="compare-header-content-mobile">
            <h1>Compare Products</h1>
            <p>Compare up to 4 products side by side</p>
            <div className="compare-count-badge-mobile">
              {compareItems.length} {compareItems.length === 1 ? 'Product' : 'Products'}
            </div>
          </div>
        </div>

        {/* Pair Navigation */}
        {hasMultiplePairs && (
          <div className="compare-pair-navigation-mobile">
            <button
              className="pair-nav-btn"
              onClick={goToPrevPair}
              disabled={currentPairIndex === 0}
              aria-label="Previous pair"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="pair-indicator-mobile">
              <span className="pair-current">{currentPairIndex + 1}</span>
              <span className="pair-separator">/</span>
              <span className="pair-total">{productPairs.length}</span>
            </div>
            <button
              className="pair-nav-btn"
              onClick={goToNextPair}
              disabled={currentPairIndex === productPairs.length - 1}
              aria-label="Next pair"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}

        {/* Products Header - 2 Products Side by Side */}
        <div className="compare-products-pair-mobile">
          {currentPair.map((item, index) => {
            const itemId = item._id || item.id
            const productPrice = typeof item.price === 'number' ? item.price : parseFloat(item.price) || 0
            const productOriginalPrice = typeof item.originalPrice === 'number' ? item.originalPrice : null

            return (
              <div key={itemId} className={`compare-product-card-pair-mobile ${index === 0 ? 'product-left' : 'product-right'}`}>
                <button
                  className="remove-compare-btn-mobile"
                  onClick={() => removeFromCompare(itemId)}
                  aria-label="Remove from comparison"
                >
                  <X size={18} />
                </button>
                
                <Link to={`/product/${itemId}`} className="compare-product-link-mobile">
                  <div className="compare-product-image-wrapper-mobile">
                    <img 
                      src={item.images?.[0] || item.image || 'https://via.placeholder.com/300x400'} 
                      alt={item.name} 
                    />
                    {item.onSale && <span className="compare-sale-badge-mobile">Sale</span>}
                    {item.new && <span className="compare-new-badge-mobile">New</span>}
                  </div>
                  <h3>{item.name}</h3>
                  <div className="compare-product-price-mobile">
                    {productOriginalPrice && (
                      <span className="original-price">₹{productOriginalPrice.toFixed(2)}</span>
                    )}
                    <span className="current-price">₹{productPrice.toFixed(2)}</span>
                  </div>
                  {item.rating && (
                    <div className="compare-product-rating-mobile">
                      <Star size={14} fill="#C89E7E" color="#C89E7E" />
                      <span>{item.rating}</span>
                      <span className="review-count">({item.reviews?.length || 0})</span>
                    </div>
                  )}
                </Link>
              </div>
            )
          })}
          
          {/* Empty slot if only 1 product */}
          {currentPair.length === 1 && (
            <div className="compare-product-card-pair-mobile product-right empty-slot">
              <div className="empty-slot-content">
                <p>Add another product to compare</p>
              </div>
            </div>
          )}
        </div>

        {/* Comparison Fields - Vertical Scroll */}
        <div className="compare-fields-vertical-mobile">
          {comparisonFields.map((field, index) => (
            <div key={field.key} className={`compare-field-row-mobile ${index % 2 === 0 ? 'even-row' : 'odd-row'}`}>
              {/* Field Heading - Centered, Merged */}
              <div className="compare-field-heading-mobile">
                <span className="field-label-text">{field.label}</span>
              </div>
              
              {/* Product Values - Side by Side */}
              <div className="compare-field-values-pair-mobile">
                {currentPair.map((item, itemIndex) => {
                  const itemId = item._id || item.id
                  const fieldValue = getFieldValue(item, field.key)

                  return (
                    <div key={itemId} className={`compare-field-value-cell-pair-mobile ${itemIndex === 0 ? 'product-left' : 'product-right'}`}>
                      {fieldValue.type === 'price' && (
                        <div className="compare-price-display-mobile">
                          {fieldValue.originalPrice && (
                            <span className="original-price">₹{fieldValue.originalPrice.toFixed(2)}</span>
                          )}
                          <span className="current-price">₹{fieldValue.price.toFixed(2)}</span>
                        </div>
                      )}
                      
                      {fieldValue.type === 'rating' && (
                        <div className="compare-rating-display-mobile">
                          <div className="stars">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                size={14}
                                fill={i < Math.floor(fieldValue.rating) ? '#C89E7E' : 'none'}
                                color="#C89E7E"
                              />
                            ))}
                          </div>
                          <span className="rating-value">{fieldValue.rating}/5</span>
                        </div>
                      )}
                      
                      {fieldValue.type === 'text' && (
                        <span className="compare-text-value">{fieldValue.value}</span>
                      )}
                      
                      {fieldValue.type === 'sizes' && (
                        <div className="compare-sizes-list-mobile">
                          {fieldValue.sizes.length > 0 ? (
                            <div className="sizes-container">
                              {fieldValue.sizes.map(size => (
                                <span key={size} className="compare-size-badge-mobile">{size}</span>
                              ))}
                            </div>
                          ) : (
                            <span className="compare-na">N/A</span>
                          )}
                        </div>
                      )}
                      
                      {fieldValue.type === 'colors' && (
                        <div className="compare-colors-list-mobile">
                          {fieldValue.colors.length > 0 ? (
                            <div className="colors-container">
                              {fieldValue.colors.map((color, idx) => {
                                const colorName = typeof color === 'string' ? color : (color.name || color.value || `Color ${idx + 1}`)
                                const colorValue = typeof color === 'string' ? color : (color.value || color.name || '#000000')
                                return (
                                  <span key={colorName} className="compare-color-item-mobile" title={colorName}>
                                    <span className="compare-color-swatch-mobile" style={{ backgroundColor: colorValue }}></span>
                                  </span>
                                )
                              })}
                            </div>
                          ) : (
                            <span className="compare-na">N/A</span>
                          )}
                        </div>
                      )}
                      
                      {fieldValue.type === 'stock' && (
                        <span className={`compare-stock-status-mobile ${fieldValue.inStock ? 'in-stock' : 'out-of-stock'}`}>
                          <span className="stock-indicator"></span>
                          {fieldValue.inStock ? 'In Stock' : 'Out of Stock'}
                        </span>
                      )}
                    </div>
                  )
                })}
                
                {/* Empty slot if only 1 product */}
                {currentPair.length === 1 && (
                  <div className="compare-field-value-cell-pair-mobile product-right empty-slot">
                    <span className="compare-na">—</span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Actions Row */}
          <div className="compare-field-row-mobile actions-row-mobile">
            <div className="compare-field-heading-mobile">
              <span className="field-label-text">Actions</span>
            </div>
            
            <div className="compare-field-values-pair-mobile">
              {currentPair.map((item, itemIndex) => {
                const itemId = item._id || item.id
                return (
                  <div key={itemId} className={`compare-field-value-cell-pair-mobile actions-cell-mobile ${itemIndex === 0 ? 'product-left' : 'product-right'}`}>
                    <Link 
                      to={`/product/${itemId}`} 
                      className="btn btn-primary btn-compare-action-mobile"
                    >
                      <Eye size={16} />
                      View
                    </Link>
                    <button 
                      className="btn btn-outline btn-compare-action-mobile"
                      onClick={() => handleAddToCart(itemId)}
                    >
                      <ShoppingCart size={16} />
                      Cart
                    </button>
                  </div>
                )
              })}
              
              {/* Empty slot if only 1 product */}
              {currentPair.length === 1 && (
                <div className="compare-field-value-cell-pair-mobile product-right empty-slot">
                  <span className="compare-na">—</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CompareMobile
