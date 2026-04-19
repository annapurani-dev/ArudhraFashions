import { useState, useEffect } from 'react'
import { Plus, Search, Edit, Trash2, Copy, X } from 'lucide-react'
import { useToast } from '../../components/Toast/ToastContainer'
import { adminCouponsAPI } from '../../utils/adminApi'

function Coupons() {
  const { success, error: showError } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState(null)
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCoupons()
  }, [statusFilter])

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      loadCoupons()
    }, 500)
    return () => clearTimeout(debounceTimer)
  }, [searchQuery])

  const loadCoupons = async () => {
    try {
      setLoading(true)
      const filters = {}
      if (statusFilter) filters.status = statusFilter
      if (searchQuery) filters.search = searchQuery
      const data = await adminCouponsAPI.getAll(filters)
      setCoupons(data.coupons || [])
    } catch (err) {
      console.error('Error loading coupons:', err)
      showError('Failed to load coupons')
    } finally {
      setLoading(false)
    }
  }

  const [formData, setFormData] = useState({
    code: '',
    description: '',
    type: 'percentage',
    discount: '',
    minPurchase: '',
    maxDiscount: '',
    validFrom: '',
    validUntil: '',
    usageLimit: '',
    status: 'active'
  })

  const handleAdd = async () => {
    if (!formData.code || !formData.description || !formData.discount) {
      showError('Please fill in all required fields')
      return
    }
    try {
      // Set default dates if not provided
      let validFrom = formData.validFrom
      let validUntil = formData.validUntil
      
      if (!validFrom || validFrom.trim() === '') {
        // Default to today if not provided
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        validFrom = today.toISOString().split('T')[0]
      }
      
      if (!validUntil || validUntil.trim() === '') {
        // Default to 1 year from now if not provided
        const oneYearLater = new Date()
        oneYearLater.setFullYear(oneYearLater.getFullYear() + 1)
        oneYearLater.setHours(23, 59, 59, 999)
        validUntil = oneYearLater.toISOString().split('T')[0]
      }
      
      await adminCouponsAPI.create({
        ...formData,
        discount: parseFloat(formData.discount),
        minPurchase: formData.minPurchase ? parseFloat(formData.minPurchase) : 0,
        maxDiscount: formData.maxDiscount ? parseFloat(formData.maxDiscount) : null,
        usageLimit: formData.usageLimit ? parseFloat(formData.usageLimit) : null,
        validFrom: validFrom,
        validUntil: validUntil
      })
      setShowAddModal(false)
      setFormData({
        code: '',
        description: '',
        type: 'percentage',
        discount: '',
        minPurchase: '',
        maxDiscount: '',
        validFrom: '',
        validUntil: '',
    usageLimit: '',
    status: 'active'
      })
      await loadCoupons()
      success('Coupon code added successfully')
    } catch (err) {
      showError('Failed to add coupon')
    }
  }

  const handleUpdate = async () => {
    if (!editingCoupon) return
    try {
      await adminCouponsAPI.update(editingCoupon.id, {
        ...formData,
        discount: parseFloat(formData.discount),
        minPurchase: formData.minPurchase ? parseFloat(formData.minPurchase) : 0,
        maxDiscount: formData.maxDiscount ? parseFloat(formData.maxDiscount) : null,
        usageLimit: formData.usageLimit ? parseFloat(formData.usageLimit) : null,
        validFrom: formData.validFrom || null,
        validUntil: formData.validUntil || null
      })
      setEditingCoupon(null)
      setFormData({
        code: '',
        description: '',
        type: 'percentage',
        discount: '',
        minPurchase: '',
        maxDiscount: '',
        validFrom: '',
        validUntil: '',
    usageLimit: '',
    status: 'active'
      })
      await loadCoupons()
      success('Coupon updated successfully')
    } catch (err) {
      showError('Failed to update coupon')
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Delete this coupon code?')) {
      try {
        await adminCouponsAPI.delete(id)
        await loadCoupons()
        success('Coupon deleted successfully')
      } catch (err) {
        showError('Failed to delete coupon')
      }
    }
  }

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code)
    success('Coupon code copied!')
  }

  const handleToggleStatus = async (id) => {
    try {
      await adminCouponsAPI.toggleStatus(id)
      await loadCoupons()
      success('Coupon status updated')
    } catch (err) {
      showError('Failed to update coupon status')
    }
  }

  const handleEdit = (coupon) => {
    setEditingCoupon(coupon)
    setFormData({
      code: coupon.code || '',
      description: coupon.description || '',
      type: coupon.type || 'percentage',
      discount: coupon.discount || '',
      minPurchase: coupon.minPurchase || '',
      maxDiscount: coupon.maxDiscount || '',
      validFrom: coupon.validFrom ? coupon.validFrom.split('T')[0] : '',
      validUntil: coupon.validUntil ? coupon.validUntil.split('T')[0] : '',
      usageLimit: coupon.usageLimit || '',
      status: coupon.status || 'active'
    })
    setShowAddModal(true)
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>Coupon Codes</h1>
          <p>Create and manage discount coupon codes</p>
        </div>
        <button className="btn btn-primary" onClick={() => {
          setEditingCoupon(null)
          setFormData({
            code: '',
            description: '',
            type: 'percentage',
            discount: '',
            minPurchase: '',
            maxDiscount: '',
            validFrom: '',
            validUntil: '',
    usageLimit: '',
    status: 'active'
          })
          setShowAddModal(true)
        }}>
          <Plus size={18} />
          Add Coupon
        </button>
      </div>

      <div className="admin-toolbar">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search coupons..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select className="filter-select">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Coupon Code</th>
              <th>Description</th>
              <th>Type</th>
              <th>Discount</th>
              <th>Min Purchase</th>
              <th>Usage</th>
              <th>Validity</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" className="text-center">Loading...</td>
              </tr>
            ) : coupons.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center">No coupons found</td>
              </tr>
            ) : (
              coupons.map(coupon => (
              <tr key={coupon.id}>
                <td>
                  <div className="coupon-code-cell">
                    <strong className="coupon-code">{coupon.code}</strong>
                    <button 
                      className="btn-icon-small" 
                      onClick={() => handleCopy(coupon.code)}
                      title="Copy code"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                </td>
                <td>{coupon.description}</td>
                <td>
                  <span className="badge-type">
                    {coupon.type === 'percentage' ? 'Percentage' : 
                     coupon.type === 'fixed' ? 'Fixed' : 'Free Shipping'}
                  </span>
                </td>
                <td>
                  {coupon.type === 'percentage' ? (
                    <span>{coupon.discount}% {coupon.maxDiscount && `(Max ₹${coupon.maxDiscount})`}</span>
                  ) : coupon.type === 'fixed' ? (
                    <span>₹{coupon.discount}</span>
                  ) : (
                    <span>Free Shipping</span>
                  )}
                </td>
                <td>₹{coupon.minPurchase.toLocaleString()}</td>
                <td>
                  {coupon.used} / {coupon.usageLimit || '∞'}
                </td>
                <td>
                  <div className="date-range">
                    <p>{new Date(coupon.validFrom).toLocaleDateString()}</p>
                    <p className="text-muted">to</p>
                    <p>{new Date(coupon.validUntil).toLocaleDateString()}</p>
                  </div>
                </td>
                <td>
                  <button
                    className={`status-toggle ${coupon.status}`}
                    onClick={() => handleToggleStatus(coupon.id)}
                  >
                    {coupon.status}
                  </button>
                </td>
                <td>
                  <div className="action-buttons">
                    <button className="btn-icon" title="Edit" onClick={() => handleEdit(coupon)}>
                      <Edit size={16} />
                    </button>
                    <button className="btn-icon danger" title="Delete" onClick={() => handleDelete(coupon.id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Coupon Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingCoupon ? 'Edit Coupon' : 'Add New Coupon'}</h2>
              <button className="modal-close" onClick={() => {
                setShowAddModal(false)
                setEditingCoupon(null)
                setFormData({
                  code: '',
                  description: '',
                  type: 'percentage',
                  discount: '',
                  minPurchase: '',
                  maxDiscount: '',
                  validFrom: '',
                  validUntil: '',
    usageLimit: '',
    status: 'active'
                })
              }}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Coupon Code *</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="WELCOME10"
                  required
                />
              </div>
              <div className="form-group">
                <label>Description *</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="10% off for new customers"
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Coupon Type *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    required
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                    <option value="free_shipping">Free Shipping</option>
                  </select>
                </div>
                {formData.type !== 'free_shipping' && (
                  <div className="form-group">
                    <label>Discount Value *</label>
                    <input
                      type="number"
                      value={formData.discount}
                      onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                      placeholder={formData.type === 'percentage' ? '10' : '500'}
                      required
                      min="0"
                    />
                  </div>
                )}
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Minimum Purchase (₹)</label>
                  <input
                    type="number"
                    value={formData.minPurchase}
                    onChange={(e) => setFormData({ ...formData, minPurchase: e.target.value })}
                    placeholder="1000"
                    min="0"
                  />
                </div>
                {formData.type === 'percentage' && (
                  <div className="form-group">
                    <label>Max Discount (₹)</label>
                    <input
                      type="number"
                      value={formData.maxDiscount}
                      onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
                      placeholder="200"
                      min="0"
                    />
                  </div>
                )}
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Usage Limit (Per User)</label>
                  <input
                    type="number"
                    value={formData.usageLimit}
                    onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                    placeholder="Leave empty for unlimited"
                    min="1"
                  />
                  <small>Number of times each user can use this coupon</small>
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Valid From</label>
                  <input
                    type="date"
                    value={formData.validFrom}
                    onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Valid Until</label>
                  <input
                    type="date"
                    value={formData.validUntil}
                    onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                    required
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={editingCoupon ? handleUpdate : handleAdd}>
                {editingCoupon ? 'Update Coupon' : 'Add Coupon'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Coupons

