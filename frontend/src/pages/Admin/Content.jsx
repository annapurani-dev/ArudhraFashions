import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X, Check, Package, Plus, Edit2, Trash2, Image as ImageIcon } from 'lucide-react'
import { useToast } from '../../components/Toast/ToastContainer'
import { adminContentAPI, adminProductsAPI, adminNewArrivalsAPI, adminTestimonialsAPI, adminSaleStripAPI, adminCategoriesAPI } from '../../utils/adminApi'
import { getImageUrl } from '../../utils/api'

function Content() {
  const navigate = useNavigate()
  const { success, error: showError } = useToast()
  const [selectedProductIds, setSelectedProductIds] = useState([])
  const [selectedProducts, setSelectedProducts] = useState([])
  const [allProducts, setAllProducts] = useState([])
  const [filteredProducts, setFilteredProducts] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showProductModal, setShowProductModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Category/Subcategory filter state
  const [categories, setCategories] = useState([])
  const [subcategories, setSubcategories] = useState([])
  const [categoryFilter, setCategoryFilter] = useState('')
  const [subcategoryFilter, setSubcategoryFilter] = useState('')
  
  // New Arrivals state
  const [newArrivals, setNewArrivals] = useState([])
  const [loadingArrivals, setLoadingArrivals] = useState(true)
  const [showArrivalModal, setShowArrivalModal] = useState(false)
  const [editingArrival, setEditingArrival] = useState(null)
  const [arrivalForm, setArrivalForm] = useState({
    title: '',
    description: '',
    price: '',
    originalPrice: '',
    link: '',
    image: null,
    imagePreview: null
  })

  // Testimonials state
  const [testimonials, setTestimonials] = useState([])
  const [loadingTestimonials, setLoadingTestimonials] = useState(true)
  const [showTestimonialModal, setShowTestimonialModal] = useState(false)
  const [editingTestimonial, setEditingTestimonial] = useState(null)
  const [testimonialForm, setTestimonialForm] = useState({
    name: '',
    content: '',
    rating: ''
  })

  // Sale Strip state
  const [saleStrips, setSaleStrips] = useState([])
  const [loadingSaleStrips, setLoadingSaleStrips] = useState(true)
  const [showSaleStripModal, setShowSaleStripModal] = useState(false)
  const [editingSaleStrip, setEditingSaleStrip] = useState(null)
  const [saleStripForm, setSaleStripForm] = useState({
    title: '',
    description: '',
    discount: '',
    startDate: '',
    endDate: ''
  })

  useEffect(() => {
    loadFeaturedProducts()
    loadNewArrivals()
    loadTestimonials()
    loadSaleStrips()
  }, [])

  useEffect(() => {
    if (showProductModal) {
      loadAllProducts()
    }
  }, [showProductModal])

  // Get available subcategories based on selected category
  const availableSubcategories = categoryFilter
    ? subcategories.filter(sub => sub.categoryId === categoryFilter)
    : []

  useEffect(() => {
    let filtered = allProducts

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(product =>
        product.name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Filter by category
    if (categoryFilter) {
      filtered = filtered.filter(product => {
        const productCatId = product.category?.id || product.categoryId
        const productCatName = product.category?.name || product.categoryName
        const category = categories.find(c => c.id === categoryFilter)
        return productCatId === categoryFilter ||
               (category && productCatName === category.name)
      })
    }

    // Filter by subcategory
    if (subcategoryFilter) {
      filtered = filtered.filter(product => {
        const productSubcatId = product.subcategory?.id || product.subcategoryId
        const productSubcatName = product.subcategory?.name || product.subcategoryName
        const subcategory = subcategories.find(s => s.id === subcategoryFilter)
        return productSubcatId === subcategoryFilter ||
               (subcategory && productSubcatName === subcategory.name)
      })
    }

    setFilteredProducts(filtered)
  }, [searchQuery, allProducts, categoryFilter, subcategoryFilter, categories, subcategories])

  // Reset subcategory filter when category changes
  useEffect(() => {
    setSubcategoryFilter('')
  }, [categoryFilter])

  const loadFeaturedProducts = async () => {
    try {
      setLoading(true)
      const data = await adminContentAPI.getFeaturedProducts()
      const ids = data.productIds || []
      setSelectedProductIds(ids)
      
      // Load selected product details
      if (ids.length > 0) {
        const productsPromises = ids.map(id => 
          adminProductsAPI.getById(id).catch(() => null)
        )
        const products = await Promise.all(productsPromises)
        setSelectedProducts(products.filter(p => p !== null))
      } else {
        setSelectedProducts([])
      }
    } catch (err) {
      console.error('Error loading featured products:', err)
      showError('Failed to load featured products')
    } finally {
      setLoading(false)
    }
  }

  const loadAllProducts = async () => {
    try {
      const [productsData, categoriesData] = await Promise.all([
        adminProductsAPI.getAll({ limit: 1000 }),
        adminCategoriesAPI.getAll()
      ])
      setAllProducts(productsData.products || [])
      setFilteredProducts(productsData.products || [])

      // Set categories
      const cats = categoriesData || []
      setCategories(cats)

      // Flatten subcategories for easy lookup
      const allSubcats = []
      cats.forEach(cat => {
        if (cat.subcategories) {
          cat.subcategories.forEach(sub => {
            allSubcats.push({ ...sub, categoryId: cat.id })
          })
        }
      })
      setSubcategories(allSubcats)
    } catch (err) {
      console.error('Error loading products:', err)
      showError('Failed to load products')
    }
  }

  const handleProductSelect = (productId) => {
    if (selectedProductIds.includes(productId)) {
      setSelectedProductIds(selectedProductIds.filter(id => id !== productId))
    } else {
      setSelectedProductIds([...selectedProductIds, productId])
    }
  }


  const handleSave = async () => {
    try {
      setSaving(true)
      await adminContentAPI.updateFeaturedProducts(selectedProductIds)
      success('Featured products saved successfully')
      await loadFeaturedProducts() // Reload to get updated product details
      setShowProductModal(false)
    } catch (err) {
      console.error('Error saving featured products:', err)
      showError('Failed to save featured products')
    } finally {
      setSaving(false)
    }
  }

  // New Arrivals functions
  const loadNewArrivals = async () => {
    try {
      setLoadingArrivals(true)
      const data = await adminNewArrivalsAPI.getAll()
      setNewArrivals(data || [])
    } catch (err) {
      console.error('Error loading new arrivals:', err)
      showError('Failed to load new arrivals')
    } finally {
      setLoadingArrivals(false)
    }
  }

  const handleAddArrival = () => {
    setEditingArrival(null)
    setArrivalForm({
      title: '',
      description: '',
      price: '',
      originalPrice: '',
      link: '',
      image: null,
      imagePreview: null
    })
    setShowArrivalModal(true)
  }

  const handleEditArrival = (arrival) => {
    setEditingArrival(arrival)
    setArrivalForm({
      title: arrival.title || '',
      description: arrival.description || '',
      price: arrival.price || '',
      originalPrice: arrival.originalPrice || '',
      link: arrival.link || '',
      image: null,
      imagePreview: arrival.image ? getImageUrl(arrival.image) : null
    })
    setShowArrivalModal(true)
  }

  const handleDeleteArrival = async (id) => {
    if (!window.confirm('Are you sure you want to delete this new arrival?')) {
      return
    }
    try {
      await adminNewArrivalsAPI.delete(id)
      success('New arrival deleted successfully')
      await loadNewArrivals()
    } catch (err) {
      console.error('Error deleting new arrival:', err)
      showError('Failed to delete new arrival')
    }
  }

  const handleArrivalImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setArrivalForm(prev => ({
        ...prev,
        image: file,
        imagePreview: URL.createObjectURL(file)
      }))
    }
  }

  const handleArrivalImageUrlChange = (e) => {
    const url = e.target.value
    setArrivalForm(prev => ({
      ...prev,
      image: url,
      imagePreview: url || null
    }))
  }

  const handleSaveArrival = async () => {
    try {
      if (!arrivalForm.title || !arrivalForm.price) {
        showError('Title and price are required')
        return
      }

      if (!arrivalForm.image && !arrivalForm.imagePreview) {
        showError('Image is required')
        return
      }

      setSaving(true)
      
      const formData = {
        title: arrivalForm.title,
        description: arrivalForm.description || '',
        price: arrivalForm.price,
        originalPrice: arrivalForm.originalPrice || '',
        link: arrivalForm.link || ''
      }

      // If image is a URL string, include it in formData
      if (typeof arrivalForm.image === 'string') {
        formData.image = arrivalForm.image
      }

      if (editingArrival) {
        await adminNewArrivalsAPI.update(editingArrival.id, formData, arrivalForm.image instanceof File ? arrivalForm.image : null)
        success('New arrival updated successfully')
      } else {
        await adminNewArrivalsAPI.create(formData, arrivalForm.image instanceof File ? arrivalForm.image : null)
        success('New arrival added successfully')
      }

      await loadNewArrivals()
      setShowArrivalModal(false)
      setEditingArrival(null)
      setArrivalForm({
        title: '',
        description: '',
        price: '',
        originalPrice: '',
        link: '',
        image: null,
        imagePreview: null
      })
    } catch (err) {
      console.error('Error saving new arrival:', err)
      showError('Failed to save new arrival')
    } finally {
      setSaving(false)
    }
  }

  // Testimonials functions
  const loadTestimonials = async () => {
    try {
      setLoadingTestimonials(true)
      const data = await adminTestimonialsAPI.getAll()
      setTestimonials(data || [])
    } catch (err) {
      console.error('Error loading testimonials:', err)
      showError('Failed to load testimonials')
    } finally {
      setLoadingTestimonials(false)
    }
  }

  const handleAddTestimonial = () => {
    setEditingTestimonial(null)
    setTestimonialForm({
      name: '',
      content: '',
      rating: ''
    })
    setShowTestimonialModal(true)
  }

  const handleEditTestimonial = (testimonial) => {
    setEditingTestimonial(testimonial)
    setTestimonialForm({
      name: testimonial.name || '',
      content: testimonial.content || '',
      rating: testimonial.rating || ''
    })
    setShowTestimonialModal(true)
  }

  const handleDeleteTestimonial = async (id) => {
    if (!window.confirm('Are you sure you want to delete this testimonial?')) {
      return
    }
    try {
      await adminTestimonialsAPI.delete(id)
      success('Testimonial deleted successfully')
      await loadTestimonials()
    } catch (err) {
      console.error('Error deleting testimonial:', err)
      showError('Failed to delete testimonial')
    }
  }

  const handleSaveTestimonial = async () => {
    try {
      if (!testimonialForm.name || !testimonialForm.content) {
        showError('Name and content are required')
        return
      }

      setSaving(true)
      
      const formData = {
        name: testimonialForm.name,
        content: testimonialForm.content,
        rating: testimonialForm.rating || null
      }

      if (editingTestimonial) {
        await adminTestimonialsAPI.update(editingTestimonial.id, formData)
        success('Testimonial updated successfully')
      } else {
        await adminTestimonialsAPI.create(formData)
        success('Testimonial added successfully')
      }

      await loadTestimonials()
      setShowTestimonialModal(false)
      setEditingTestimonial(null)
      setTestimonialForm({
        name: '',
        content: '',
        rating: ''
      })
    } catch (err) {
      console.error('Error saving testimonial:', err)
      showError('Failed to save testimonial')
    } finally {
      setSaving(false)
    }
  }

  // Sale Strip functions
  const loadSaleStrips = async () => {
    try {
      setLoadingSaleStrips(true)
      const data = await adminSaleStripAPI.getAll()
      setSaleStrips(data || [])
    } catch (err) {
      console.error('Error loading sale strips:', err)
      showError('Failed to load sale strips')
    } finally {
      setLoadingSaleStrips(false)
    }
  }

  const handleAddSaleStrip = () => {
    setEditingSaleStrip(null)
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    setSaleStripForm({
      title: '',
      description: '',
      discount: '',
      startDate: now.toISOString().slice(0, 16),
      endDate: tomorrow.toISOString().slice(0, 16),
    })
    setShowSaleStripModal(true)
  }

  const handleEditSaleStrip = (saleStrip) => {
    setEditingSaleStrip(saleStrip)
    setSaleStripForm({
      title: saleStrip.title || '',
      description: saleStrip.description || '',
      discount: saleStrip.discount || '',
      startDate: saleStrip.startDate ? new Date(saleStrip.startDate).toISOString().slice(0, 16) : '',
      endDate: saleStrip.endDate ? new Date(saleStrip.endDate).toISOString().slice(0, 16) : ''
    })
    setShowSaleStripModal(true)
  }

  const handleDeleteSaleStrip = async (id) => {
    if (!window.confirm('Are you sure you want to delete this sale strip?')) {
      return
    }
    try {
      await adminSaleStripAPI.delete(id)
      success('Sale strip deleted successfully')
      await loadSaleStrips()
    } catch (err) {
      console.error('Error deleting sale strip:', err)
      showError('Failed to delete sale strip')
    }
  }

  const handleSaveSaleStrip = async () => {
    try {
      if (!saleStripForm.title || !saleStripForm.startDate || !saleStripForm.endDate) {
        showError('Title, start date, and end date are required')
        return
      }

      setSaving(true)
      
      const formData = {
        title: saleStripForm.title,
        description: saleStripForm.description || '',
        discount: saleStripForm.discount || '',
        startDate: saleStripForm.startDate,
        endDate: saleStripForm.endDate
      }

      if (editingSaleStrip) {
        await adminSaleStripAPI.update(editingSaleStrip.id, formData)
        success('Sale strip updated successfully')
      } else {
        await adminSaleStripAPI.create(formData)
        success('Sale strip added successfully')
      }

      await loadSaleStrips()
      setShowSaleStripModal(false)
      setEditingSaleStrip(null)
    setSaleStripForm({
      title: '',
      description: '',
      discount: '',
      startDate: '',
      endDate: ''
    })
    } catch (err) {
      console.error('Error saving sale strip:', err)
      showError('Failed to save sale strip')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>Home Page Content</h1>
          <p>Manage home page sections and content</p>
        </div>
      </div>

      <div className="content-sections">
        {/* Featured Products Section */}
        <div className="content-section-card">
          <div className="section-header">
            <div>
              <h2>Collections</h2>
              <p className="section-note">Select products to display in Collections section on the home page. Products will be shown in a responsive grid layout.</p>
            </div>
            <button 
              className="btn btn-primary"
              onClick={() => setShowProductModal(true)}
            >
              <Package size={18} />
              Select Products
            </button>
          </div>
          
          {loading ? (
            <p>Loading...</p>
          ) : selectedProducts.length > 0 ? (
            <div className="selected-products-preview">
              <p><strong>{selectedProducts.length} product(s) selected:</strong></p>
              <div className="selected-products-list">
                {selectedProducts.map(product => (
                  <div key={product.id} className="selected-product-item">
                    <img 
                      src={product.images?.[0] || product.image || '/placeholder.png'} 
                      alt={product.name}
                      className="product-thumb"
                    />
                    <span>{product.name}</span>
                    <button
                      className="btn-icon btn-small"
                      onClick={async () => {
                        const newIds = selectedProductIds.filter(id => id !== product.id)
                        setSelectedProductIds(newIds)
                        setSelectedProducts(selectedProducts.filter(p => p.id !== product.id))
                        // Auto-save when removing
                        try {
                          await adminContentAPI.updateFeaturedProducts(newIds)
                          success('Featured products updated')
                        } catch (err) {
                          console.error('Error updating featured products:', err)
                          showError('Failed to update featured products')
                        }
                      }}
                      title="Remove"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-muted">No featured products selected. Click "Select Products" to choose products.</p>
          )}
        </div>

        {/* New Arrivals Section */}
        <div className="content-section-card">
          <div className="section-header">
            <div>
              <h2>New Arrivals</h2>
              <p className="section-note">Add promotional items for the New Arrivals carousel. Minimum 5 items required, maximum unlimited. Items will auto-rotate every 4 seconds on the home page.</p>
            </div>
            <button 
              className="btn btn-primary"
              onClick={handleAddArrival}
            >
              <Plus size={18} />
              Add New Arrival
            </button>
          </div>
          
          {loadingArrivals ? (
            <p>Loading...</p>
          ) : newArrivals.length > 0 ? (
            <div className="new-arrivals-list">
              {newArrivals.length < 5 && (
                <div className="alert alert-warning">
                  <strong>Warning:</strong> Minimum 5 items required. Currently have {newArrivals.length} item(s).
                </div>
              )}
              <div className="arrivals-grid">
                {newArrivals.map(arrival => (
                  <div key={arrival.id} className="arrival-card">
                    <div className="arrival-image">
                      <img 
                        src={getImageUrl(arrival.image)} 
                        alt={arrival.title}
                      />
                    </div>
                    <div className="arrival-info">
                      <h4>{arrival.title}</h4>
                      <p className="arrival-price">₹{parseFloat(arrival.price).toLocaleString()}</p>
                      {arrival.visible ? (
                        <span className="badge badge-success">Visible</span>
                      ) : (
                        <span className="badge badge-secondary">Hidden</span>
                      )}
                    </div>
                    <div className="arrival-actions">
                      <button
                        className="btn-icon"
                        onClick={() => handleEditArrival(arrival)}
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        className="btn-icon btn-danger"
                        onClick={() => handleDeleteArrival(arrival.id)}
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-muted">No new arrivals added yet. Click "Add New Arrival" to get started.</p>
          )}
        </div>

        {/* Testimonials Section */}
        <div className="content-section-card">
          <div className="section-header">
            <div>
              <h2>Testimonials</h2>
              <p className="section-note">Manage customer testimonials displayed on the home page. Testimonials will scroll horizontally in box cards above the footer. For smooth scrolling, add at least 2-3 testimonials.</p>
            </div>
            <button 
              className="btn btn-primary"
              onClick={handleAddTestimonial}
            >
              <Plus size={18} />
              Add Testimonial
            </button>
          </div>
          
          {loadingTestimonials ? (
            <p>Loading...</p>
          ) : testimonials.length > 0 ? (
            <div className="testimonials-list">
              <div className="testimonials-grid">
                {testimonials.map(testimonial => (
                  <div key={testimonial.id} className="testimonial-card">
                    <div className="testimonial-info">
                      <h4>{testimonial.name}</h4>
                      <p className="testimonial-content">{testimonial.content}</p>
                      {testimonial.rating && (
                        <div className="testimonial-rating">
                          {'★'.repeat(testimonial.rating)}{'☆'.repeat(5 - testimonial.rating)}
                        </div>
                      )}
                      {testimonial.visible ? (
                        <span className="badge badge-success">Visible</span>
                      ) : (
                        <span className="badge badge-secondary">Hidden</span>
                      )}
                    </div>
                    <div className="testimonial-actions">
                      <button
                        className="btn-icon"
                        onClick={() => handleEditTestimonial(testimonial)}
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        className="btn-icon btn-danger"
                        onClick={() => handleDeleteTestimonial(testimonial.id)}
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-muted">No testimonials added yet. Click "Add Testimonial" to get started.</p>
          )}
        </div>

        {/* Sale Strip Section */}
        <div className="content-section-card">
          <div className="section-header">
            <div>
              <h2>Sale/Offer Strip</h2>
              <p className="section-note">Add promotional sale strips with countdown timer. The strip will be displayed between header and hero section on the home page. Only active strips (within date range) will be shown.</p>
            </div>
            <button 
              className="btn btn-primary"
              onClick={handleAddSaleStrip}
            >
              <Plus size={18} />
              Add Sale Strip
            </button>
          </div>
          
          {loadingSaleStrips ? (
            <p>Loading...</p>
          ) : saleStrips.length > 0 ? (
            <div className="sale-strips-list">
              <div className="sale-strips-grid">
                {saleStrips.map(saleStrip => {
                  const now = new Date()
                  const startDate = new Date(saleStrip.startDate)
                  const endDate = new Date(saleStrip.endDate)
                  const isActive = now >= startDate && now <= endDate
                  const isUpcoming = now < startDate
                  const isExpired = now > endDate

                  return (
                    <div key={saleStrip.id} className="sale-strip-card">
                      <div className="sale-strip-info">
                        <h4>{saleStrip.title}</h4>
                        {saleStrip.description && (
                          <p className="sale-strip-description">{saleStrip.description}</p>
                        )}
                        {saleStrip.discount && (
                          <p className="sale-strip-discount"><strong>{saleStrip.discount}</strong></p>
                        )}
                        <div className="sale-strip-dates">
                          <p><strong>Start:</strong> {new Date(saleStrip.startDate).toLocaleString()}</p>
                          <p><strong>End:</strong> {new Date(saleStrip.endDate).toLocaleString()}</p>
                        </div>
                        <div className="sale-strip-status">
                          {isActive && <span className="badge badge-success">Active</span>}
                          {isUpcoming && <span className="badge badge-warning">Upcoming</span>}
                          {isExpired && <span className="badge badge-secondary">Expired</span>}
                          {saleStrip.visible ? (
                            <span className="badge badge-success">Visible</span>
                          ) : (
                            <span className="badge badge-secondary">Hidden</span>
                          )}
                        </div>
                      </div>
                      <div className="sale-strip-actions">
                        <button
                          className="btn-icon"
                          onClick={() => handleEditSaleStrip(saleStrip)}
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          className="btn-icon btn-danger"
                          onClick={() => handleDeleteSaleStrip(saleStrip.id)}
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <p className="text-muted">No sale strips added yet. Click "Add Sale Strip" to get started.</p>
          )}
        </div>
      </div>

      {/* New Arrival Form Modal */}
      {showArrivalModal && (
        <div className="modal-overlay" onClick={() => !saving && setShowArrivalModal(false)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingArrival ? 'Edit New Arrival' : 'Add New Arrival'}</h2>
              <button 
                className="btn-icon" 
                onClick={() => !saving && setShowArrivalModal(false)}
                disabled={saving}
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  value={arrivalForm.title}
                  onChange={(e) => setArrivalForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter title"
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={arrivalForm.description}
                  onChange={(e) => setArrivalForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter description"
                  rows={3}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={arrivalForm.price}
                    onChange={(e) => setArrivalForm(prev => ({ ...prev, price: e.target.value }))}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Original Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={arrivalForm.originalPrice}
                    onChange={(e) => setArrivalForm(prev => ({ ...prev, originalPrice: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Link (Optional)</label>
                <input
                  type="text"
                  value={arrivalForm.link}
                  onChange={(e) => setArrivalForm(prev => ({ ...prev, link: e.target.value }))}
                  placeholder="/products/..."
                />
              </div>

              <div className="form-group">
                <label>Image *</label>
                <div className="image-upload-section">
                  <div className="image-preview">
                    {arrivalForm.imagePreview ? (
                      <img src={arrivalForm.imagePreview} alt="Preview" />
                    ) : (
                      <div className="image-placeholder">
                        <ImageIcon size={48} />
                        <p>No image selected</p>
                      </div>
                    )}
                  </div>
                  <div className="image-upload-options">
                    <div className="form-group">
                      <label>Upload Image</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleArrivalImageChange}
                      />
                    </div>
                    <div className="form-group">
                      <label>Or Enter Image URL</label>
                      <input
                        type="text"
                        value={typeof arrivalForm.image === 'string' ? arrivalForm.image : ''}
                        onChange={handleArrivalImageUrlChange}
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-outline" 
                onClick={() => setShowArrivalModal(false)}
                disabled={saving}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleSaveArrival}
                disabled={saving}
              >
                {saving ? 'Saving...' : editingArrival ? 'Update' : 'Add'} New Arrival
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sale Strip Form Modal */}
      {showSaleStripModal && (
        <div className="modal-overlay" onClick={() => !saving && setShowSaleStripModal(false)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingSaleStrip ? 'Edit Sale Strip' : 'Add Sale Strip'}</h2>
              <button 
                className="btn-icon" 
                onClick={() => !saving && setShowSaleStripModal(false)}
                disabled={saving}
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  value={saleStripForm.title}
                  onChange={(e) => setSaleStripForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Flash Sale, Limited Time Offer"
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={saleStripForm.description}
                  onChange={(e) => setSaleStripForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter description (optional)"
                  rows={2}
                />
              </div>

              <div className="form-group">
                <label>Discount/Offer Text</label>
                <input
                  type="text"
                  value={saleStripForm.discount}
                  onChange={(e) => setSaleStripForm(prev => ({ ...prev, discount: e.target.value }))}
                  placeholder="e.g., 50% OFF, FLAT ₹500 OFF, Buy 2 Get 1"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Start Date & Time *</label>
                  <input
                    type="datetime-local"
                    value={saleStripForm.startDate}
                    onChange={(e) => setSaleStripForm(prev => ({ ...prev, startDate: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>End Date & Time *</label>
                  <input
                    type="datetime-local"
                    value={saleStripForm.endDate}
                    onChange={(e) => setSaleStripForm(prev => ({ ...prev, endDate: e.target.value }))}
                    required
                  />
                </div>
              </div>

            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-outline" 
                onClick={() => setShowSaleStripModal(false)}
                disabled={saving}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleSaveSaleStrip}
                disabled={saving}
              >
                {saving ? 'Saving...' : editingSaleStrip ? 'Update' : 'Add'} Sale Strip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Selection Modal */}
      {showProductModal && (
        <div className="modal-overlay" onClick={() => setShowProductModal(false)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Select Collections Products</h2>
              <button
                className="btn-icon"
                onClick={() => setShowProductModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="product-filters" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <div className="search-box" style={{ flex: 1, minWidth: '200px' }}>
                  <Search size={20} />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <select
                  className="filter-select"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  style={{ minWidth: '150px' }}
                >
                  <option value="">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                <select
                  className="filter-select"
                  value={subcategoryFilter}
                  onChange={(e) => setSubcategoryFilter(e.target.value)}
                  disabled={!categoryFilter}
                  style={{ minWidth: '150px' }}
                >
                  <option value="">All Subcategories</option>
                  {availableSubcategories.map(sub => (
                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                  ))}
                </select>
              </div>

              <div className="selected-count">
                <strong>{selectedProductIds.length} product(s) selected</strong>
              </div>

              <div className="products-selection-grid">
                {filteredProducts.map(product => {
                  const isSelected = selectedProductIds.includes(product.id)
                  return (
                    <div
                      key={product.id}
                      className={`product-selection-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleProductSelect(product.id)}
                    >
                      <div className="product-selection-check">
                        {isSelected && <Check size={20} />}
                      </div>
                      <img
                        src={product.images?.[0] || product.image || '/placeholder.png'}
                        alt={product.name}
                        className="product-selection-image"
                      />
                      <div className="product-selection-info">
                        <h4>{product.name}</h4>
                        <p>₹{product.price?.toLocaleString() || '0'}</p>
                        <small className="product-category-info">
                          {product.category?.name || product.categoryName || 'Uncategorized'}
                          {product.subcategory?.name || product.subcategoryName ? ` › ${product.subcategory.name || product.subcategoryName}` : ''}
                        </small>
                      </div>
                    </div>
                  )
                })}
              </div>

              {filteredProducts.length === 0 && (
                <p className="text-center text-muted">No products found</p>
              )}
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-outline" 
                onClick={() => setShowProductModal(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleSave}
                disabled={saving || selectedProductIds.length === 0}
              >
                {saving ? 'Saving...' : 'Save Collections'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Testimonial Form Modal */}
      {showTestimonialModal && (
        <div className="modal-overlay" onClick={() => !saving && setShowTestimonialModal(false)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingTestimonial ? 'Edit Testimonial' : 'Add Testimonial'}</h2>
              <button 
                className="btn-icon" 
                onClick={() => !saving && setShowTestimonialModal(false)}
                disabled={saving}
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  value={testimonialForm.name}
                  onChange={(e) => setTestimonialForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter customer name"
                  required
                />
              </div>

              <div className="form-group">
                <label>Content *</label>
                <textarea
                  value={testimonialForm.content}
                  onChange={(e) => setTestimonialForm(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Enter testimonial content"
                  rows={5}
                  required
                />
              </div>

              <div className="form-group">
                <label>Rating (1-5)</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={testimonialForm.rating}
                  onChange={(e) => setTestimonialForm(prev => ({ ...prev, rating: e.target.value }))}
                  placeholder="Optional: 1-5"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-outline" 
                onClick={() => setShowTestimonialModal(false)}
                disabled={saving}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleSaveTestimonial}
                disabled={saving}
              >
                {saving ? 'Saving...' : editingTestimonial ? 'Update' : 'Add'} Testimonial
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Content

