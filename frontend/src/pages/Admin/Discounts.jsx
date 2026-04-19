import { useState, useEffect } from 'react'
import { Plus, Search, Edit, Trash2, X } from 'lucide-react'
import { useToast } from '../../components/Toast/ToastContainer'
import { adminDiscountsAPI } from '../../utils/adminApi'

function Discounts() {
  const { success, error: showError } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingDiscount, setEditingDiscount] = useState(null)
  const [discounts, setDiscounts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDiscounts()
  }, [statusFilter])

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      loadDiscounts()
    }, 500)
    return () => clearTimeout(debounceTimer)
  }, [searchQuery])

  const loadDiscounts = async () => {
    try {
      setLoading(true)
      const filters = {}
      if (statusFilter) filters.status = statusFilter
      if (searchQuery) filters.search = searchQuery
      const data = await adminDiscountsAPI.getAll(filters)
      setDiscounts(data.discounts || [])
    } catch (err) {
      console.error('Error loading discounts:', err)
      showError('Failed to load discounts')
    } finally {
      setLoading(false)
    }
  }

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    instruction: '',
    type: 'percentage',
    value: '',
    minOrder: '',
    maxDiscount: '',
    usageLimit: '',
    startDate: '',
    endDate: '',
    status: 'active'
  })

  const handleAdd = async () => {
    if (!formData.code || !formData.name || !formData.value) {
      showError('Please fill in all required fields')
      return
    }
    try {
      await adminDiscountsAPI.create({
        ...formData,
        code: formData.code.toUpperCase(),
        value: parseFloat(formData.value),
        minOrder: formData.minOrder ? parseFloat(formData.minOrder) : 0,
        maxDiscount: formData.maxDiscount ? parseFloat(formData.maxDiscount) : null,
        usageLimit: formData.usageLimit ? parseFloat(formData.usageLimit) : null,
        startDate: formData.startDate || null,
        endDate: formData.endDate || null,
        instruction: formData.instruction || null
      })
      setShowAddModal(false)
      setFormData({
        code: '',
        name: '',
        instruction: '',
        type: 'percentage',
        value: '',
        minOrder: '',
        maxDiscount: '',
        usageLimit: '',
        startDate: '',
        endDate: '',
        status: 'active'
      })
      await loadDiscounts()
      success('Discount added successfully')
    } catch (err) {
      showError('Failed to add discount')
    }
  }

  const handleUpdate = async () => {
    if (!editingDiscount) return
    try {
      await adminDiscountsAPI.update(editingDiscount.id, {
        ...formData,
        code: formData.code.toUpperCase(),
        value: parseFloat(formData.value),
        minOrder: formData.minOrder ? parseFloat(formData.minOrder) : 0,
        maxDiscount: formData.maxDiscount ? parseFloat(formData.maxDiscount) : null,
        usageLimit: formData.usageLimit ? parseFloat(formData.usageLimit) : null,
        startDate: formData.startDate || null,
        endDate: formData.endDate || null,
        instruction: formData.instruction || null
      })
      setEditingDiscount(null)
      setShowAddModal(false)
      setFormData({
        code: '',
        name: '',
        instruction: '',
        type: 'percentage',
        value: '',
        minOrder: '',
        maxDiscount: '',
        usageLimit: '',
        startDate: '',
        endDate: '',
        status: 'active'
      })
      await loadDiscounts()
      success('Discount updated successfully')
    } catch (err) {
      showError('Failed to update discount')
    }
  }


  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this discount?')) {
      try {
        await adminDiscountsAPI.delete(id)
        await loadDiscounts()
        success('Discount deleted successfully')
      } catch (err) {
        showError('Failed to delete discount')
      }
    }
  }

  const handleToggleStatus = async (id) => {
    try {
      await adminDiscountsAPI.toggleStatus(id)
      await loadDiscounts()
      success('Discount status updated')
    } catch (err) {
      showError('Failed to update discount status')
    }
  }

  const handleEdit = (discount) => {
    setEditingDiscount(discount)
    setFormData({
      code: discount.code || '',
      name: discount.name || '',
      instruction: discount.instruction || '',
      type: discount.type || 'percentage',
      value: discount.value || discount.discount || '',
      minOrder: discount.minOrder || discount.minPurchase || '',
      maxDiscount: discount.maxDiscount || '',
      usageLimit: discount.usageLimit || '',
      startDate: discount.startDate ? discount.startDate.split('T')[0] : '',
      endDate: discount.endDate ? discount.endDate.split('T')[0] : '',
      status: discount.status || 'active'
    })
    setShowAddModal(true)
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>Discounts & Promotions</h1>
          <p>Manage discount codes and promotional offers</p>
        </div>
        <button className="btn btn-primary" onClick={() => {
          setEditingDiscount(null)
          setFormData({
            code: '',
            name: '',
            instruction: '',
            type: 'percentage',
            value: '',
            minOrder: '',
            maxDiscount: '',
            usageLimit: '',
            startDate: '',
            endDate: '',
            status: 'active'
          })
          setShowAddModal(true)
        }}>
          <Plus size={18} />
          Add Discount
        </button>
      </div>

      <div className="admin-toolbar">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search discounts..."
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
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Name</th>
              <th>Instruction</th>
              <th>Type</th>
              <th>Discount</th>
              <th>Min Order</th>
              <th>Usage</th>
              <th>Validity</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="10" className="text-center">Loading...</td>
              </tr>
            ) : discounts.length === 0 ? (
              <tr>
                <td colSpan="10" className="text-center">No discounts found</td>
              </tr>
            ) : (
              discounts.map(discount => (
              <tr key={discount.id}>
                <td><strong className="discount-code">{discount.code}</strong></td>
                <td>{discount.name}</td>
                <td className="discount-instruction-cell">
                  {discount.instruction ? (
                    <span title={discount.instruction}>{discount.instruction.length > 50 ? discount.instruction.substring(0, 50) + '...' : discount.instruction}</span>
                  ) : (
                    <span className="text-muted">-</span>
                  )}
                </td>
                <td>
                  <span className="badge-type">{discount.type === 'percentage' ? 'Percentage' : discount.type === 'fixed' ? 'Fixed' : 'Custom'}</span>
                </td>
                <td>
                  {discount.type === 'percentage' ? (
                    <span>{discount.value}% {discount.maxDiscount && `(Max ₹${discount.maxDiscount})`}</span>
                  ) : (
                    <span>₹{discount.value}</span>
                  )}
                </td>
                <td>₹{discount.minOrder.toLocaleString()}</td>
                <td>
                  {discount.used} / {discount.usageLimit || '∞'}
                </td>
                <td>
                  <div className="date-range">
                    <p>{new Date(discount.startDate).toLocaleDateString()}</p>
                    <p className="text-muted">to</p>
                    <p>{new Date(discount.endDate).toLocaleDateString()}</p>
                  </div>
                </td>
                <td>
                  <button
                    className={`status-toggle ${discount.status}`}
                    onClick={() => handleToggleStatus(discount.id)}
                  >
                    {discount.status}
                  </button>
                </td>
                <td>
                  <div className="action-buttons">
                    <button className="btn-icon" title="Edit" onClick={() => handleEdit(discount)}>
                      <Edit size={16} />
                    </button>
                    <button className="btn-icon danger" title="Delete" onClick={() => handleDelete(discount.id)}>
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

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingDiscount ? 'Edit Discount' : 'Add New Discount'}</h2>
              <button className="modal-close" onClick={() => {
                setShowAddModal(false)
                setEditingDiscount(null)
                setFormData({
                  code: '',
                  name: '',
                  instruction: '',
                  type: 'percentage',
                  value: '',
                  minOrder: '',
                  maxDiscount: '',
                  usageLimit: '',
                  startDate: '',
                  endDate: '',
                  status: 'active'
                })
              }}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Discount Code *</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="SUMMER20"
                  required
                />
              </div>
              <div className="form-group">
                <label>Discount Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Summer Sale 20%"
                  required
                />
              </div>
              <div className="form-group">
                <label>Discount Instruction/Description</label>
                <textarea
                  rows="3"
                  value={formData.instruction}
                  onChange={(e) => setFormData({ ...formData, instruction: e.target.value })}
                  placeholder="e.g., 'Buy 2 Get 1 Free - Minimum 3 products required, lowest priced item free' or '10% discount on total order'"
                />
                <small>Describe how this discount should be applied. For complex discounts like 'Buy 2 Get 1 Free', specify the rules clearly.</small>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Discount Type *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    required
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Discount Value *</label>
                  <input
                    type="number"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    placeholder={formData.type === 'percentage' ? '20' : '500'}
                    required
                    min="0"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Minimum Order (₹)</label>
                  <input
                    type="number"
                    value={formData.minOrder}
                    onChange={(e) => setFormData({ ...formData, minOrder: e.target.value })}
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
                      placeholder="500"
                      min="0"
                    />
                  </div>
                )}
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Usage Limit</label>
                  <input
                    type="number"
                    value={formData.usageLimit}
                    onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                    placeholder="Leave empty for unlimited"
                    min="1"
                  />
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
                  <label>Start Date</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>End Date</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    required
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={editingDiscount ? handleUpdate : handleAdd}>
                {editingDiscount ? 'Update Discount' : 'Add Discount'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Discounts

