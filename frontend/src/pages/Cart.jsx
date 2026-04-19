import { Link } from 'react-router-dom'
import { Trash2, Plus, Minus, ShoppingCart } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { cartAPI } from '../utils/api'
import { useToast } from '../components/Toast/ToastContainer'
import Loading from '../components/Loading/Loading'
import { CartSkeleton } from '../components/Skeletons/PageSkeletons'

function Cart() {
  const { user, isAuthenticated, getGuestId } = useAuth()
  const { success, error: showError } = useToast()
  const [cartItems, setCartItems] = useState([])
  const [loading, setLoading] = useState(true)

  // Load cart from API or localStorage
  useEffect(() => {
    loadCart()
    
    // Listen for cart updates
    const handleCartUpdate = () => {
      loadCart()
    }
    
    window.addEventListener('cartUpdated', handleCartUpdate)
    
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate)
    }
  }, [user, isAuthenticated])

  const loadCart = async () => {
    try {
      setLoading(true)
      if (isAuthenticated && user) {
        // Load user cart from API
        const response = await cartAPI.get()
        
        // Handle different response structures
        let items = []
        if (Array.isArray(response)) {
          // If response is directly an array
          items = response
        } else if (response?.items) {
          // If response has items property
          items = Array.isArray(response.items) ? response.items : []
        } else if (response?.data?.items) {
          // If response is wrapped in data
          items = Array.isArray(response.data.items) ? response.data.items : []
        }
        
        setCartItems(items)
      } else {
        // Load guest cart from localStorage
        const guestCart = JSON.parse(localStorage.getItem(`cart_guest`) || '[]')
        setCartItems(guestCart)
      }
    } catch (err) {
      console.error('Failed to load cart:', err)
      console.error('Error details:', err.message, err.stack)
      showError('Failed to load cart')
      setCartItems([])
    } finally {
      setLoading(false)
    }
  }

  const updateQuantity = async (itemId, change) => {
    if (isAuthenticated) {
      try {
        // Find item by matching the itemId pattern (product-size-color-index)
        const itemIndex = cartItems.findIndex((i, idx) => {
          const iId = i._id || i.id || `${i.product || 'item'}-${i.size || 'default'}-${i.color || 'default'}-${idx}`
          return iId === itemId
        })
        
        if (itemIndex === -1) return
        const item = cartItems[itemIndex]
        
        const newQuantity = item.quantity + change
        if (newQuantity < 1) {
          await removeItem(itemId)
          return
        }
        
        // Backend uses productId as itemId, but we need to handle size/color variants
        // For now, update locally and reload from server
        const updatedItems = [...cartItems]
        updatedItems[itemIndex] = { ...item, quantity: newQuantity }
        setCartItems(updatedItems)
        
        // Try to update via API using productId
        if (item.product) {
          try {
            await cartAPI.updateItem(item.product, newQuantity)
          } catch (apiErr) {
            console.error('API update failed, will reload:', apiErr)
          }
        }
        
        // Reload cart to ensure sync
        setTimeout(() => loadCart(), 200)
        
        // Dispatch cart update event
        window.dispatchEvent(new Event('cartUpdated'))
      } catch (err) {
        console.error('Failed to update quantity:', err)
        showError('Failed to update quantity')
        loadCart() // Reload on error
      }
    } else {
      // Guest cart - update localStorage
      setCartItems(items => {
        const updated = items.map(item => {
          if ((item._id === itemId || item.id === itemId)) {
            const newQuantity = item.quantity + change
            return { ...item, quantity: Math.max(1, newQuantity) }
          }
          return item
        })
        localStorage.setItem('cart_guest', JSON.stringify(updated))
        return updated
      })
    }
  }

  const removeItem = async (itemId) => {
    if (isAuthenticated) {
      try {
        // Find item index
        const itemIndex = cartItems.findIndex((i, idx) => {
          const iId = i._id || i.id || `${i.product || 'item'}-${i.size || 'default'}-${i.color || 'default'}-${idx}`
          return iId === itemId
        })
        
        if (itemIndex === -1) return
        
        const item = cartItems[itemIndex]
        
        // Backend expects productId for removal, but we need to handle it differently
        // Since items don't have IDs, we'll need to rebuild the items array without this item
        const updatedItems = cartItems.filter((i, idx) => {
          const iId = i._id || i.id || `${i.product || 'item'}-${i.size || 'default'}-${i.color || 'default'}-${idx}`
          return iId !== itemId
        })
        
        // Update cart via API - we'll need to send the updated items array
        // For now, let's reload the cart after a brief delay
        setCartItems(updatedItems)
        
        // Try to remove via API if item has product ID
        if (item.product) {
          try {
            await cartAPI.removeItem(item.product) // Backend might need productId
          } catch (apiErr) {
            console.error('API remove failed, reloading cart:', apiErr)
          }
        }
        
        // Reload cart to ensure sync
        setTimeout(() => loadCart(), 100)
        
        success('Item removed from cart')
        // Dispatch cart update event
        window.dispatchEvent(new Event('cartUpdated'))
      } catch (err) {
        console.error('Failed to remove item:', err)
        showError('Failed to remove item')
        // Reload cart on error
        loadCart()
      }
    } else {
      // Guest cart - update localStorage
      setCartItems(items => {
        const updated = items.filter(item => item._id !== itemId && item.id !== itemId)
        localStorage.setItem('cart_guest', JSON.stringify(updated))
        // Dispatch cart update event
        window.dispatchEvent(new Event('cartUpdated'))
        return updated
      })
    }
  }

  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => {
    const price = typeof item.price === 'number' ? item.price : parseFloat(item.price) || 0
    const quantity = item.quantity || 1
    return sum + (price * quantity)
  }, 0)
  const shipping = subtotal >= 2000 ? 0 : 100
  const tax = subtotal * 0.18 // 18% GST
  const total = subtotal + shipping + tax

  if (loading) {
    return (
      <div className="cart-page">
        <div className="container">
          <CartSkeleton />
        </div>
      </div>
    )
  }

  return (
    <div className="cart-page">
      <div className="container">
        <div className="cart-header">
          <h1>Shopping Cart</h1>
          {cartItems.length > 0 && (
            <p className="cart-item-count">{cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}</p>
          )}
        </div>
        {cartItems.length === 0 ? (
          <div className="empty-cart">
            <div className="empty-cart-icon">
              <ShoppingCart size={80} />
            </div>
            <h2>Your cart is empty</h2>
            <p>Looks like you haven't added anything to your cart yet</p>
            <Link to="/products" className="btn btn-primary btn-large">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="cart-layout">
            <div className="cart-items-wrapper">
              <div className="cart-items">
                {cartItems.map((item, index) => {
                  // Cart items from backend don't have _id, use index + product + size + color as unique key
                  const itemId = item._id || item.id || `${item.product || 'item'}-${item.size || 'default'}-${item.color || 'default'}-${index}`
                  
                  // Handle item structure - items are stored as { product: UUID, name, image, price, quantity, size, color }
                  const productName = item.name || 'Product'
                  const productImage = item.image || ''
                  const productPrice = typeof item.price === 'number' ? item.price : parseFloat(item.price) || 0
                  const size = item.size || 'N/A'
                  const color = item.color || 'N/A'
                  const quantity = item.quantity || 1
                  
                  return (
                    <div key={itemId} className="cart-item-card">
                      <div className="cart-item-image-wrapper">
                        <img src={productImage} alt={productName} />
                      </div>
                      <div className="cart-item-content">
                        <div className="cart-item-details">
                          <h3 className="cart-item-name">{productName}</h3>
                          <div className="cart-item-meta">
                            <span className="meta-item">
                              <strong>Size:</strong> {size}
                            </span>
                            <span className="meta-item">
                              <strong>Color:</strong> {color}
                            </span>
                          </div>
                          <div className="cart-item-price-section">
                            <span className="unit-price">₹{(productPrice).toFixed(2)} each</span>
                          </div>
                        </div>
                        <div className="cart-item-actions">
                          <div className="quantity-controls-wrapper">
                            <label className="quantity-label">Quantity</label>
                            <div className="quantity-controls">
                              <button 
                                className="quantity-btn"
                                onClick={() => updateQuantity(itemId, -1)}
                                aria-label="Decrease quantity"
                              >
                                <Minus size={18} />
                              </button>
                              <span className="quantity-value">{quantity}</span>
                              <button 
                                className="quantity-btn"
                                onClick={() => updateQuantity(itemId, 1)}
                                aria-label="Increase quantity"
                              >
                                <Plus size={18} />
                              </button>
                            </div>
                          </div>
                          <div className="cart-item-total-section">
                            <span className="total-label">Total</span>
                            <span className="cart-item-total">₹{(productPrice * quantity).toFixed(2)}</span>
                          </div>
                          <button
                            className="remove-btn"
                            onClick={() => removeItem(itemId)}
                            aria-label="Remove item"
                            title="Remove from cart"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="cart-summary-card">
              <h2 className="summary-title">Order Summary</h2>
              <div className="summary-content">
                <div className="summary-row">
                  <span className="summary-label">Subtotal</span>
                  <span className="summary-value">₹{(Number(subtotal) || 0).toFixed(2)}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Shipping</span>
                  <span className="summary-value shipping-value">
                    {shipping === 0 ? (
                      <span className="free-shipping">Free</span>
                    ) : (
                      `₹${(Number(shipping) || 0).toFixed(2)}`
                    )}
                  </span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Tax (GST 18%)</span>
                  <span className="summary-value">₹{(Number(tax) || 0).toFixed(2)}</span>
                </div>
                <div className="summary-divider"></div>
                <div className="summary-row total-row">
                  <span className="summary-label">Total</span>
                  <span className="summary-value total-value">₹{(Number(total) || 0).toFixed(2)}</span>
                </div>
                {subtotal < 2000 && (
                  <div className="shipping-note">
                    <span className="shipping-note-icon">🚚</span>
                    <span>Add ₹{(2000 - subtotal).toFixed(2)} more for free shipping!</span>
                  </div>
                )}
              </div>
              <div className="summary-actions">
                <Link to="/checkout" className="btn btn-primary btn-large btn-checkout">
                  Proceed to Checkout
                </Link>
                <Link to="/products" className="btn btn-outline btn-continue">
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Cart
