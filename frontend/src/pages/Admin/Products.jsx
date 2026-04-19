import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Plus, Search, Edit, Trash2, Eye, X, Upload, Package } from 'lucide-react'
import { useToast } from '../../components/Toast/ToastContainer'
import { adminProductsAPI, adminUploadAPI, adminCategoriesAPI } from '../../utils/adminApi'
import { getImageUrl } from '../../utils/api'
import VariantBuilder from '../../components/Admin/VariantBuilder'

function Products() {
  const location = useLocation()
  const navigate = useNavigate()
  const { success, error: showError } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState([])
  const [subcategories, setSubcategories] = useState([])

  useEffect(() => {
    loadCategories()
    loadProducts()
  }, [statusFilter])

  // Reload products when navigating back to the products list page
  useEffect(() => {
    const isProductsListPage = location.pathname === '/admin/products'
    const isAdd = location.pathname === '/admin/products/add'
    const isEdit = location.pathname.startsWith('/admin/products/edit/')
    if (isProductsListPage && !isAdd && !isEdit) {
      loadProducts()
    }
  }, [location.pathname])

  const loadCategories = async () => {
    try {
      const cats = await adminCategoriesAPI.getAll()
      setCategories(cats || [])

      // Flatten subcategories for easy lookup
      const allSubcats = []
      cats.forEach(cat => {
        if (cat.subcategories) {
          cat.subcategories.forEach(subcat => {
            allSubcats.push({ ...subcat, categoryId: cat.id })
          })
        }
      })
      setSubcategories(allSubcats)
    } catch (err) {
      console.error('Error loading categories:', err)
    }
  }

  // Debounce search
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      loadProducts()
    }, 500)
    return () => clearTimeout(debounceTimer)
  }, [searchQuery])

  const loadProducts = async () => {
    try {
      setLoading(true)
      const filters = {}
      if (statusFilter) {
        filters.status = statusFilter
      }
      if (searchQuery) {
        filters.search = searchQuery
      }
      const data = await adminProductsAPI.getAll(filters)
      console.log('Loaded products:', data.products?.length || 0, 'products')
      setProducts(data.products || [])
    } catch (err) {
      console.error('Error loading products:', err)
      showError(err.message || 'Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = products.filter(product => {
    if (!searchQuery) return true

    const searchLower = searchQuery.toLowerCase()
    const nameMatch = product.name?.toLowerCase().includes(searchLower)
    const categoryMatch = product.category?.name?.toLowerCase().includes(searchLower)
    const subcategoryMatch = product.subcategory?.name?.toLowerCase().includes(searchLower)

    return nameMatch || categoryMatch || subcategoryMatch
  })

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await adminProductsAPI.delete(id)
        await loadProducts()
        success('Product deleted successfully')
      } catch (err) {
        console.error('Delete product error:', err)
        showError(err.message || 'Failed to delete product')
      }
    }
  }

  const handleToggleStatus = async (id) => {
    try {
      await adminProductsAPI.toggleStatus(id)
      await loadProducts()
      success('Product status updated')
    } catch (err) {
      console.error('Toggle status error:', err)
      showError(err.message || 'Failed to update product status')
    }
  }

  const [productForm, setProductForm] = useState({
    name: '',
    categoryId: '',
    subcategoryId: '',
    brand: 'Arudhra Fashions',
    price: '',
    originalPrice: '',
    onSale: false,
    description: '',
    fullDescription: '',
    images: [],
    inventory: [
      { id: `temp-${Date.now()}`, colorName: null, images: [], sizes: [{ size: null, stock: 0 }] }
    ],
    material: '',
    care: '',
    specifications: {}
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadingImages, setUploadingImages] = useState(false)

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target

    // Handle category change - reset subcategory and set up custom filters
    if (name === 'categoryId') {
      const selectedCat = categories.find(c => String(c.id) === String(value));
      const initialSpecs = {};
      if (selectedCat && Array.isArray(selectedCat.customFilters)) {
        selectedCat.customFilters.forEach(f => {
          initialSpecs[f.name] = '';
        });
      }

      setProductForm(prev => ({
        ...prev,
        categoryId: value,
        subcategoryId: '', // Reset subcategory when category changes
        specifications: initialSpecs
      }))
      return
    }

    // Handle price change - auto-set originalPrice to same value if empty
    if (name === 'price') {
      setProductForm(prev => ({
        ...prev,
        price: value,
        originalPrice: prev.originalPrice === '' ? value : prev.originalPrice
      }))
      return
    }

    setProductForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const setInventory = (newInventory) => {
    setProductForm(prev => ({
      ...prev,
      inventory: newInventory
    }))
  }

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) {
      console.log('No files selected')
      return
    }

    console.log('Files selected:', files.map(f => ({ name: f.name, type: f.type, size: f.size })))

    // Validate file types
    const invalidFiles = files.filter(file => !file.type.startsWith('image/'))
    if (invalidFiles.length > 0) {
      showError('Please select only image files (JPG, PNG, or WebP)')
      e.target.value = ''
      return
    }

    // Validate file sizes (max 10MB each)
    const oversizedFiles = files.filter(file => file.size > 10 * 1024 * 1024)
    if (oversizedFiles.length > 0) {
      showError('Some images exceed 10MB limit. Please select smaller files.')
      e.target.value = ''
      return
    }

    try {
      setUploadingImages(true)
      console.log('Starting upload for:', files.length, 'file(s)')

      const result = await adminUploadAPI.uploadImages(files)
      console.log('Upload API response:', result)

      if (result && result.images && Array.isArray(result.images) && result.images.length > 0) {
        // Add uploaded image URLs to form
        setProductForm(prev => ({
          ...prev,
          images: [...prev.images, ...result.images]
        }))
        success(`${result.images.length} image(s) uploaded successfully`)
      } else {
        console.error('Invalid response format:', result)
        showError('Failed to get uploaded image URLs. Response: ' + JSON.stringify(result))
      }
    } catch (err) {
      console.error('Upload error details:', {
        message: err.message,
        stack: err.stack,
        name: err.name
      })
      showError(err.message || 'Failed to upload images')
    } finally {
      setUploadingImages(false)
      // Reset file input to allow re-selecting the same files
      e.target.value = ''
    }
  }

  const handleRemoveImage = async (index) => {
    const imageToRemove = productForm.images[index]

    // If it's an uploaded image (starts with /uploads or http), try to delete from server
    if (imageToRemove && (imageToRemove.startsWith('/uploads') || imageToRemove.includes('/uploads/'))) {
      try {
        await adminUploadAPI.deleteImage(imageToRemove)
      } catch (err) {
        console.error('Failed to delete image from server:', err)
        // Continue with removal even if server deletion fails
      }
    }

    setProductForm(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))

    success('Image removed')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Validate required fields
      if (!productForm.name || !productForm.categoryId || !productForm.subcategoryId) {
        showError('Please fill in all required fields (Name, Category, Subcategory)')
        setIsSubmitting(false)
        return
      }


      if (!productForm.inventory || productForm.inventory.length === 0) {
        showError('Please configure at least one inventory variant step')
        setIsSubmitting(false)
        return
      }

      // Calculate aggregated global total stock
      let globalStock = 0;
      productForm.inventory.forEach(group => {
        if (group.sizes) {
          group.sizes.forEach(sz => {
            globalStock += parseInt(sz.stock) || 0;
          });
        }
      });

      const productData = {
        ...productForm,
        price: parseFloat(productForm.price),
        onSale: productForm.onSale,
        stockCount: globalStock,
        inStock: globalStock > 0,
        isActive: true,
        // Ensure these are set explicitly
        featured: productForm.featured || false,
        new: productForm.new || false
      }

      // Only include originalPrice if it has a value (allow 0)
      if (productForm.originalPrice !== '' && productForm.originalPrice !== undefined && productForm.originalPrice !== null) {
        productData.originalPrice = parseFloat(productForm.originalPrice)
      }

      // Remove any undefined or empty string values
      Object.keys(productData).forEach(key => {
        if (productData[key] === undefined || productData[key] === '') {
          delete productData[key]
        }
      })

      console.log('Submitting product data:', productData)

      if (isEditPage && editProductId) {
        const updated = await adminProductsAPI.update(editProductId, productData)
        console.log('Product updated:', updated)
        success('Product updated successfully!')
      } else {
        const newProduct = await adminProductsAPI.create(productData)
        console.log('Product created:', newProduct)
        success('Product created successfully!')
      }
      // Navigate back and products will reload via useEffect
      navigate('/admin/products')
    } catch (err) {
      console.error('Product submit error:', err)
      const errorMessage = err.message || (isEditPage ? 'Failed to update product' : 'Failed to create product')
      showError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const isAddPage = location.pathname === '/admin/products/add'
  const isEditPage = location.pathname.startsWith('/admin/products/edit/')
  const editProductId = isEditPage ? location.pathname.split('/').pop() : null

  useEffect(() => {
    if (isEditPage && editProductId) {
      // Always reload when editProductId changes or when entering edit page
      // Check if we're editing a different product or entering edit mode fresh
      const currentEditingId = editingProduct?.id || editingProduct?._id
      if (currentEditingId !== editProductId) {
        loadProductForEdit(editProductId)
      }
    } else if (isAddPage) {
      // Reset form when entering add page
      setProductForm({
        name: '',
        categoryId: '',
        subcategoryId: '',
        brand: 'Arudhra Fashions',
        price: '',
        originalPrice: '',
        onSale: false,
        stockCount: '',
        description: '',
        fullDescription: '',
        images: [],
        inventory: [
          { id: `temp-${Date.now()}`, colorName: null, images: [], sizes: [{ size: null, stock: 0 }] }
        ],
        sizes: [],
        colors: [],
        material: '',
        care: '',
        specifications: {}
      })
      setEditingProduct(null)
    }
  }, [isEditPage, editProductId, isAddPage, editingProduct])

  const loadProductForEdit = async (id) => {
    try {
      const product = await adminProductsAPI.getById(id)
      setEditingProduct(product)
      setProductForm({
        name: product.name || '',
        categoryId: product.categoryId || product.category?.id || '',
        subcategoryId: product.subcategoryId || product.subcategory?.id || '',
        brand: product.brand || 'Arudhra Fashions',
        price: product.price ? String(product.price) : '',
        originalPrice: product.originalPrice ? String(product.originalPrice) : '',
        onSale: product.onSale || false,
        description: product.description || '',
        fullDescription: product.fullDescription || '',
        images: product.images || [],
        inventory: Array.isArray(product.inventory) && product.inventory.length > 0
          ? product.inventory
          : [{ id: `temp-${Date.now()}`, colorName: null, images: [], sizes: [{ size: null, stock: product.stockCount || 0 }] }],
        material: product.material || '',
        care: product.care || '',
        specifications: product.specifications || {}
      })
    } catch (err) {
      showError('Failed to load product for editing')
      navigate('/admin/products')
    }
  }

  if (isAddPage || isEditPage) {
    return (
      <div className="admin-page">
        <div className="admin-page-header">
          <button className="back-button" onClick={() => navigate('/admin/products')}>
            <X size={20} />
            Back
          </button>
          <h1>{isEditPage ? 'Edit Product' : 'Add New Product'}</h1>
        </div>
        <div className="admin-form-container">
          <form className="admin-form" onSubmit={handleSubmit}>
            <div className="form-section">
              <h3>Basic Information</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Product Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={productForm.name}
                    onChange={handleFormChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Category *</label>
                  <select
                    name="categoryId"
                    value={productForm.categoryId}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Subcategory *</label>
                  <select
                    name="subcategoryId"
                    value={productForm.subcategoryId}
                    onChange={handleFormChange}
                    required
                    disabled={!productForm.categoryId}
                  >
                    <option value="">Select Subcategory</option>
                    {subcategories
                      .filter(sub => sub.categoryId === productForm.categoryId)
                      .map(subcat => (
                        <option key={subcat.id} value={subcat.id}>{subcat.name}</option>
                      ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Brand</label>
                  <input
                    type="text"
                    name="brand"
                    value={productForm.brand}
                    onChange={handleFormChange}
                  />
                </div>
              </div>

              {/* Dynamic Category Filters */}
              {productForm.categoryId && categories.find(c => String(c.id) === String(productForm.categoryId))?.customFilters?.length > 0 && (
                <div className="form-row" style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                  {categories.find(c => String(c.id) === String(productForm.categoryId)).customFilters.map((filter, index) => (
                    <div key={index} className="form-group">
                      <label>{filter.name} *</label>
                      <select
                        name={`spec_${filter.name}`}
                        value={productForm.specifications?.[filter.name] || ''}
                        onChange={(e) => {
                          setProductForm(prev => ({
                            ...prev,
                            specifications: {
                              ...(prev.specifications || {}),
                              [filter.name]: e.target.value
                            }
                          }))
                        }}
                        required
                      >
                        <option value="">Select {filter.name}</option>
                        {(Array.isArray(filter.options) ? filter.options : (typeof filter.options === 'string' ? filter.options.split(',').map(s => s.trim()) : [])).map((opt, i) => (
                          <option key={i} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="form-section">
              <h3>Pricing</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Price (₹) *</label>
                  <input
                    type="number"
                    name="price"
                    value={productForm.price}
                    onChange={handleFormChange}
                    required
                    min="0"
                  />
                </div>
                <div className="form-group">
                  <label>Original Price (₹)</label>
                  <input
                    type="number"
                    name="originalPrice"
                    value={productForm.originalPrice}
                    onChange={handleFormChange}
                    min="0"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group" style={{ 
                  width: '100%', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  marginTop: '0.5rem' 
                }}>
                  <div className="admin-toggle-wrapper">
                    <div className="admin-toggle-info">
                      <span className="admin-toggle-label">Show "Sale" Badge</span>
                      <span className="admin-toggle-desc">Display a prominent sale tag on the product image</span>
                    </div>
                    <label className="admin-toggle-switch">
                      <input
                        type="checkbox"
                        name="onSale"
                        checked={productForm.onSale}
                        onChange={handleFormChange}
                      />
                      <span className="admin-toggle-slider"></span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3>Inventory & Variants</h3>
              <p className="form-hint" style={{ marginBottom: '1rem' }}>Manage complex combinations of colors and sizes. Upload specific images per color variant.</p>
              <VariantBuilder inventory={productForm.inventory} setInventory={setInventory} />
            </div>

            <div className="form-section">
              <h3>Product Images</h3>
              <div className="image-upload-section">
                {productForm.images.length === 0 ? (
                  <label className="image-upload-area">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      disabled={uploadingImages}
                      style={{ display: 'none' }}
                    />
                    <div className="upload-placeholder">
                      <Upload size={48} />
                      <p>Click to upload product images</p>
                      <span>JPG, PNG or WebP (Max 10MB each) - Multiple images supported</span>
                    </div>
                  </label>
                ) : (
                  <div className="image-preview-wrapper">
                    <div className="image-preview-grid">
                      {productForm.images.map((img, idx) => {
                        const imageUrl = getImageUrl(img)
                        return (
                          <div key={idx} className="image-preview-item">
                            <div className="image-preview">
                              <img src={imageUrl} alt={`Product image ${idx + 1}`} />
                              <button
                                type="button"
                                className="remove-image-btn"
                                onClick={() => handleRemoveImage(idx)}
                                title="Remove image"
                              >
                                <X size={20} />
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    <label className="change-image-btn">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        disabled={uploadingImages}
                        style={{ display: 'none' }}
                      />
                      <span className="btn btn-outline btn-small">
                        <Upload size={16} />
                        {uploadingImages ? 'Uploading...' : 'Add More Images'}
                      </span>
                    </label>
                  </div>
                )}
              </div>
            </div>

            <div className="form-section">
              <h3>Product Details</h3>
              <div className="form-group">
                <label>Description *</label>
                <textarea
                  rows="6"
                  name="description"
                  value={productForm.description}
                  onChange={handleFormChange}
                  placeholder="Enter product description..."
                  required
                />
              </div>
              <div className="form-group">
                <label>Full Description</label>
                <textarea
                  rows="4"
                  name="fullDescription"
                  value={productForm.fullDescription}
                  onChange={handleFormChange}
                  placeholder="Enter detailed description..."
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Material</label>
                  <input
                    type="text"
                    name="material"
                    value={productForm.material}
                    onChange={handleFormChange}
                    placeholder="e.g., 100% Cotton"
                  />
                </div>
                <div className="form-group">
                  <label>Care Instructions</label>
                  <input
                    type="text"
                    name="care"
                    value={productForm.care}
                    onChange={handleFormChange}
                    placeholder="e.g., Machine Wash Cold"
                  />
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => navigate('/admin/products')}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating...' : 'Add Product'}
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>Products</h1>
          <p>Manage your product catalog</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/admin/products/add')}>
          <Plus size={18} />
          Add Product
        </button>
      </div>

      <div className="admin-toolbar">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select className="filter-select">
          <option value="">All Categories</option>
          <option value="Women">Women</option>
          <option value="Teen">Teen</option>
          <option value="Girls">Girls</option>
        </select>
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
              <th>Image</th>
              <th>Product Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>
                  Loading products...
                </td>
              </tr>
            ) : filteredProducts.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>
                  No products found
                </td>
              </tr>
            ) : (
              filteredProducts.map(product => {
                const productId = product.id || product._id
                return (
                  <tr key={productId}>
                    <td>
                      <img src={product.images?.[0] || product.image || 'https://via.placeholder.com/50'} alt={product.name} className="table-image" />
                    </td>
                    <td>
                      <strong>{product.name}</strong>
                    </td>
                    <td>
                      {product.category?.name || 'N/A'} - {product.subcategory?.name || 'N/A'}
                    </td>
                    <td>₹{product.price?.toLocaleString() || '0'}</td>
                    <td>
                      <span className={!product.inStock ? 'stock-low' : ''}>
                        {(() => {
                          let total = 0;
                          if (Array.isArray(product.inventory)) {
                            product.inventory.forEach(grp => {
                              if (grp.sizes) grp.sizes.forEach(sz => { total += parseInt(sz.stock) || 0 });
                            })
                          }
                          return total;
                        })()} remaining
                      </span>
                    </td>
                    <td>
                      <button
                        className={`status-toggle ${product.isActive ? 'active' : 'inactive'}`}
                        onClick={() => handleToggleStatus(productId)}
                      >
                        {product.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn-icon" title="View" onClick={() => navigate(`/product/${productId}`)}>
                          <Eye size={16} />
                        </button>
                        <button className="btn-icon" title="Edit" onClick={() => navigate(`/admin/products/edit/${productId}`)}>
                          <Edit size={16} />
                        </button>
                        <button className="btn-icon danger" title="Delete" onClick={() => handleDelete(productId)}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {filteredProducts.length === 0 && (
        <div className="empty-state">
          <Package size={48} />
          <p>No products found</p>
        </div>
      )}
    </div>
  )
}

export default Products

