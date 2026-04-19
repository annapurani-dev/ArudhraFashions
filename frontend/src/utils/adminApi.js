// Admin API Configuration
// Prefer build-time VITE_API_URL; in production default to the API subdomain
const API_BASE_URL = import.meta.env.VITE_API_URL
  || (import.meta.env.MODE === 'production' ? 'https://api.arudhrafashions.com/api' : 'http://localhost:5001/api')

// Helper function to get admin auth token
const getAdminToken = () => {
  return localStorage.getItem('adminToken')
}

// Helper function to get headers
const getHeaders = (includeAuth = true) => {
  const headers = {
    'Content-Type': 'application/json'
  }
  
  if (includeAuth) {
    const token = getAdminToken()
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
  }
  
  return headers
}

// Generic API call function
const apiCall = async (endpoint, options = {}) => {
  const { method = 'GET', body, includeAuth = true } = options
  
  const config = {
    method,
    headers: getHeaders(includeAuth)
  }
  
  if (body) {
    config.body = JSON.stringify(body)
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config)
    
    // Check if response is ok before parsing JSON
    if (!response.ok) {
      let errorMessage = 'Something went wrong'
      try {
        const errorData = await response.json()
        errorMessage = errorData.message || errorMessage
      } catch (e) {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`
      }
      throw new Error(errorMessage)
    }
    
    // Handle empty responses
    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json()
      return data
    }
    
    return {}
  } catch (error) {
    console.error('Admin API Error:', error)
    // Don't throw network errors that break the app
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      throw new Error('Unable to connect to server. Please check your connection.')
    }
    throw error
  }
}

// Admin Auth API
export const adminAuthAPI = {
  login: (email, password) =>
    apiCall('/admin/auth/login', {
      method: 'POST',
      body: { email, password },
      includeAuth: false
    }),
  
  getMe: () => apiCall('/admin/auth/me')
}

// Admin Dashboard API
export const adminDashboardAPI = {
  getStats: () => apiCall('/admin/stats'),
  getRecentOrders: (limit = 10) => apiCall(`/admin/recent-orders?limit=${limit}`),
  getTopProducts: () => apiCall('/admin/top-products'),
  getRevenueChart: (period = '7days') => apiCall(`/admin/revenue-chart?period=${period}`),
  getOrderStatusBreakdown: () => apiCall('/admin/order-status-breakdown'),
  getReturnsSummary: () => apiCall('/admin/returns-summary'),
  getTopCustomers: (limit = 5) => apiCall(`/admin/top-customers?limit=${limit}`)
}

// Admin Upload API
export const adminUploadAPI = {
  uploadImages: async (files) => {
    const formData = new FormData()
    files.forEach(file => {
      formData.append('images', file)
    })
    
    const token = getAdminToken()
    if (!token) {
      throw new Error('Admin authentication required')
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/admin/upload/images`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
          // Don't set Content-Type - browser will set it with boundary for FormData
        },
        body: formData
      })
      
      if (!response.ok) {
        let errorMessage = 'Failed to upload images'
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } catch (e) {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`
        }
        throw new Error(errorMessage)
      }
      
      const data = await response.json()
      return data
    } catch (error) {
      console.error('Upload API error:', error)
      throw error
    }
  },
  
  deleteImage: (filename) => {
    const name = filename.split('/').pop() // Extract filename from path
    return apiCall(`/admin/upload/images/${name}`, { method: 'DELETE' })
  }
}

// Admin Products API
export const adminProductsAPI = {
  getAll: (filters = {}) => {
    const queryParams = new URLSearchParams()
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        queryParams.append(key, filters[key])
      }
    })
    const queryString = queryParams.toString()
    return apiCall(`/admin/products${queryString ? `?${queryString}` : ''}`)
  },
  
  create: (productData) =>
    apiCall('/admin/products', {
      method: 'POST',
      body: productData
    }),
  
  getById: (id) =>
    apiCall(`/admin/products/${id}`),
  
  update: (id, productData) =>
    apiCall(`/admin/products/${id}`, {
      method: 'PUT',
      body: productData
    }),
  
  delete: (id) =>
    apiCall(`/admin/products/${id}`, {
      method: 'DELETE'
    }),
  
  toggleStatus: (id) =>
    apiCall(`/admin/products/${id}/status`, {
      method: 'PUT'
    })
}

// Admin Orders API
export const adminOrdersAPI = {
  getAll: (filters = {}) => {
    const queryParams = new URLSearchParams()
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        queryParams.append(key, filters[key])
      }
    })
    const queryString = queryParams.toString()
    return apiCall(`/admin/orders${queryString ? `?${queryString}` : ''}`)
  },
  
  getById: (id) => apiCall(`/admin/orders/${id}`),
  
  updateStatus: (id, status) =>
    apiCall(`/admin/orders/${id}/status`, {
      method: 'PUT',
      body: { status }
    }),
 
  updatePaymentStatus: (id, paymentStatus, note, method) =>
    apiCall(`/admin/orders/${id}/payment-status`, {
      method: 'PUT',
      body: { paymentStatus, note, method }
    }),
  
  downloadInvoice: async (id) => {
    const token = getAdminToken()
    if (!token) {
      throw new Error('Admin authentication required')
    }
    
    const API_BASE_URL = import.meta.env.VITE_API_URL
      || (import.meta.env.MODE === 'production' ? 'https://api.arudhrafashions.com/api' : 'http://localhost:5001/api')
    const response = await fetch(`${API_BASE_URL}/admin/orders/${id}/invoice`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (!response.ok) {
      // Try to get error message from response
      let errorMessage = 'Failed to download invoice'
      try {
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } else {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`
        }
      } catch (e) {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`
      }
      throw new Error(errorMessage)
    }
    
    // Check if response is actually a PDF
    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('application/pdf')) {
      throw new Error('Server did not return a PDF file')
    }
    
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `invoice-${id}.pdf`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  },
  
  sendInvoice: (id) =>
    apiCall(`/admin/orders/${id}/send-invoice`, {
      method: 'POST'
    })
}

// Admin Customers API
export const adminCustomersAPI = {
  getAll: (filters = {}) => {
    const queryParams = new URLSearchParams()
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        queryParams.append(key, filters[key])
      }
    })
    const queryString = queryParams.toString()
    return apiCall(`/admin/customers${queryString ? `?${queryString}` : ''}`)
  },
  
  getById: (id) => apiCall(`/admin/customers/${id}`),
  
  toggleStatus: (id) =>
    apiCall(`/admin/customers/${id}/status`, {
      method: 'PUT'
    })
}

// Admin Banners API
export const adminBannersAPI = {
  getAll: () => apiCall('/admin/banners/all'),
  create: (bannerData) =>
    apiCall('/admin/banners/create', {
      method: 'POST',
      body: bannerData
    }),
  update: (id, bannerData) =>
    apiCall(`/admin/banners/update/${id}`, {
      method: 'PUT',
      body: bannerData
    }),
  delete: (id) =>
    apiCall(`/admin/banners/delete/${id}`, {
      method: 'DELETE'
    }),
  updatePosition: (id, position) =>
    apiCall(`/admin/banners/position/${id}`, {
      method: 'PUT',
      body: { position }
    }),
  toggleVisibility: (id) =>
    apiCall(`/admin/banners/visibility/${id}`, {
      method: 'PUT'
    })
}

// Admin Coupons API
export const adminCouponsAPI = {
  getAll: (filters = {}) => {
    const queryParams = new URLSearchParams()
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        queryParams.append(key, filters[key])
      }
    })
    const queryString = queryParams.toString()
    return apiCall(`/admin/coupons/all${queryString ? `?${queryString}` : ''}`)
  },
  create: (couponData) =>
    apiCall('/admin/coupons/create', {
      method: 'POST',
      body: couponData
    }),
  update: (id, couponData) =>
    apiCall(`/admin/coupons/update/${id}`, {
      method: 'PUT',
      body: couponData
    }),
  delete: (id) =>
    apiCall(`/admin/coupons/delete/${id}`, {
      method: 'DELETE'
    }),
  toggleStatus: (id) =>
    apiCall(`/admin/coupons/status/${id}`, {
      method: 'PUT'
    })
}

// Admin Settings API
export const adminSettingsAPI = {
  getAll: (category) => {
    const query = category ? `?category=${category}` : ''
    return apiCall(`/admin/settings/all${query}`)
  },
  update: (settings) =>
    apiCall('/admin/settings/update', {
      method: 'PUT',
      body: settings
    }),
  updateSingle: (key, value, type, category, description) =>
    apiCall(`/admin/settings/update/${key}`, {
      method: 'PUT',
      body: { value, type, category, description }
    })
}

// Admin Queries API
export const adminQueriesAPI = {
  getAll: (filters = {}) => {
    const queryParams = new URLSearchParams()
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        queryParams.append(key, filters[key])
      }
    })
    const queryString = queryParams.toString()
    return apiCall(`/admin/queries/all${queryString ? `?${queryString}` : ''}`)
  },
  getById: (id) => apiCall(`/admin/queries/details/${id}`),
  updateStatus: (id, status) =>
    apiCall(`/admin/queries/status/${id}`, {
      method: 'PUT',
      body: { status }
    }),
  reply: (id, reply) =>
    apiCall(`/admin/queries/reply/${id}`, {
      method: 'POST',
      body: { reply }
    })
}

// Admin Returns API
export const adminReturnsAPI = {
  getAll: (filters = {}) => {
    const queryParams = new URLSearchParams()
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        queryParams.append(key, filters[key])
      }
    })
    const queryString = queryParams.toString()
    return apiCall(`/admin/returns/all${queryString ? `?${queryString}` : ''}`)
  },
  getById: (id) => apiCall(`/admin/returns/details/${id}`),
  updateStatus: (id, status) =>
    apiCall(`/admin/returns/status/${id}`, {
      method: 'PUT',
      body: { status }
    }),
  processRefund: (id) =>
    apiCall(`/admin/returns/refund/${id}`, {
      method: 'POST'
    })
}

// Admin Categories API
export const adminCategoriesAPI = {
  getAll: () => apiCall('/admin/categories/all'),
  create: (categoryData) =>
    apiCall('/admin/categories/create', {
      method: 'POST',
      body: categoryData
    }),
  update: (id, categoryData) =>
    apiCall(`/admin/categories/update/${id}`, {
      method: 'PUT',
      body: categoryData
    }),
  delete: (id) =>
    apiCall(`/admin/categories/delete/${id}`, {
      method: 'DELETE'
    }),
  addSubcategory: (categoryId, subcategoryData) =>
    apiCall(`/admin/categories/subcategory/${categoryId}`, {
      method: 'POST',
      body: subcategoryData
    }),
  updateSubcategory: (subId, subcategoryData) =>
    apiCall(`/admin/categories/subcategory/${subId}`, {
      method: 'PUT',
      body: subcategoryData
    }),
  deleteSubcategory: (subId, { force = false } = {}) =>
    apiCall(`/admin/categories/subcategory/${subId}${force ? '?force=true' : ''}`, {
      method: 'DELETE'
    })
}

// Admin Discounts API
export const adminDiscountsAPI = {
  getAll: (filters = {}) => {
    const queryParams = new URLSearchParams()
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        queryParams.append(key, filters[key])
      }
    })
    const queryString = queryParams.toString()
    return apiCall(`/admin/discounts/all${queryString ? `?${queryString}` : ''}`)
  },
  create: (discountData) =>
    apiCall('/admin/discounts/create', {
      method: 'POST',
      body: discountData
    }),
  update: (id, discountData) =>
    apiCall(`/admin/discounts/update/${id}`, {
      method: 'PUT',
      body: discountData
    }),
  delete: (id) =>
    apiCall(`/admin/discounts/delete/${id}`, {
      method: 'DELETE'
    }),
  toggleStatus: (id) =>
    apiCall(`/admin/discounts/status/${id}`, {
      method: 'PUT'
    })
}

// Admin Newsletter API
export const adminNewsletterAPI = {
  getSubscribers: (filters = {}) => {
    const queryParams = new URLSearchParams()
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        queryParams.append(key, filters[key])
      }
    })
    const queryString = queryParams.toString()
    return apiCall(`/admin/newsletter/subscribers${queryString ? `?${queryString}` : ''}`)
  },
  send: (subject, content) =>
    apiCall('/admin/newsletter/send', {
      method: 'POST',
      body: { subject, content }
    }),
  removeSubscriber: (id) =>
    apiCall(`/admin/newsletter/subscribers/${id}`, {
      method: 'DELETE'
    })
}

// Admin Content API
export const adminContentAPI = {
  getAll: (section) => {
    const query = section ? `?section=${section}` : ''
    return apiCall(`/admin/content/all${query}`)
  },
  update: (section, content) =>
    apiCall('/admin/content/update', {
      method: 'PUT',
      body: { section, content }
    }),
  getFeaturedProducts: () => apiCall('/admin/content/featured-products'),
  updateFeaturedProducts: (productIds) =>
    apiCall('/admin/content/featured-products', {
      method: 'PUT',
      body: { productIds }
    })
}

// Admin New Arrivals API
export const adminNewArrivalsAPI = {
  getAll: () => apiCall('/admin/new-arrivals/all'),
  
  create: async (data, imageFile) => {
    const formData = new FormData()
    
    // Append image file if provided
    if (imageFile) {
      formData.append('image', imageFile)
    }
    
    // Append other fields
    Object.keys(data).forEach(key => {
      if (data[key] !== undefined && data[key] !== null) {
        formData.append(key, data[key])
      }
    })
    
    const token = getAdminToken()
    if (!token) {
      throw new Error('Admin authentication required')
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/admin/new-arrivals/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })
      
      if (!response.ok) {
        let errorMessage = 'Failed to create new arrival'
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } catch (e) {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`
        }
        throw new Error(errorMessage)
      }
      
      return await response.json()
    } catch (error) {
      console.error('Admin New Arrivals API Error:', error)
      throw error
    }
  },
  
  update: async (id, data, imageFile) => {
    const formData = new FormData()
    
    // Append image file if provided
    if (imageFile) {
      formData.append('image', imageFile)
    }
    
    // Append other fields
    Object.keys(data).forEach(key => {
      if (data[key] !== undefined && data[key] !== null) {
        formData.append(key, data[key])
      }
    })
    
    const token = getAdminToken()
    if (!token) {
      throw new Error('Admin authentication required')
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/admin/new-arrivals/update/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })
      
      if (!response.ok) {
        let errorMessage = 'Failed to update new arrival'
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } catch (e) {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`
        }
        throw new Error(errorMessage)
      }
      
      return await response.json()
    } catch (error) {
      console.error('Admin New Arrivals API Error:', error)
      throw error
    }
  },
  
  delete: (id) => apiCall(`/admin/new-arrivals/delete/${id}`, { method: 'DELETE' }),
  
  updatePosition: (id, position) =>
    apiCall(`/admin/new-arrivals/position/${id}`, {
      method: 'PUT',
      body: { position }
    }),
  
  toggleVisibility: (id) =>
    apiCall(`/admin/new-arrivals/visibility/${id}`, {
      method: 'PUT'
    })
}

// Admin Testimonials API
export const adminTestimonialsAPI = {
  getAll: () => apiCall('/admin/testimonials/all'),
  
  create: (data) =>
    apiCall('/admin/testimonials/create', {
      method: 'POST',
      body: data
    }),
  
  update: (id, data) =>
    apiCall(`/admin/testimonials/update/${id}`, {
      method: 'PUT',
      body: data
    }),
  
  delete: (id) => apiCall(`/admin/testimonials/delete/${id}`, { method: 'DELETE' }),
  
  updatePosition: (id, position) =>
    apiCall(`/admin/testimonials/position/${id}`, {
      method: 'PUT',
      body: { position }
    }),
  
  toggleVisibility: (id) =>
    apiCall(`/admin/testimonials/visibility/${id}`, {
      method: 'PUT'
    })
}

// Admin Sale Strip API
export const adminSaleStripAPI = {
  getAll: () => apiCall('/admin/sale-strips/all'),
  
  create: (data) =>
    apiCall('/admin/sale-strips/create', {
      method: 'POST',
      body: data
    }),
  
  update: (id, data) =>
    apiCall(`/admin/sale-strips/update/${id}`, {
      method: 'PUT',
      body: data
    }),
  
  delete: (id) => apiCall(`/admin/sale-strips/delete/${id}`, { method: 'DELETE' }),
  
  toggleVisibility: (id) =>
    apiCall(`/admin/sale-strips/visibility/${id}`, {
      method: 'PUT'
    })
}

// Admin Inventory API
export const adminInventoryAPI = {
  getAll: (filters = {}) => {
    const queryParams = new URLSearchParams()
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        queryParams.append(key, filters[key])
      }
    })
    const queryString = queryParams.toString()
    return apiCall(`/admin/inventory/all${queryString ? `?${queryString}` : ''}`)
  },
  update: (productId, stockCount, type, reason) =>
    apiCall(`/admin/inventory/update/${productId}`, {
      method: 'PUT',
      body: { stockCount, type, reason }
    }),
  getLowStock: (threshold = 3) =>
    apiCall(`/admin/inventory/low-stock?threshold=${threshold}`),
  getOutOfStock: () => apiCall('/admin/inventory/out-of-stock')
}

// Admin Email Templates API
export const adminEmailTemplatesAPI = {
  getAll: (filters = {}) => {
    const queryParams = new URLSearchParams()
    if (filters.type) queryParams.append('type', filters.type)
    const query = queryParams.toString()
    return apiCall(`/admin/email-templates/all${query ? `?${query}` : ''}`)
  },
  getById: (id) => apiCall(`/admin/email-templates/${id}`),
  create: (templateData) =>
    apiCall('/admin/email-templates/create', {
      method: 'POST',
      body: templateData
    }),
  update: (id, templateData) =>
    apiCall(`/admin/email-templates/update/${id}`, {
      method: 'PUT',
      body: templateData
    })
}

export default {
  adminAuthAPI,
  adminDashboardAPI,
  adminUploadAPI,
  adminProductsAPI,
  adminOrdersAPI,
  adminCustomersAPI,
  adminBannersAPI,
  adminCouponsAPI,
  adminSettingsAPI,
  adminQueriesAPI,
  adminReturnsAPI,
  adminCategoriesAPI,
  adminDiscountsAPI,
  adminNewsletterAPI,
  adminContentAPI,
  adminInventoryAPI,
  adminEmailTemplatesAPI
}

