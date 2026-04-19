import { useState, useEffect } from 'react'
import { Search, Eye, Mail, Phone, Package, Calendar, Users, X } from 'lucide-react'
import { adminCustomersAPI } from '../../utils/adminApi'
import { useToast } from '../../components/Toast/ToastContainer'

function Customers() {
  const [searchQuery, setSearchQuery] = useState('')
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const { error: showError, success } = useToast()

  useEffect(() => {
    loadCustomers()
  }, [])

  const loadCustomers = async () => {
    try {
      setLoading(true)
      const filters = {}
      if (searchQuery) {
        filters.search = searchQuery
      }
      const data = await adminCustomersAPI.getAll(filters)
      setCustomers(data.customers || [])
    } catch (err) {
      console.error('Error loading customers:', err)
      showError('Failed to load customers')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchQuery !== undefined) {
        loadCustomers()
      }
    }, 500)
    return () => clearTimeout(debounceTimer)
  }, [searchQuery])

  const handleToggleStatus = async (customerId) => {
    try {
      await adminCustomersAPI.toggleStatus(customerId)
      success('Customer status updated successfully')
      loadCustomers()
    } catch (err) {
      console.error('Error toggling customer status:', err)
      showError('Failed to update customer status')
    }
  }

  const handleViewDetails = async (customerId) => {
    try {
      const customer = await adminCustomersAPI.getById(customerId)
      setSelectedCustomer(customer)
      setShowDetailsModal(true)
    } catch (err) {
      console.error('Error loading customer details:', err)
      showError('Failed to load customer details')
    }
  }

  const filteredCustomers = customers

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>Customers</h1>
          <p>Manage customer accounts and view customer information</p>
        </div>
      </div>

      <div className="admin-toolbar">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search by name, email, or mobile..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="customers-stats">
        <div className="stat-mini-card">
          <Users size={24} />
          <div>
            <h3>{customers.length}</h3>
            <p>Total Customers</p>
          </div>
        </div>
        <div className="stat-mini-card">
          <Package size={24} />
          <div>
            <h3>{customers.reduce((sum, c) => sum + (c.orders || 0), 0)}</h3>
            <p>Total Orders</p>
          </div>
        </div>
      </div>

      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Contact</th>
              <th>Orders</th>
              <th>Total Spent</th>
              <th>Joined</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>
                  Loading customers...
                </td>
              </tr>
            ) : filteredCustomers.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>
                  No customers found
                </td>
              </tr>
            ) : (
              filteredCustomers.map(customer => (
                <tr key={customer.id}>
                  <td>{customer.name}</td>
                  <td>
                    <div className="contact-info">
                      <p><Phone size={14} /> {customer.mobile}</p>
                      <p className="text-muted"><Mail size={14} /> {customer.email || 'N/A'}</p>
                    </div>
                  </td>
                  <td>{customer.orders || 0}</td>
                  <td>₹{(customer.totalSpent || 0).toLocaleString()}</td>
                  <td>{new Date(customer.joined).toLocaleDateString()}</td>
                  <td>
                    <button
                      className={`status-toggle ${customer.status === 'active' ? 'active' : 'inactive'}`}
                      onClick={() => handleToggleStatus(customer.id)}
                      title={`Click to ${customer.status === 'active' ? 'deactivate' : 'activate'}`}
                    >
                      {customer.status === 'active' ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td>
                    <button className="btn-icon" title="View Details" onClick={() => handleViewDetails(customer.id)}>
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Customer Details Modal */}
      {showDetailsModal && selectedCustomer && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Customer Details</h2>
              <button className="btn-icon" onClick={() => setShowDetailsModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="customer-details-grid">
                <div className="detail-item">
                  <label>Name</label>
                  <p>{selectedCustomer.name}</p>
                </div>
                <div className="detail-item">
                  <label>Mobile</label>
                  <p>{selectedCustomer.mobile}</p>
                </div>
                <div className="detail-item">
                  <label>Email</label>
                  <p>{selectedCustomer.email || 'N/A'}</p>
                </div>
                <div className="detail-item">
                  <label>Total Orders</label>
                  <p>{selectedCustomer.ordersCount || selectedCustomer.orders || 0}</p>
                </div>
                <div className="detail-item">
                  <label>Total Spent</label>
                  <p>₹{(selectedCustomer.totalSpent || 0).toLocaleString()}</p>
                </div>
                <div className="detail-item">
                  <label>Joined Date</label>
                  <p>{new Date(selectedCustomer.createdAt || selectedCustomer.joined).toLocaleDateString()}</p>
                </div>
                <div className="detail-item">
                  <label>Status</label>
                  <p>
                    <span className={`status-badge status-${selectedCustomer.status || 'active'}`}>
                      {selectedCustomer.status || 'active'}
                    </span>
                  </p>
                </div>
                {selectedCustomer.addresses && selectedCustomer.addresses.length > 0 && (
                  <div className="detail-item full-width">
                    <label>Addresses</label>
                    <div className="addresses-list">
                      {selectedCustomer.addresses.map((address, idx) => (
                        <div key={idx} className="address-item">
                          <p><strong>{address.type || 'Address'}</strong></p>
                          <p>{address.street}, {address.city}, {address.state} - {address.pincode}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Customers

