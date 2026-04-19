import { useParams, Link } from 'react-router-dom'
import { Package, Truck, CheckCircle, Clock, ArrowLeft, MapPin, IndianRupee, Calendar, Hash, User, Phone, Mail, Download } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useState, useEffect } from 'react'
import { ordersAPI } from '../utils/api'
import { useToast } from '../components/Toast/ToastContainer'

function OrderTracking() {
  const { id, tracking } = useParams()
  const { isAuthenticated } = useAuth()
  const { error: showError, success } = useToast()
  const [order, setOrder] = useState(null)
  const [guestOrder, setGuestOrder] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadOrder()
  }, [id, tracking, isAuthenticated])

  const loadOrder = async () => {
    try {
      setLoading(true)
      
      if (isAuthenticated) {
        // Load order from API
        try {
          const orderData = await ordersAPI.getById(id || tracking)
          setOrder(orderData)
        } catch (err) {
          console.error('Failed to load order:', err)
          // Fallback to guest orders if API fails
          const guestOrders = JSON.parse(localStorage.getItem('guestOrders') || '[]')
          const foundOrder = guestOrders.find(o => (o.id === id || o.trackingNumber === tracking))
          if (foundOrder) {
            setGuestOrder(foundOrder)
          }
        }
      } else {
        // Load guest order from localStorage
        const guestOrders = JSON.parse(localStorage.getItem('guestOrders') || '[]')
        const foundOrder = guestOrders.find(o => (o.id === id || o.trackingNumber === tracking))
        if (foundOrder) {
          setGuestOrder(foundOrder)
        }
      }
    } catch (err) {
      console.error('Error loading order:', err)
      showError('Failed to load order details')
    } finally {
      setLoading(false)
    }
  }

  const currentOrder = order || guestOrder

  if (loading) {
    return (
      <div className="order-tracking-page">
        <div className="container">
          <div className="empty-state">
            <Package size={48} />
            <h2>Loading Order...</h2>
            <p>Please wait while we fetch your order details.</p>
          </div>
        </div>
      </div>
    )
  }

  if (!currentOrder) {
    return (
      <div className="order-tracking-page">
        <div className="container">
          <div className="empty-state">
            <Package size={48} />
            <h2>Order Not Found</h2>
            <p>We couldn't find an order with that ID.</p>
            <Link to="/" className="btn btn-primary">
              Go Home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return <CheckCircle size={24} className="status-icon delivered" />
      case 'shipped':
        return <Truck size={24} className="status-icon shipped" />
      case 'processing':
        return <Clock size={24} className="status-icon processing" />
      default:
        return <Package size={24} className="status-icon" />
    }
  }

  const getStatusSteps = (status) => {
    const steps = [
      { label: 'Order Placed', status: 'completed' },
      { label: 'Processing', status: status === 'processing' || status === 'shipped' || status === 'delivered' ? 'completed' : 'pending' },
      { label: 'Shipped', status: status === 'shipped' || status === 'delivered' ? 'completed' : 'pending' },
      { label: 'Delivered', status: status === 'delivered' ? 'completed' : 'pending' }
    ]
    return steps
  }

  const statusSteps = getStatusSteps(currentOrder.status)

  return (
    <div className="order-tracking-page">
      <div className="container">
        <div className="order-header-enhanced">
          <Link to={isAuthenticated ? "/dashboard" : "/"} className="back-link">
            <ArrowLeft size={20} />
            <span>{isAuthenticated ? "Back to Dashboard" : "Back to Home"}</span>
          </Link>
          <div className="order-header-content">
            <div className="order-header-icon-wrapper">
              <Package size={32} />
            </div>
            <div>
              <h1>Order Tracking</h1>
              <p className="order-header-subtitle">Track your order status and delivery</p>
            </div>
          </div>
        </div>

        <div className="order-tracking-content">
          {/* Order Info Header - Clear and Visible */}
          <div className="order-info-header-clear">
            <div className="order-info-item">
              <div className="info-item-label">
                <Hash size={16} />
                <span>Order ID</span>
              </div>
              <div className="info-item-value" style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                <span>{currentOrder.orderId || currentOrder.id}</span>
                {isAuthenticated && (
                  <button
                    className="btn-icon"
                    title="Download Invoice"
                    onClick={async () => {
                      try {
                        await ordersAPI.downloadInvoice(currentOrder.id)
                        success('Invoice downloaded')
                      } catch (err) {
                        console.error('Failed to download invoice:', err)
                        showError(err.message || 'Failed to download invoice')
                      }
                    }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    <Download size={16} />
                  </button>
                )}
              </div>
            </div>
            <div className="order-info-item">
              <div className="info-item-label">
                <Calendar size={16} />
                <span>Order Date</span>
              </div>
              <div className="info-item-value">
                {new Date(currentOrder.createdAt || currentOrder.date).toLocaleDateString('en-IN', { 
                  weekday: 'short', 
                  year: 'numeric', 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </div>
            </div>
            {currentOrder.tracking && (
              <div className="order-info-item">
                <div className="info-item-label">
                  <Truck size={16} />
                  <span>Tracking Number</span>
                </div>
                <div className="info-item-value">{currentOrder.tracking}</div>
              </div>
            )}
            <div className="order-info-item">
              <div className="info-item-label">
                <Package size={16} />
                <span>Status</span>
              </div>
              <div className={`info-item-value status-value ${currentOrder.status.toLowerCase()}`}>
                {getStatusIcon(currentOrder.status)}
                <span>{currentOrder.status}</span>
              </div>
            </div>
          <div className="order-info-item">
            <div className="info-item-label">
              <IndianRupee size={16} />
              <span>Payment</span>
            </div>
            <div className="info-item-value">
              <span style={{ fontWeight: 600 }}>{currentOrder.payment?.method === 'cod' ? 'Cash on Delivery' : 'Online Payment'}</span>
              {currentOrder.payment?.status && <div style={{ fontSize: '0.85rem', color: '#666' }}>Status: {currentOrder.payment.status}</div>}
            </div>
          </div>
          </div>

          {/* Horizontal Cards Layout */}
          <div className="order-cards-horizontal">
            {/* Order Status Card */}
            <div className="order-card-horizontal status-card">
              <div className="card-header-horizontal">
                <Clock size={20} />
                <h3>Order Status</h3>
              </div>
              <div className="card-content-horizontal">
                <div className="status-timeline-compact-horizontal">
                  {statusSteps.map((step, index) => (
                    <div key={index} className={`status-step-compact ${step.status}`}>
                      {step.status === 'completed' ? (
                        <CheckCircle size={18} className="status-step-icon completed" />
                      ) : (
                        <div className="status-step-icon pending"></div>
                      )}
                      <span className="status-step-label">{step.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Order Details Card */}
            <div className="order-card-horizontal details-card">
              <div className="card-header-horizontal">
                <Package size={20} />
                <h3>Order Details</h3>
              </div>
              <div className="card-content-horizontal">
                <div className="order-items-compact">
                  {currentOrder.items?.slice(0, 3).map((item, index) => (
                    <div key={index} className="order-item-compact">
                      <img src={item.image} alt={item.name} />
                      <div className="item-info-compact">
                        <p className="item-name-compact">{item.name}</p>
                        <span className="item-qty-compact">Qty: {item.quantity}</span>
                      </div>
                    </div>
                  ))}
                  {currentOrder.items?.length > 3 && (
                    <div className="more-items-compact">
                      +{currentOrder.items.length - 3} more items
                    </div>
                  )}
                </div>
                <div className="items-total-compact">
                  <span>{currentOrder.items?.length || 0} {currentOrder.items?.length === 1 ? 'item' : 'items'}</span>
                </div>
                <div className="order-total-compact">
                  <span className="total-label-compact">Total Amount</span>
                  <span className="total-value-compact">₹{(Number(currentOrder.total) || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Shipping Address Card */}
            {currentOrder.shippingAddress && (
              <div className="order-card-horizontal address-card">
                <div className="card-header-horizontal">
                  <MapPin size={20} />
                  <h3>Shipping Address</h3>
                </div>
                <div className="card-content-horizontal">
                  <div className="address-compact">
                    <p className="address-name-compact">{currentOrder.shippingAddress.name}</p>
                    <p className="address-line-compact">{currentOrder.shippingAddress.address}</p>
                    <p className="address-city-compact">
                      {currentOrder.shippingAddress.city}, {currentOrder.shippingAddress.state} - {currentOrder.shippingAddress.zipCode}
                    </p>
                    <div className="address-contact-compact">
                      <div className="contact-item-compact">
                        <Phone size={14} />
                        <span>{currentOrder.shippingAddress.mobile}</span>
                      </div>
                      {currentOrder.shippingAddress.email && (
                        <div className="contact-item-compact">
                          <Mail size={14} />
                          <span>{currentOrder.shippingAddress.email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}

export default OrderTracking

