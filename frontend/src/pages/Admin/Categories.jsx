import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, ChevronDown, ChevronRight, X } from 'lucide-react'
import { useToast } from '../../components/Toast/ToastContainer'
import { adminCategoriesAPI } from '../../utils/adminApi'

function Categories() {
  const { success, error: showError } = useToast()
  const [expandedCategory, setExpandedCategory] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [editingSubcategory, setEditingSubcategory] = useState(null)
  const [addCategoryForm, setAddCategoryForm] = useState({ name: '', customFilters: [] })
  const [showSubcategoryModal, setShowSubcategoryModal] = useState(false)
  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false)
  const [showEditSubcategoryModal, setShowEditSubcategoryModal] = useState(false)
  const [subcategoryForm, setSubcategoryForm] = useState({ categoryId: '', name: '' })
  const [editCategoryForm, setEditCategoryForm] = useState({ id: '', name: '', customFilters: [] })
  const [editSubcategoryForm, setEditSubcategoryForm] = useState({ id: '', name: '' })
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [deletingSubId, setDeletingSubId] = useState(null)

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      setLoading(true)
      // Debug: log API base and attempt to fetch categories
      try {
        const API_BASE_URL = import.meta.env.VITE_API_URL
          || (import.meta.env.MODE === 'production' ? 'https://api.arudhrafashions.com/api' : 'http://localhost:5001/api')
        console.log('[Categories] Using API base:', API_BASE_URL)
      } catch (err) {
        console.warn('[Categories] Could not read API base from env', err)
      }

      console.log('[Categories] Calling adminCategoriesAPI.getAll()')
      const data = await adminCategoriesAPI.getAll()
      console.log('[Categories] Received data:', data)
      setCategories(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('[Categories] Error loading categories:', err)
      // Provide a more descriptive error in the UI so you can see if it's auth/CORS/network
      showError(err.message || 'Failed to load categories — check console for details')
    } finally {
      setLoading(false)
    }
  }

  const handleAddCategory = async () => {
    if (!addCategoryForm.name || !addCategoryForm.name.trim()) {
      showError('Please enter a category name')
      return
    }
    try {
      await adminCategoriesAPI.create({
        name: addCategoryForm.name.trim(),
        description: '',
        customFilters: addCategoryForm.customFilters.filter(f => f.name.trim() !== ''),
        isActive: true
      })
      setAddCategoryForm({ name: '', customFilters: [] })
      setShowAddCategoryModal(false)
      await loadCategories()
      success('Category added successfully')
    } catch (err) {
      showError(err.message || 'Failed to add category')
    }
  }

  const handleAddSubcategory = (categoryId) => {
    setSubcategoryForm({ categoryId, name: '' })
    setShowSubcategoryModal(true)
  }

  const handleSubmitSubcategory = async () => {
    if (!subcategoryForm.name.trim()) {
      showError('Please enter subcategory name')
      return
    }
    try {
      await adminCategoriesAPI.addSubcategory(subcategoryForm.categoryId, {
        name: subcategoryForm.name.trim(),
        isActive: true
      })
      await loadCategories()
      setShowSubcategoryModal(false)
      setSubcategoryForm({ categoryId: '', name: '' })
      success('Subcategory added successfully')
      } catch (err) {
        showError(err.message || 'Failed to add subcategory')
      }
  }

  const handleDeleteCategory = async (categoryId) => {
    const category = categories.find(c => c.id === categoryId)
    if (!category) return
    
    if (window.confirm(`Delete category "${category.name}" and all its subcategories?`)) {
      try {
        await adminCategoriesAPI.delete(categoryId)
        await loadCategories()
        success('Category deleted successfully')
      } catch (err) {
        showError(err.message || 'Failed to delete category')
      }
    }
  }

  const handleDeleteSubcategory = async (subcategoryId) => {
    if (!window.confirm('Delete this subcategory?')) return
    try {
      console.log('[Categories] Deleting subcategory id:', subcategoryId)
      setDeletingSubId(subcategoryId)
      await adminCategoriesAPI.deleteSubcategory(subcategoryId)
      await loadCategories()
      success('Subcategory deleted successfully')
    } catch (err) {
      console.error('[Categories] deleteSubcategory error:', err)
      const msg = err.message || ''
      // If blocked due to associated products, offer force-delete option
      if (msg.includes('Cannot delete subcategory') || msg.includes('associated products')) {
        const proceed = window.confirm('This subcategory has products. Delete and reassign those products to "Uncategorized"?')
        if (!proceed) {
          showError('Delete cancelled')
          setDeletingSubId(null)
          return
        }
        try {
          await adminCategoriesAPI.deleteSubcategory(subcategoryId, { force: true })
          await loadCategories()
          success('Subcategory deleted and products reassigned to Uncategorized')
        } catch (err2) {
          console.error('[Categories] force delete error:', err2)
          showError(err2.message || 'Failed to force-delete subcategory')
          setDeletingSubId(null)
        }
        return
      }
      // If backend reports subcategory not found, refresh list (it may have been deleted)
      if (msg.toLowerCase().includes('not found')) {
        await loadCategories()
        showError('Subcategory not found (it may have been deleted). List refreshed.')
        setDeletingSubId(null)
        return
      }
      // Generic error
      showError(msg || 'Failed to delete subcategory')
      setDeletingSubId(null)
    }
  }

  const handleEditSubcategory = async (subcategoryId, oldName, newName) => {
    if (!newName || !newName.trim()) {
      showError('Please enter a subcategory name')
      return
    }
    if (newName.trim() === oldName) {
      // No change, just close modal
      return
    }
    try {
      await adminCategoriesAPI.updateSubcategory(subcategoryId, {
        name: newName.trim()
      })
      await loadCategories()
      success('Subcategory updated successfully')
    } catch (err) {
      showError(err.message || 'Failed to update subcategory')
    }
  }

  const handleEditSubcategoryFromForm = async () => {
    if (!editSubcategoryForm.name || !editSubcategoryForm.name.trim()) {
      showError('Please enter a subcategory name')
      return
    }
    try {
      const subcategory = categories
        .flatMap(cat => cat.subcategories || [])
        .find(sub => sub.id === editSubcategoryForm.id)
      const oldName = subcategory?.name || ''
      await handleEditSubcategory(editSubcategoryForm.id, oldName, editSubcategoryForm.name.trim())
      setShowEditSubcategoryModal(false)
    } catch (err) {
      // Error already handled in handleEditSubcategory
    }
  }

  const handleEditCategory = async (categoryId, updates) => {
    try {
      await adminCategoriesAPI.update(categoryId, updates)
      await loadCategories()
      success('Category updated successfully')
    } catch (err) {
      showError(err.message || 'Failed to update category')
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>Categories & Subcategories</h1>
          <p>Manage product categories and subcategories</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddCategoryModal(true)}>
          <Plus size={18} />
          Add New Category
        </button>
      </div>

      {/* Add Category Modal */}
      {showAddCategoryModal && (
        <div className="modal-overlay" onClick={() => setShowAddCategoryModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Category</h2>
              <button className="modal-close" onClick={() => setShowAddCategoryModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Category Name *</label>
                <input
                  type="text"
                  value={addCategoryForm.name}
                  onChange={(e) => setAddCategoryForm({ ...addCategoryForm, name: e.target.value })}
                  placeholder="e.g., Men, Accessories, etc."
                  autoFocus
                />
              </div>

              <div className="form-section-divider" style={{ margin: '1.5rem 0', borderTop: '1px solid var(--border)' }}></div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <label style={{ marginBottom: 0 }}>Custom Filters (Optional)</label>
                  <button 
                    className="btn btn-outline btn-small"
                    onClick={() => {
                      const filters = [...(addCategoryForm.customFilters || [])];
                      filters.push({ name: '', options: '' });
                      setAddCategoryForm({ ...addCategoryForm, customFilters: filters });
                    }}
                  >
                    <Plus size={14} /> Add Filter
                  </button>
                </div>
                
                {(addCategoryForm.customFilters || []).map((filter, index) => (
                  <div key={index} className="custom-filter-row" style={{ 
                    background: 'var(--background-light, #f9f9f9)', 
                    padding: '1rem', 
                    borderRadius: '8px',
                    marginBottom: '1rem',
                    border: '1px solid var(--border)'
                  }}>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '0.8rem' }}>Filter Name (e.g. Material)</label>
                        <input 
                          type="text"
                          value={filter.name}
                          onChange={(e) => {
                            const filters = [...addCategoryForm.customFilters];
                            filters[index].name = e.target.value;
                            setAddCategoryForm({ ...addCategoryForm, customFilters: filters });
                          }}
                          placeholder="Filter Heading"
                        />
                      </div>
                      <button 
                        className="btn-icon danger" 
                        style={{ alignSelf: 'flex-end', marginBottom: '5px' }}
                        onClick={() => {
                          const filters = addCategoryForm.customFilters.filter((_, i) => i !== index);
                          setAddCategoryForm({ ...addCategoryForm, customFilters: filters });
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem' }}>Options (comma separated)</label>
                      <input 
                        type="text"
                        value={filter.options}
                        onChange={(e) => {
                          const filters = [...addCategoryForm.customFilters];
                          filters[index].options = e.target.value;
                          setAddCategoryForm({ ...addCategoryForm, customFilters: filters });
                        }}
                        placeholder="e.g. Silk, Cotton, Georgette"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowAddCategoryModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleAddCategory}>
                Add Category
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {showEditCategoryModal && (
        <div className="modal-overlay" onClick={() => setShowEditCategoryModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Category</h2>
              <button className="modal-close" onClick={() => setShowEditCategoryModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Category Name *</label>
                <input
                  type="text"
                  value={editCategoryForm.name}
                  onChange={(e) => setEditCategoryForm({ ...editCategoryForm, name: e.target.value })}
                  placeholder="Category name"
                  autoFocus
                />
              </div>

              <div className="form-section-divider" style={{ margin: '1.5rem 0', borderTop: '1px solid var(--border)' }}></div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <label style={{ marginBottom: 0 }}>Custom Filters</label>
                  <button 
                    className="btn btn-outline btn-small"
                    onClick={() => {
                      const filters = [...(editCategoryForm.customFilters || [])];
                      filters.push({ name: '', options: '' });
                      setEditCategoryForm({ ...editCategoryForm, customFilters: filters });
                    }}
                  >
                    <Plus size={14} /> Add Filter
                  </button>
                </div>
                
                {(editCategoryForm.customFilters || []).map((filter, index) => (
                  <div key={index} className="custom-filter-row" style={{ 
                    background: 'var(--background-light, #f9f9f9)', 
                    padding: '1rem', 
                    borderRadius: '8px',
                    marginBottom: '1rem',
                    border: '1px solid var(--border)'
                  }}>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '0.8rem' }}>Filter Name (e.g. Material)</label>
                        <input 
                          type="text"
                          value={filter.name}
                          onChange={(e) => {
                            const filters = [...editCategoryForm.customFilters];
                            filters[index].name = e.target.value;
                            setEditCategoryForm({ ...editCategoryForm, customFilters: filters });
                          }}
                          placeholder="Filter Heading"
                        />
                      </div>
                      <button 
                        className="btn-icon danger" 
                        style={{ alignSelf: 'flex-end', marginBottom: '5px' }}
                        onClick={() => {
                          const filters = editCategoryForm.customFilters.filter((_, i) => i !== index);
                          setEditCategoryForm({ ...editCategoryForm, customFilters: filters });
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem' }}>Options (comma separated)</label>
                      <input 
                        type="text"
                        value={filter.options}
                        onChange={(e) => {
                          const filters = [...editCategoryForm.customFilters];
                          filters[index].options = e.target.value;
                          setEditCategoryForm({ ...editCategoryForm, customFilters: filters });
                        }}
                        placeholder="e.g. Silk, Cotton, Georgette"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowEditCategoryModal(false)}>
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                onClick={() => {
                  if (!editCategoryForm.name || !editCategoryForm.name.trim()) {
                    showError('Please enter a category name')
                    return
                  }
                  handleEditCategory(editCategoryForm.id, { 
                    name: editCategoryForm.name.trim(),
                    customFilters: editCategoryForm.customFilters.filter(f => f.name.trim() !== '')
                  })
                  setShowEditCategoryModal(false)
                }}
              >
                Update Category
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Subcategory Modal */}
      {showSubcategoryModal && (
        <div className="modal-overlay" onClick={() => setShowSubcategoryModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Subcategory</h2>
              <button className="modal-close" onClick={() => setShowSubcategoryModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Subcategory Name *</label>
                <input
                  type="text"
                  value={subcategoryForm.name}
                  onChange={(e) => setSubcategoryForm({ ...subcategoryForm, name: e.target.value })}
                  placeholder="e.g., Shirts, Pants, etc."
                  autoFocus
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSubmitSubcategory()
                    }
                  }}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowSubcategoryModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSubmitSubcategory}>
                Add Subcategory
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Subcategory Modal */}
      {showEditSubcategoryModal && (
        <div className="modal-overlay" onClick={() => setShowEditSubcategoryModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Subcategory</h2>
              <button className="modal-close" onClick={() => setShowEditSubcategoryModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Subcategory Name *</label>
                <input
                  type="text"
                  value={editSubcategoryForm.name}
                  onChange={(e) => setEditSubcategoryForm({ ...editSubcategoryForm, name: e.target.value })}
                  placeholder="Subcategory name"
                  autoFocus
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleEditSubcategoryFromForm()
                      setShowEditSubcategoryModal(false)
                    }
                  }}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowEditSubcategoryModal(false)}>
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleEditSubcategoryFromForm}
              >
                Update Subcategory
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="loading-state">Loading categories...</div>
      ) : (
        <div className="categories-list">
          {categories.length === 0 ? (
            <div className="empty-state">
              <p>No categories found. Add your first category to get started.</p>
            </div>
          ) : (
            categories.map(category => (
              <div key={category.id} className={`category-item ${expandedCategory === category.id ? 'expanded' : ''}`}>
                <div
                  className="category-item-header"
                  onClick={() => setExpandedCategory(expandedCategory === category.id ? null : category.id)}
                >
                  <div className="category-title-wrapper">
                    {expandedCategory === category.id ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    <h2>{category.name}</h2>
                    <span className="subcategory-count">
                      {category.subcategories?.length || 0} subcategories
                    </span>
                  </div>
                  <div className="category-actions" onClick={(e) => e.stopPropagation()}>
                    <button
                      className="btn btn-outline btn-small"
                      onClick={() => handleAddSubcategory(category.id)}
                    >
                      <Plus size={16} />
                      Add Subcategory
                    </button>
                    <button
                      className="btn-icon"
                      onClick={() => {
                        setEditCategoryForm({ 
                          id: category.id, 
                          name: category.name,
                          customFilters: Array.isArray(category.customFilters) 
                            ? category.customFilters.map(f => ({ ...f, options: Array.isArray(f.options) ? f.options.join(', ') : f.options }))
                            : []
                        })
                        setShowEditCategoryModal(true)
                      }}
                      title="Edit Category"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      className="btn-icon danger"
                      onClick={() => handleDeleteCategory(category.id)}
                      title="Delete Category"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className={`category-subcategories ${expandedCategory === category.id ? 'expanded' : ''}`}>
                  <div className="subcategory-header-section">
                    {/* optional header for subcategory area */}
                  </div>
                  <div className="subcategory-list">
                    {category.subcategories && category.subcategories.length > 0 ? (
                      category.subcategories.map((subcategory, idx) => {
                        const subId = subcategory?.id || subcategory?.subId || subcategory?._id || idx
                        const subName = subcategory?.name || subcategory?.title || subcategory?.subcategoryName || 'Unnamed'
                        return (
                          <div key={subId} className="subcategory-item" data-subid={subId}>
                            <span>{subName}</span>
                            <div className="subcategory-actions">
                              <button
                                type="button"
                                className="btn-icon"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  console.log('[Categories] edit button clicked', subId)
                                  setEditSubcategoryForm({ id: subId, name: subName })
                                  setShowEditSubcategoryModal(true)
                                }}
                                title="Edit"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                type="button"
                                className="btn-icon danger"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  console.log('[Categories] delete button clicked', subId)
                                  handleDeleteSubcategory(subId)
                                }}
                                title="Delete"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        )
                      })
                    ) : (
                      <div className="empty-subcategories">
                        <p>No subcategories. Click "Add Subcategory" to add one.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default Categories

