import { useState, useEffect } from 'react'
import { Search, AlertTriangle, Package, Edit, AlertCircle, X } from 'lucide-react'
import { useToast } from '../../components/Toast/ToastContainer'
import { adminInventoryAPI } from '../../utils/adminApi'

function Inventory() {
  const { success, error: showError } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [stockFilter, setStockFilter] = useState('')
  const [inventory, setInventory] = useState([])
  const [lowStockItems, setLowStockItems] = useState([])
  const [outOfStockItems, setOutOfStockItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingItem, setEditingItem] = useState(null)
  const [stockForm, setStockForm] = useState({ stockCount: '', type: 'adjustment', reason: '' })

  useEffect(() => {
    loadInventory()
    loadLowStock()
    loadOutOfStock()
  }, [stockFilter])

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      loadInventory()
    }, 500)
    return () => clearTimeout(debounceTimer)
  }, [searchQuery])

  const loadInventory = async () => {
    try {
      setLoading(true)
      const filters = {}
      if (stockFilter) filters.status = stockFilter
      if (searchQuery) filters.search = searchQuery
      const data = await adminInventoryAPI.getAll(filters)
      setInventory(data.inventory || [])
    } catch (err) {
      console.error('Error loading inventory:', err)
      showError('Failed to load inventory')
    } finally {
      setLoading(false)
    }
  }

  const loadLowStock = async () => {
    try {
      const data = await adminInventoryAPI.getLowStock()
      setLowStockItems(data || [])
    } catch (err) {
      console.error('Error loading low stock:', err)
    }
  }

  const loadOutOfStock = async () => {
    try {
      const data = await adminInventoryAPI.getOutOfStock()
      setOutOfStockItems(data || [])
    } catch (err) {
      console.error('Error loading out of stock:', err)
    }
  }

  const handleUpdateStock = async (productId) => {
    if (!stockForm.stockCount && stockForm.type === 'adjustment') {
      showError('Please enter stock count')
      return
    }
    try {
      await adminInventoryAPI.update(productId, parseFloat(stockForm.stockCount) || 0, stockForm.type, stockForm.reason)
      await loadInventory()
      await loadLowStock()
      await loadOutOfStock()
      setEditingItem(null)
      setStockForm({ stockCount: '', type: 'adjustment', reason: '' })
      success('Stock updated successfully')
    } catch (err) {
      showError('Failed to update stock')
    }
  }

  const filteredInventory = inventory.filter(item =>
    !searchQuery || 
    item.productName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.sku?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>Inventory Management</h1>
          <p>Track and manage product stock levels</p>
        </div>
      </div>

      {/* Alerts Section */}
      {(lowStockItems.length > 0 || outOfStockItems.length > 0) && (
        <div className="inventory-alerts">
          {outOfStockItems.length > 0 && (
            <div className="alert alert-danger">
              <AlertCircle size={20} />
              <div>
                <strong>{outOfStockItems.length} products are out of stock</strong>
                <p>Immediate action required</p>
              </div>
            </div>
          )}
          {lowStockItems.length > 0 && (
            <div className="alert alert-warning">
              <AlertTriangle size={20} />
              <div>
                <strong>{lowStockItems.length} products are running low on stock</strong>
                <p>Consider restocking soon</p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="admin-toolbar">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search by product name or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select 
          className="filter-select"
          value={stockFilter}
          onChange={(e) => setStockFilter(e.target.value)}
        >
          <option value="">All Stock</option>
          <option value="in_stock">In Stock</option>
          <option value="low_stock">Low Stock</option>
          <option value="out_of_stock">Out of Stock</option>
        </select>
      </div>

      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>SKU</th>
              <th>Current Stock</th>
              <th>Status</th>
              <th>Last Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>
                  Loading inventory...
                </td>
              </tr>
            ) : filteredInventory.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>
                  No inventory items found
                </td>
              </tr>
            ) : (
              filteredInventory.map(item => (
                <tr key={item.id}>
                  <td><strong>{item.productName}</strong></td>
                  <td>{item.sku || 'N/A'}</td>
                  <td>
                    <span className={item.stockCount === 0 ? 'text-danger' : item.stockCount <= 3 ? 'text-warning' : ''}>
                      {item.stockCount || 0}
                    </span>
                  </td>
                  <td>
                    {item.stockCount === 0 ? (
                      <span className="status-badge status-danger">
                        <AlertCircle size={14} />
                        Out of Stock
                      </span>
                    ) : item.stockCount <= 3 ? (
                      <span className="status-badge status-warning">
                        <AlertTriangle size={14} />
                        Low Stock
                      </span>
                    ) : (
                      <span className="status-badge status-success">
                        <Package size={14} />
                        In Stock
                      </span>
                    )}
                  </td>
                  <td>{item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : 'N/A'}</td>
                  <td>
                    <button
                      className="btn-icon"
                      title="Update Stock"
                      onClick={() => setEditingItem(item)}
                    >
                      <Edit size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Update Stock Modal */}
      {editingItem && (
        <div className="modal-overlay" onClick={() => {
          setEditingItem(null)
          setStockForm({ stockCount: '', type: 'adjustment', reason: '' })
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Update Stock - {editingItem.productName}</h2>
              <button 
                className="modal-close" 
                onClick={() => {
                  setEditingItem(null)
                  setStockForm({ stockCount: '', type: 'adjustment', reason: '' })
                }}
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Current Stock</label>
                <p className="current-stock">{editingItem.stockCount || 0} units</p>
              </div>
              <div className="form-group">
                <label>Update Type</label>
                <select
                  value={stockForm.type}
                  onChange={(e) => setStockForm({ ...stockForm, type: e.target.value })}
                >
                  <option value="adjustment">Adjustment</option>
                  <option value="restock">Restock</option>
                  <option value="sale">Sale</option>
                  <option value="return">Return</option>
                </select>
              </div>
              <div className="form-group">
                <label>Stock Count {stockForm.type === 'adjustment' ? '*' : ''}</label>
                <input
                  type="number"
                  value={stockForm.stockCount}
                  onChange={(e) => setStockForm({ ...stockForm, stockCount: e.target.value })}
                  placeholder={stockForm.type === 'adjustment' ? 'Enter new stock count' : 'Enter quantity'}
                  required={stockForm.type === 'adjustment'}
                />
                <small>
                  {stockForm.type === 'adjustment' 
                    ? 'Set the absolute stock count' 
                    : stockForm.type === 'restock'
                    ? 'Quantity to add to current stock'
                    : 'Quantity to subtract from current stock'}
                </small>
              </div>
              <div className="form-group">
                <label>Reason (Optional)</label>
                <textarea
                  rows="3"
                  value={stockForm.reason}
                  onChange={(e) => setStockForm({ ...stockForm, reason: e.target.value })}
                  placeholder="Enter reason for stock update..."
                />
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-outline" 
                onClick={() => {
                  setEditingItem(null)
                  setStockForm({ stockCount: '', type: 'adjustment', reason: '' })
                }}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                onClick={() => handleUpdateStock(editingItem.id)}
              >
                Update Stock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Inventory
