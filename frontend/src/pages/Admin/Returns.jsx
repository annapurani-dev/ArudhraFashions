import { useState, useEffect } from 'react'
import { Search, Package, CheckCircle, XCircle, Clock, Eye, X } from 'lucide-react'
import { useToast } from '../../components/Toast/ToastContainer'
import { adminReturnsAPI } from '../../utils/adminApi'

function Returns() {
  const { success, error: showError } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [returns, setReturns] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedReturn, setSelectedReturn] = useState(null)

  useEffect(() => {
    loadReturns()
  }, [statusFilter])

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      loadReturns()
    }, 500)
    return () => clearTimeout(debounceTimer)
  }, [searchQuery])

  const loadReturns = async () => {
    try {
      setLoading(true)
      const filters = {}
      if (statusFilter) filters.status = statusFilter
      if (searchQuery) filters.search = searchQuery
      const data = await adminReturnsAPI.getAll(filters)
      setReturns(data.returns || [])
    } catch (err) {
      console.error('Error loading returns:', err)
      showError('Failed to load returns')
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (id, newStatus) => {
    try {
      await adminReturnsAPI.updateStatus(id, newStatus)
      await loadReturns()
      success('Return status updated')
    } catch (err) {
      showError('Failed to update return status')
    }
  }

  const processRefund = async (id) => {
    try {
      await adminReturnsAPI.processRefund(id)
      await loadReturns()
      success('Refund processed successfully')
    } catch (err) {
      showError('Failed to process refund')
    }
  }

  const filteredReturns = returns.filter(returnItem =>
    !searchQuery || 
    returnItem.orderId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    returnItem.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    returnItem.reason?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle size={16} className="text-success" />
      case 'rejected':
        return <XCircle size={16} className="text-danger" />
      case 'pending':
        return <Clock size={16} className="text-warning" />
      default:
        return <Package size={16} />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'status-success'
      case 'rejected':
        return 'status-danger'
      case 'pending':
        return 'status-warning'
      default:
        return ''
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>Returns & Refunds</h1>
          <p>Manage product returns and process refunds</p>
        </div>
      </div>

      <div className="admin-toolbar">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search by Order ID, Customer, or Reason..."
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
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="refunded">Refunded</option>
        </select>
      </div>

      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Return ID</th>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Product</th>
              <th>Reason</th>
              <th>Status</th>
              <th>Request Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>
                  Loading returns...
                </td>
              </tr>
            ) : filteredReturns.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>
                  No returns found
                </td>
              </tr>
            ) : (
              filteredReturns.map(returnItem => (
                <tr key={returnItem.id}>
                  <td><strong>#{returnItem.id}</strong></td>
                  <td>{returnItem.orderId}</td>
                  <td>{returnItem.customerName}</td>
                  <td>
                    <div className="product-info">
                      <p>{returnItem.productName}</p>
                      {returnItem.quantity && (
                        <p className="text-muted">Qty: {returnItem.quantity}</p>
                      )}
                    </div>
                  </td>
                  <td>{returnItem.reason}</td>
                  <td>
                    <span className={`status-badge ${getStatusColor(returnItem.status)}`}>
                      {getStatusIcon(returnItem.status)}
                      {returnItem.status}
                    </span>
                  </td>
                  <td>{new Date(returnItem.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="table-actions">
                      <button
                        className="btn-icon"
                        title="View Details"
                        onClick={() => setSelectedReturn(returnItem)}
                      >
                        <Eye size={16} />
                      </button>
                      {returnItem.status === 'pending' && (
                        <>
                          <button
                            className="btn-icon text-success"
                            title="Approve"
                            onClick={() => updateStatus(returnItem.id, 'approved')}
                          >
                            <CheckCircle size={16} />
                          </button>
                          <button
                            className="btn-icon text-danger"
                            title="Reject"
                            onClick={() => updateStatus(returnItem.id, 'rejected')}
                          >
                            <XCircle size={16} />
                          </button>
                        </>
                      )}
                      {returnItem.status === 'approved' && returnItem.refundStatus !== 'refunded' && (
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => processRefund(returnItem.id)}
                        >
                          Process Refund
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Return Details Modal */}
      {selectedReturn && (
        <div className="modal-overlay" onClick={() => setSelectedReturn(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Return Details</h2>
              <button 
                className="modal-close" 
                onClick={() => setSelectedReturn(null)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-group">
                <label>Return ID</label>
                <p>#{selectedReturn.id}</p>
              </div>
              <div className="detail-group">
                <label>Order ID</label>
                <p>{selectedReturn.orderId}</p>
              </div>
              <div className="detail-group">
                <label>Customer</label>
                <p>{selectedReturn.customerName}</p>
              </div>
              <div className="detail-group">
                <label>Product</label>
                <p>{selectedReturn.productName}</p>
              </div>
              <div className="detail-group">
                <label>Quantity</label>
                <p>{selectedReturn.quantity || 1}</p>
              </div>
              <div className="detail-group">
                <label>Reason</label>
                <p>{selectedReturn.reason}</p>
              </div>
              {selectedReturn.description && (
                <div className="detail-group">
                  <label>Description</label>
                  <p>{selectedReturn.description}</p>
                </div>
              )}
              <div className="detail-group">
                <label>Status</label>
                <span className={`status-badge ${getStatusColor(selectedReturn.status)}`}>
                  {getStatusIcon(selectedReturn.status)}
                  {selectedReturn.status}
                </span>
              </div>
              {selectedReturn.refundAmount && (
                <div className="detail-group">
                  <label>Refund Amount</label>
                  <p>₹{selectedReturn.refundAmount.toLocaleString()}</p>
                </div>
              )}
              <div className="detail-group">
                <label>Request Date</label>
                <p>{new Date(selectedReturn.createdAt).toLocaleString()}</p>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-outline" 
                onClick={() => setSelectedReturn(null)}
              >
                Close
              </button>
              {selectedReturn.status === 'pending' && (
                <>
                  <button
                    className="btn btn-success"
                    onClick={() => {
                      updateStatus(selectedReturn.id, 'approved')
                      setSelectedReturn(null)
                    }}
                  >
                    Approve
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => {
                      updateStatus(selectedReturn.id, 'rejected')
                      setSelectedReturn(null)
                    }}
                  >
                    Reject
                  </button>
                </>
              )}
              {selectedReturn.status === 'approved' && selectedReturn.refundStatus !== 'refunded' && (
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    processRefund(selectedReturn.id)
                    setSelectedReturn(null)
                  }}
                >
                  Process Refund
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Returns
