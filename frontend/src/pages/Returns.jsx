import { useState, useEffect } from 'react'
import { ArrowLeft, Package, Clock, CheckCircle, XCircle, Video, AlertCircle, RefreshCw, Ban } from 'lucide-react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { returnsAPI, ordersAPI } from '../utils/api'
import { useToast } from '../components/Toast/ToastContainer'

function Returns() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated } = useAuth()
  const { success, error: showError } = useToast()
  const [returns, setReturns] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [showReturnForm, setShowReturnForm] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [returnForm, setReturnForm] = useState({
    orderId: '',
    productId: '',
    productName: '',
    reason: '',
    amount: ''
  })

  useEffect(() => {
    if (isAuthenticated) {
      loadReturns()
      loadOrders()
    }
  }, [isAuthenticated])

  const loadReturns = async () => {
    try {
      if (isAuthenticated) {
        const returnsData = await returnsAPI.getAll()
        setReturns(Array.isArray(returnsData) ? returnsData : [])
      }
    } catch (err) {
      console.error('Failed to load returns:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadOrders = async () => {
    try {
      if (isAuthenticated) {
        const ordersData = await ordersAPI.getAll()
        setOrders(Array.isArray(ordersData) ? ordersData : [])
      }
    } catch (err) {
      console.error('Failed to load orders:', err)
    }
  }

  const handleOrderSelect = (order) => {
    setSelectedOrder(order)
    setShowReturnForm(true)
  }

  const handleProductSelect = (item) => {
    setReturnForm(prev => ({
      ...prev,
      orderId: selectedOrder.orderId,
      productId: item.product || item.productId,
      productName: item.name,
      amount: item.price * item.quantity
    }))
  }

  const handleSubmitReturn = async (e) => {
    e.preventDefault()
    if (!returnForm.orderId || !returnForm.productId || !returnForm.reason || !returnForm.amount) {
      showError('Please fill in all required fields')
      return
    }

    try {
      await returnsAPI.create(returnForm)
      success('Return request submitted successfully')
      setShowReturnForm(false)
      setReturnForm({ orderId: '', productId: '', productName: '', reason: '', amount: '' })
      setSelectedOrder(null)
      loadReturns()
    } catch (err) {
      console.error('Failed to submit return:', err)
      showError('Failed to submit return request')
    }
  }

  const getStatusIcon = (status) => {
    switch(status) {
      case 'pending': return <Clock size={16} />
      case 'approved': return <CheckCircle size={16} />
      case 'rejected': return <XCircle size={16} />
      case 'refunded': return <CheckCircle size={16} />
      default: return <Clock size={16} />
    }
  }

  return (
    <div className="returns-page">
      <div className="container">
        <button onClick={() => navigate(-1)} className="back-button">
          <ArrowLeft size={20} />
          Back
        </button>

        <div className="page-header">
          <h1>Returns & Exchanges</h1>
          <p>Our hassle-free return and exchange policy</p>
        </div>

        {!isAuthenticated && (
          <div className="auth-prompt" style={{ 
            padding: '2rem', 
            textAlign: 'center', 
            backgroundColor: '#f8f9fa', 
            borderRadius: '8px',
            marginBottom: '2rem'
          }}>
            <h2 style={{ marginBottom: '1rem' }}>Login Required</h2>
            <p style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>
              Please <Link to="/dashboard" style={{ color: '#7A5051', fontWeight: 'bold' }}>login</Link> to access returns and exchanges.
            </p>
            <Link to="/dashboard" className="btn btn-primary">
              Go to Dashboard
            </Link>
          </div>
        )}

        {isAuthenticated && (
          <div className="auth-prompt" style={{ 
            padding: '2rem', 
            textAlign: 'center', 
            backgroundColor: '#e7f3ff', 
            borderRadius: '8px',
            marginBottom: '2rem',
            border: '1px solid #b3d9ff'
          }}>
            <h2 style={{ marginBottom: '1rem' }}>Returns & Exchanges</h2>
            <p style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>
              To request a return or exchange, please visit your <Link to="/dashboard" state={{ tab: 'returns' }} style={{ color: '#7A5051', fontWeight: 'bold' }}>Dashboard</Link> and navigate to the "Returns & Exchanges" section.
            </p>
            <Link to="/dashboard" state={{ tab: 'returns' }} className="btn btn-primary">
              Go to Dashboard
            </Link>
          </div>
        )}

        <div className="info-sections">
          <section className="info-section">
            <h2>Return & Exchange Policy</h2>
            <p style={{ marginBottom: '2rem', fontSize: '1.1rem', lineHeight: '1.6' }}>
              We want you to love every purchase from Arudhra Fashions. If there's any issue, please read the policy below carefully before requesting a return or exchange.
            </p>
            
            <div className="policy-box" style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
                <Clock size={24} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '0.25rem' }} />
                <div>
                  <h3 style={{ marginBottom: '0.5rem' }}>Return Timeframe</h3>
                  <p style={{ margin: 0, fontSize: '1rem', lineHeight: '1.6' }}>
                    Return requests must be raised within <strong>24 hours</strong> of receiving your order. Requests submitted after this timeframe will not be accepted.
                  </p>
                </div>
              </div>
            </div>

            <div className="policy-box" style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
                <Video size={24} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '0.25rem' }} />
                <div>
                  <h3 style={{ marginBottom: '0.5rem' }}>Unboxing Video Requirement</h3>
                  <p style={{ margin: 0, fontSize: '1rem', lineHeight: '1.6' }}>
                    A complete video of unpacking the delivery must be submitted for return requests. The video must be <strong>continuous without any cuts, pauses, or edits</strong>. Return requests without a complete unboxing video will not be accepted.
                  </p>
                </div>
              </div>
            </div>

            <div className="policy-box" style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
                <RefreshCw size={24} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '0.25rem' }} />
                <div>
                  <h3 style={{ marginBottom: '0.5rem' }}>Exchange Only Policy</h3>
                  <p style={{ margin: 0, fontSize: '1rem', lineHeight: '1.6' }}>
                    <strong>No refunds will be initiated.</strong> Only product exchanges are available. If you need to return an item, we will exchange it for another product of your choice (subject to availability).
                  </p>
                </div>
              </div>
            </div>

            <div className="policy-box" style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
                <CheckCircle size={24} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '0.25rem' }} />
                <div>
                  <h3 style={{ marginBottom: '0.5rem' }}>Valid Reasons for Return</h3>
                  <p style={{ margin: 0, fontSize: '1rem', lineHeight: '1.6', marginBottom: '0.5rem' }}>
                    Returns can only be made for the following reasons:
                  </p>
                  <ul className="info-list" style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                    <li>Size does not fit</li>
                    <li>Product damaged during delivery</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="policy-box warning" style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
                <Ban size={24} style={{ color: '#dc3545', flexShrink: 0, marginTop: '0.25rem' }} />
                <div>
                  <h3 style={{ marginBottom: '0.5rem' }}>Non-Acceptable Reasons</h3>
                  <p style={{ margin: 0, fontSize: '1rem', lineHeight: '1.6' }}>
                    <strong>No other reasons will be accepted</strong> by our company for returning products. Returns will only be processed for size issues or delivery damage as mentioned above.
                  </p>
                </div>
              </div>
            </div>

            <div className="policy-box" style={{ marginBottom: '1.5rem', backgroundColor: '#f8f9fa', padding: '1.5rem', borderRadius: '8px' }}>
              <h3 style={{ marginBottom: '1rem' }}>Important Notes:</h3>
              <ul className="info-list" style={{ margin: 0, paddingLeft: '1.5rem' }}>
                <li>Items must be unused, unwashed, and in original packaging</li>
                <li>Original tags must be attached</li>
                <li>All return requests must include the unboxing video</li>
                <li>Only exchanges are available - no refunds will be processed</li>
              </ul>
            </div>
          </section>

          <section className="info-section">
            <h2>How to Request a Return/Exchange</h2>
            <div className="steps-list">
              <div className="step-item">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h3>Log into Your Account</h3>
                  <p>Go to your Dashboard and navigate to "Returns & Exchanges"</p>
                </div>
              </div>
              <div className="step-item">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h3>Select the Order</h3>
                  <p>Find the order containing the item you want to return/exchange</p>
                </div>
              </div>
              <div className="step-item">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h3>Upload Unboxing Video</h3>
                  <p>Upload the complete unboxing video (no cuts, pauses, or edits)</p>
                </div>
              </div>
              <div className="step-item">
                <div className="step-number">4</div>
                <div className="step-content">
                  <h3>Select Reason</h3>
                  <p>Choose either "Size not fit" or "Product damaged during delivery"</p>
                </div>
              </div>
              <div className="step-item">
                <div className="step-number">5</div>
                <div className="step-content">
                  <h3>Submit Request</h3>
                  <p>Submit your return request within 24 hours of delivery</p>
                </div>
              </div>
            </div>
          </section>

          <section className="info-section">
            <h2>Questions?</h2>
            <p>If you have any questions about returns or exchanges, please contact us:</p>
            <p><strong>Email:</strong> support@arudhrafashions.com</p>
            <p><strong>Phone:</strong> +91 63847 37391</p>
          </section>
        </div>
      </div>
    </div>
  )
}

export default Returns

