import { useState, useEffect } from 'react'
import { Plus, Search, Edit, Trash2, Image as ImageIcon, Eye, EyeOff, ArrowUp, ArrowDown, X, Upload } from 'lucide-react'
import { useToast } from '../../components/Toast/ToastContainer'
import { adminBannersAPI, adminUploadAPI } from '../../utils/adminApi'
import { getImageUrl } from '../../utils/api'

function Banners() {
  const { success, error: showError } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingBanner, setEditingBanner] = useState(null)
  const [banners, setBanners] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploadingImage, setUploadingImage] = useState(false)

  useEffect(() => {
    loadBanners()
  }, [])

  const loadBanners = async () => {
    try {
      setLoading(true)
      const data = await adminBannersAPI.getAll()
      setBanners(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Error loading banners:', err)
      showError('Failed to load banners')
    } finally {
      setLoading(false)
    }
  }

  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    image: '',
    link: '',
    position: banners.length + 1,
    visible: true,
    startDate: '',
    endDate: ''
  })

  const filteredBanners = banners.filter(banner =>
    !searchQuery || banner.title?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAdd = async () => {
    if (!formData.title || !formData.image) {
      showError('Please fill in title and upload an image')
      return
    }
    try {
      await adminBannersAPI.create({
        ...formData,
        startDate: formData.startDate || null,
        endDate: formData.endDate || null
      })
      setShowAddModal(false)
      setFormData({
        title: '',
        subtitle: '',
        image: '',
        link: '',
        position: banners.length + 1,
        visible: true,
        startDate: '',
        endDate: ''
      })
      await loadBanners()
      success('Banner added successfully')
    } catch (err) {
      showError(err.message || 'Failed to add banner')
    }
  }

  const handleUpdate = async () => {
    if (!editingBanner) return
    try {
      await adminBannersAPI.update(editingBanner.id, {
        ...formData,
        startDate: formData.startDate || null,
        endDate: formData.endDate || null
      })
      setEditingBanner(null)
      setShowAddModal(false)
      setFormData({
        title: '',
        subtitle: '',
        image: '',
        link: '',
        position: banners.length + 1,
        visible: true,
        startDate: '',
        endDate: ''
      })
      await loadBanners()
      success('Banner updated successfully')
    } catch (err) {
      showError(err.message || 'Failed to update banner')
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Delete this banner?')) {
      try {
        await adminBannersAPI.delete(id)
        await loadBanners()
        success('Banner deleted successfully')
      } catch (err) {
        showError('Failed to delete banner')
      }
    }
  }

  const handleToggleVisibility = async (id) => {
    try {
      await adminBannersAPI.toggleVisibility(id)
      await loadBanners()
      success('Banner visibility updated')
    } catch (err) {
      showError('Failed to update banner visibility')
    }
  }

  const handleMove = async (id, direction) => {
    try {
      const banner = banners.find(b => b.id === id)
      if (!banner) return
      
      const newPosition = direction === 'up' ? banner.position - 1 : banner.position + 1
      const targetBanner = banners.find(b => b.position === newPosition)
      
      if (targetBanner) {
        await adminBannersAPI.update(id, { position: newPosition })
        await adminBannersAPI.update(targetBanner.id, { position: banner.position })
        await loadBanners()
        success('Banner position updated')
      }
    } catch (err) {
      showError('Failed to move banner')
    }
  }

  const handleEdit = (banner) => {
    setEditingBanner(banner)
    setFormData({
      title: banner.title || '',
      subtitle: banner.subtitle || '',
      image: banner.image || '',
      link: banner.link || '',
      position: banner.position || banners.length + 1,
      visible: banner.visible !== undefined ? banner.visible : true,
      startDate: banner.startDate || '',
      endDate: banner.endDate || ''
    })
    setShowAddModal(true)
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) {
      console.log('No file selected')
      return
    }

    console.log('File selected:', file.name, file.type, file.size, 'bytes')

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showError('Please select an image file (JPG, PNG, or WebP)')
      e.target.value = '' // Reset input
      return
    }

    // Optional: Validate file size (max 10MB) - can be removed if you want no limit
    if (file.size > 10 * 1024 * 1024) {
      showError('Image size should be less than 10MB')
      e.target.value = '' // Reset input
      return
    }

    try {
      setUploadingImage(true)
      console.log('Starting upload for:', file.name)
      
      const result = await adminUploadAPI.uploadImages([file])
      console.log('Upload API response:', result)
      
      if (result && result.images && Array.isArray(result.images) && result.images.length > 0) {
        // Store the uploaded image URL in formData
        const imageUrl = result.images[0]
        console.log('Setting image URL:', imageUrl)
        setFormData(prev => {
          const updated = { ...prev, image: imageUrl }
          console.log('Updated formData:', updated)
          return updated
        })
        success('Image uploaded successfully')
      } else {
        console.error('Invalid response format:', result)
        showError('Failed to get uploaded image URL. Response: ' + JSON.stringify(result))
      }
    } catch (err) {
      console.error('Upload error details:', {
        message: err.message,
        stack: err.stack,
        name: err.name
      })
      showError(err.message || 'Failed to upload image')
    } finally {
      setUploadingImage(false)
      // Reset file input to allow re-selecting the same file
      e.target.value = ''
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>Banner & Slider Management</h1>
          <p>Manage promotional banners and homepage sliders</p>
        </div>
        <button className="btn btn-primary" onClick={() => {
          setEditingBanner(null)
          setFormData({
            title: '',
            subtitle: '',
            image: '',
            link: '',
            position: banners.length + 1,
            visible: true,
            startDate: '',
            endDate: ''
          })
          setShowAddModal(true)
        }}>
          <Plus size={18} />
          Add Banner
        </button>
      </div>

      <div className="admin-toolbar">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search banners..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select className="filter-select">
          <option value="">All Banners</option>
          <option value="visible">Visible</option>
          <option value="hidden">Hidden</option>
        </select>
      </div>

      <div className="banners-grid">
        {loading ? (
          <div className="loading-state">Loading banners...</div>
        ) : filteredBanners.length === 0 ? (
          <div className="empty-state">No banners found</div>
        ) : (
          filteredBanners.map(banner => (
            <div key={banner.id} className="banner-card">
              <div className="banner-image-preview">
                <img src={getImageUrl(banner.image)} alt={banner.title} />
                <div className="banner-overlay">
                  <span className="banner-position">Position: {banner.position}</span>
                </div>
              </div>
              <div className="banner-details">
                <h3>{banner.title}</h3>
                <p>{banner.subtitle}</p>
                <div className="banner-meta">
                  <span>Link: {banner.link}</span>
                  <span>Visible: {banner.visible ? 'Yes' : 'No'}</span>
                </div>
                <div className="banner-actions">
                  <button 
                    className="btn-icon" 
                    title={banner.visible ? 'Hide' : 'Show'}
                    onClick={() => handleToggleVisibility(banner.id)}
                  >
                    {banner.visible ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                  <button 
                    className="btn-icon" 
                    title="Move Up"
                    onClick={() => handleMove(banner.id, 'up')}
                    disabled={banner.position === 1}
                  >
                    <ArrowUp size={16} />
                  </button>
                  <button 
                    className="btn-icon" 
                    title="Move Down"
                    onClick={() => handleMove(banner.id, 'down')}
                    disabled={banner.position === banners.length}
                  >
                    <ArrowDown size={16} />
                  </button>
                  <button className="btn-icon" title="Edit" onClick={() => handleEdit(banner)}>
                    <Edit size={16} />
                  </button>
                  <button className="btn-icon danger" title="Delete" onClick={() => handleDelete(banner.id)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Banner Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingBanner ? 'Edit Banner' : 'Add New Banner'}</h2>
              <button className="modal-close" onClick={() => {
                setShowAddModal(false)
                setEditingBanner(null)
                setFormData({
                  title: '',
                  subtitle: '',
                  image: '',
                  link: '',
                  position: banners.length + 1,
                  visible: true,
                  startDate: '',
                  endDate: ''
                })
              }}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Banner Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Summer Collection Sale"
                  required
                />
              </div>
              <div className="form-group">
                <label>Subtitle</label>
                <input
                  type="text"
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  placeholder="Up to 50% off on selected items"
                />
              </div>
              <div className="form-group">
                <label>Banner Image *</label>
                <div className="image-upload-section">
                  {!formData.image ? (
                    <label className="image-upload-area">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploadingImage}
                        style={{ display: 'none' }}
                      />
                      <div className="upload-placeholder">
                        <Upload size={48} />
                        <p>Click to upload banner image</p>
                        <span>JPG, PNG or WebP (Max 10MB)</span>
                      </div>
                    </label>
                  ) : (
                    <div className="image-preview-wrapper">
                      <div className="image-preview">
                        <img src={getImageUrl(formData.image)} alt="Banner preview" />
                        <button
                          type="button"
                          className="remove-image-btn"
                          onClick={() => setFormData({ ...formData, image: '' })}
                          title="Remove image"
                        >
                          <X size={20} />
                        </button>
                      </div>
                      <label className="change-image-btn">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={uploadingImage}
                          style={{ display: 'none' }}
                        />
                        <span className="btn btn-outline btn-small">
                          <Upload size={16} />
                          {uploadingImage ? 'Uploading...' : 'Change Image'}
                        </span>
                      </label>
                    </div>
                  )}
                </div>
              </div>
              <div className="form-group">
                <label>Link URL</label>
                <input
                  type="text"
                  value={formData.link}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                  placeholder="/products/women"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Start Date</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>End Date</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.visible}
                    onChange={(e) => setFormData({ ...formData, visible: e.target.checked })}
                  />
                  <span>Visible on website</span>
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={editingBanner ? handleUpdate : handleAdd}>
                {editingBanner ? 'Update Banner' : 'Add Banner'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Banners

