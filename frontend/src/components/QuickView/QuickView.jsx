import { useState, useEffect } from 'react'
import { X, ShoppingCart, Check } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useToast } from '../Toast/ToastContainer'
import { cartAPI } from '../../utils/api'
import { useAuth } from '../../context/AuthContext'

function QuickView({ product, isOpen, onClose }) {
  const [selectedSize, setSelectedSize] = useState('')
  const [selectedColor, setSelectedColor] = useState('')
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const { success, error: showError } = useToast()
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  // NEW INVENTORY LOGIC: Normalize product data for display
  const inventory = Array.isArray(product?.inventory) ? product.inventory : []

  // Find current color group
  const colorGroup = inventory.find(g =>
    (g.colorName || '') === (selectedColor || '')
  ) || inventory[0]

  const productImage = colorGroup?.images && colorGroup.images.length > 0
    ? colorGroup.images[0]
    : product.images && product.images.length > 0
      ? product.images[0]
      : product.image || 'https://via.placeholder.com/600x800'

  const productColors = inventory
    .filter(item => item.colorName !== null && item.colorName !== undefined && item.colorName !== '')
    .map(item => item.colorName)

  const productSizes = colorGroup?.sizes || []

  // Stock check for selected variant
  const selectedSizeObj = productSizes.find(s => s.size === selectedSize)
  const availableStock = selectedSizeObj ? (parseInt(selectedSizeObj.stock) || 0) : 0
  const isOutOfStock = inventory.length > 0 ? availableStock <= 0 : !product.inStock

  // Helper to change color
  const handleColorChange = (colorName) => {
    setSelectedColor(colorName)
    const newGroup = inventory.find(g => g.colorName === colorName)
    if (newGroup && newGroup.sizes && newGroup.sizes.length > 0) {
      setSelectedSize(newGroup.sizes[0].size || '')
    }
  }

  // Set default size and color
  useEffect(() => {
    if (!product) return;

    if (inventory.length > 0) {
      const firstGroup = inventory[0]
      if (!selectedColor) {
        setSelectedColor(firstGroup.colorName || '')
      }
      if (firstGroup.sizes?.length > 0 && !selectedSize) {
        setSelectedSize(firstGroup.sizes[0].size || '')
      }
    } else {
      // Legacy fallback
      const legacySizes = product.sizes || []
      const legacyColors = product.colors || []

      if (legacySizes.length > 0 && !selectedSize) {
        setSelectedSize(legacySizes[0])
      }
      if (legacyColors.length > 0 && !selectedColor) {
        const firstColor = typeof legacyColors[0] === 'string'
          ? legacyColors[0]
          : (legacyColors[0].name || legacyColors[0].value)
        setSelectedColor(firstColor)
      }
    }
  }, [product, inventory, selectedSize, selectedColor])

  if (!isOpen || !product) return null

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      showError('Please login to add items to cart')
      navigate('/dashboard', { state: { tab: 'login', redirectPath: window.location.pathname } })
      onClose()
      return
    }

    if (isOutOfStock) {
      showError('Selected variant is out of stock')
      return
    }

    if (productSizes.length > 0 && !selectedSize) {
      showError('Please select a size')
      return
    }

    try {
      setIsAddingToCart(true)
      const productId = product._id || product.id
      const token = localStorage.getItem('token')

      if (!token) {
        showError('Please login again')
        return
      }

      await cartAPI.addItem(productId, 1, selectedSize || null, selectedColor || null)
      success('Product added to cart!')

      // Dispatch cart update event
      window.dispatchEvent(new Event('cartUpdated'))

      // Close modal after a short delay
      setTimeout(() => {
        onClose()
      }, 500)
    } catch (err) {
      console.error('Failed to add to cart:', err)
      const errorMessage = err.message || 'Failed to add product to cart'
      showError(errorMessage)

      // If unauthorized, might need to re-login
      if (errorMessage.includes('authorized') || errorMessage.includes('401')) {
        showError('Session expired. Please login again.')
      }
    } finally {
      setIsAddingToCart(false)
    }
  }

  const discountPercent = product.onSale && product.originalPrice && typeof product.originalPrice === 'number'
    ? Math.round(((product.originalPrice - (typeof product.price === 'number' ? product.price : parseFloat(product.price) || 0)) / product.originalPrice) * 100)
    : 0

  return (
    <div className="modal-overlay quick-view-overlay" onClick={onClose}>
      <div className="modal-content quick-view-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close quick-view-close" onClick={onClose} aria-label="Close">
          <X size={24} />
        </button>

        <div className="quick-view-content">
          <div className="quick-view-image-section">
            <div className="quick-view-image">
              <img src={productImage} alt={product.name} />
              {product.onSale && discountPercent > 0 && (
                <span className="quick-view-offer-badge">{discountPercent}% OFF</span>
              )}
            </div>
          </div>

          <div className="quick-view-info">
            <h2 className="quick-view-title">{product.name}</h2>

            <div className="quick-view-price-section">
              <div className="quick-view-price">
                {product.originalPrice && typeof product.originalPrice === 'number' && (
                  <span className="original-price">₹{product.originalPrice.toFixed(2)}</span>
                )}
                <span className="current-price">₹{(typeof product.price === 'number' ? product.price : parseFloat(product.price) || 0).toFixed(2)}</span>
              </div>
              {!isOutOfStock ? (
                <div className="quick-view-stock">
                  <Check size={16} />
                  <span>In Stock</span>
                </div>
              ) : (
                <div className="quick-view-stock out-of-stock">
                  <X size={16} />
                  <span>Sold Out</span>
                </div>
              )}
            </div>

            {productSizes.length > 0 && productSizes.some(s => s.size !== null && s.size !== '') && (
              <div className="quick-view-options">
                <label>Size</label>
                <div className="size-options">
                  {productSizes.map((sizeObj, idx) => {
                    const s = sizeObj.size
                    const stock = parseInt(sizeObj.stock) || 0
                    const soldOut = stock <= 0
                    return (
                      <button
                        key={s || idx}
                        className={`size-option-btn ${selectedSize === s ? 'selected' : ''} ${soldOut ? 'sold-out' : ''}`}
                        onClick={() => setSelectedSize(s)}
                      >
                        {s}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {productColors.length > 0 && (
              <div className="quick-view-options">
                <label>Color</label>
                <div className="color-options">
                  {productColors.map((colorName, idx) => {
                    const isSelected = selectedColor === colorName

                    return (
                      <button
                        key={colorName || idx}
                        className={`color-option-btn ${isSelected ? 'selected' : ''}`}
                        onClick={() => handleColorChange(colorName)}
                        title={colorName}
                      >
                        <span className="color-label-text-mini">{colorName}</span>
                        {isSelected && <span className="check-mark-mini">✓</span>}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="quick-view-actions">
              <button
                className="btn btn-primary btn-large quick-view-add-cart"
                onClick={handleAddToCart}
                disabled={isOutOfStock || isAddingToCart}
              >
                <ShoppingCart size={20} />
                {isAddingToCart ? 'Adding...' : (!isOutOfStock ? 'Add to Cart' : 'Out of Stock')}
              </button>
              <Link
                to={`/product/${product._id || product.id}`}
                className="quick-view-link"
                onClick={onClose}
              >
                View Full Details →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default QuickView

