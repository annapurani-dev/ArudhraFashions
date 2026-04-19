import { useState, useEffect } from 'react'
import { Search, Eye, Package, Truck, CheckCircle, Download, Mail } from 'lucide-react'
import { adminOrdersAPI } from '../../utils/adminApi'
import { useToast } from '../../components/Toast/ToastContainer'

function Orders() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const { success, error: showError } = useToast()

  const statusOptions = ['Processing', 'Shipped', 'Delivered', 'Cancelled', 'Returned']

  useEffect(() => {
    loadOrders()
  }, [statusFilter])

  // Live refresh while admin is on orders page (poll every 10s). Pause when tab is not visible.
  useEffect(() => {
    let intervalId = null

    const startPolling = () => {
      if (intervalId) return
      intervalId = setInterval(() => {
        loadOrders()
      }, 10000)
    }

    const stopPolling = () => {
      if (intervalId) {
        clearInterval(intervalId)
        intervalId = null
      }
    }

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') startPolling()
      else stopPolling()
    }

    // Start polling when component mounts and tab visible
    if (document.visibilityState === 'visible') startPolling()
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      stopPolling()
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [])

  const loadOrders = async () => {
    try {
      setLoading(true)
      const filters = {}
      if (statusFilter) {
        filters.status = statusFilter
      }
      if (searchQuery) {
        filters.search = searchQuery
      }
      const data = await adminOrdersAPI.getAll(filters)
      setOrders(data.orders || [])
    } catch (err) {
      console.error('Error loading orders:', err)
      showError('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  const filteredOrders = orders.filter(order => {
    if (!searchQuery) return true
    return order.customer.toLowerCase().includes(searchQuery.toLowerCase())
  })

  const handleDownloadInvoice = async (orderId) => {
    try {
      await adminOrdersAPI.downloadInvoice(orderId)
      success('Invoice downloaded successfully')
    } catch (err) {
      console.error('Invoice download error:', err)
      showError(err.message || 'Failed to download invoice')
    }
  }

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await adminOrdersAPI.updateStatus(orderId, newStatus)
      await loadOrders()
      success('Order status updated successfully')
    } catch (err) {
      showError('Failed to update order status')
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>Orders</h1>
          <p>Manage and track customer orders</p>
        </div>
      </div>

      <div className="admin-toolbar">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search by Customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select 
          className="filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Status</option>
          {statusOptions.map(status => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      </div>

      <div className="orders-stats">
        <div className="stat-mini-card">
          <Package size={24} />
          <div>
            <h3>{orders.length}</h3>
            <p>Total Orders</p>
          </div>
        </div>
        <div className="stat-mini-card">
          <Truck size={24} />
          <div>
            <h3>{orders.filter(o => o.status === 'Shipped').length}</h3>
            <p>Shipped</p>
          </div>
        </div>
        <div className="stat-mini-card">
          <CheckCircle size={24} />
          <div>
            <h3>{orders.filter(o => o.status === 'Delivered').length}</h3>
            <p>Delivered</p>
          </div>
        </div>
      </div>

      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Contact</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Payment</th>
              <th>Date</th>
              <th>Actions</th>
              <th>Invoice</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>
                  Loading orders...
                </td>
              </tr>
            ) : filteredOrders.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>
                  No orders found
                </td>
              </tr>
            ) : (
              filteredOrders.map(order => (
                <tr key={order.id}>
                  <td>{order.customer}</td>
                  <td>
                    <div className="contact-info">
                      <p>{order.mobile}</p>
                      <p className="text-muted">{order.email}</p>
                    </div>
                  </td>
                  <td>₹{order.amount.toLocaleString()}</td>
                  <td>
                    <select
                      className={`status-select status-${order.status.toLowerCase()}`}
                      value={order.status}
                      onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                    >
                      {statusOptions.map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 600 }}>{order.paymentMethod ? (order.paymentMethod === 'cod' ? 'Cash on Delivery' : order.paymentMethod) : 'Online'}</span>
                      {order.paymentStatus && <small className="text-muted">Status: {order.paymentStatus}</small>}
                    </div>
                  </td>
                  <td>{new Date(order.date).toLocaleDateString()}</td>
                  <td>
                    {order.paymentMethod === 'cod' ? (
                      // For COD orders show only the payment confirmation button.
                      <>
                        <button
                          className="btn-icon"
                          title={order.status === 'Delivered' ? "Mark COD Collected" : "Can mark collected only after delivery"}
                          onClick={async () => {
                            try {
                              if (order.status !== 'Delivered') return
                              await adminOrdersAPI.updatePaymentStatus(order.id, 'collected', 'Marked as collected by admin', 'cod')
                              await loadOrders()
                              success('Payment marked collected and invoice generated')
                            } catch (err) {
                              console.error('Failed to update payment status:', err)
                              showError('Failed to update payment status')
                            }
                          }}
                          style={{ marginLeft: '0.5rem' }}
                          disabled={order.status !== 'Delivered' || order.paymentStatus === 'collected'}
                        >
                          <CheckCircle size={16} />
                        </button>
                      </>
                    ) : (
                      // Non-COD: keep View Details button
                      <button className="btn-icon" title="View Details" onClick={() => window.location.href = `/order/${order.id}`}>
                        <Eye size={16} />
                      </button>
                    )}
                  </td>
                  <td>
                    <button 
                      className="btn-icon" 
                      title="Download Invoice" 
                      onClick={() => handleDownloadInvoice(order.id)}
                    >
                      <Download size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Orders

