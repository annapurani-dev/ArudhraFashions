// API Configuration
// Prefer VITE_API_URL set at build time. For production default to the API subdomain.
const rawViteApi = import.meta.env.VITE_API_URL
const normalizeApiUrl = (url) => {
  if (!url) return null
  // If already absolute, return without trailing slash
  if (url.startsWith('http://') || url.startsWith('https://')) return url.replace(/\/$/, '')
  // If starts with '/', treat as relative path (keep as-is)
  if (url.startsWith('/')) return url.replace(/\/$/, '')
  // If looks like a domain (contains a dot), prepend https://
  if (url.includes('.')) return `https://${url}`.replace(/\/$/, '')
  return null
}
const normalizedViteApi = normalizeApiUrl(rawViteApi)
const API_BASE_URL = normalizedViteApi
  || (import.meta.env.MODE === 'production' ? 'https://api.arudhrafashions.com/api' : 'http://localhost:5001/api')

// Helper function to get backend base URL (without /api)
const getBackendBaseUrl = () => {
  const apiUrl = normalizedViteApi || (import.meta.env.MODE === 'production' ? 'https://api.arudhrafashions.com/api' : 'http://localhost:5001/api')
  const cleaned = apiUrl.replace(/\/api\/?$/, '') // remove trailing /api if present
  // Ensure absolute URL; if starts with '/', prepend origin to avoid relative resolution
  if (cleaned.startsWith('/')) {
    return `${typeof window !== 'undefined' ? window.location.origin : ''}${cleaned}`
  }
  return cleaned
}

// Helper function to ensure image URLs are absolute
export const getImageUrl = (imagePath) => {
  if (!imagePath) return ''
  
  // Compute backend base URL (no trailing slash)
  const backendUrl = getBackendBaseUrl().replace(/\/$/, '')

  try {
    // If it's an absolute URL, normalize and ensure it points to the backend
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      const parsed = new URL(imagePath)
      // Replace localhost or missing/incorrect host with backend host
      if (parsed.hostname === 'localhost' || parsed.hostname === window.location.hostname) {
        // Rebuild using backend base
        return `${backendUrl}${parsed.pathname}${parsed.search || ''}${parsed.hash || ''}`
      }
      // If imagePath already points to the backend or an external CDN, return as-is
      return imagePath
    }
  } catch (e) {
    // If URL parsing fails, fall back to treating as relative path
  }

  // If relative path (starts with /), prepend backend base
  if (imagePath.startsWith('/')) {
    return `${backendUrl}${imagePath}`
  }

  // Otherwise, assume it's a relative filename and prepend backend URL + /uploads/products if needed
  return `${backendUrl}/${imagePath}`
}

// Helper function to get auth token
const getToken = () => {
  return localStorage.getItem('token')
}

// Helper function to get headers. Only set Content-Type when sending a body (non-GET)
const getHeaders = (includeAuth = true, method = 'GET') => {
  const headers = {}

  // Only set Content-Type for requests that send a body
  if (method !== 'GET' && method !== 'HEAD') {
    headers['Content-Type'] = 'application/json'
  }

  if (includeAuth) {
    const token = getToken()
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
    headers: getHeaders(includeAuth, method)
  }

  if (body) {
    config.body = JSON.stringify(body)
  }
  
  // Debug logging for cart/wishlist operations
  if (endpoint.includes('/cart') || endpoint.includes('/wishlist')) {
    const token = getToken()
    console.log(`API Call: ${method} ${endpoint}`, {
      hasToken: !!token,
      includeAuth,
      body
    })
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
      
      // Log detailed error for debugging
      if (endpoint.includes('/cart') || endpoint.includes('/wishlist')) {
        console.error(`API Error for ${endpoint}:`, {
          status: response.status,
          statusText: response.statusText,
          errorMessage,
          hasToken: !!getToken()
        })
      }

      // Throw an Error with status so callers can react differently to 401 vs network errors
      const err = new Error(errorMessage)
      err.status = response.status
      throw err
    }
    
    // Handle empty responses
    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json()
      return data
    }
    
    return {}
  } catch (error) {
    console.error('API Error:', error)
    // Don't throw network errors that break the app
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      throw new Error('Unable to connect to server. Please check your connection.')
    }
    throw error
  }
}

// Auth API
export const authAPI = {
  register: (mobile, password, name, email) =>
    apiCall('/auth/register', {
      method: 'POST',
      body: { mobile, password, name, email },
      includeAuth: false
    }),
  
  login: (mobile, email, password) =>
    apiCall('/auth/login', {
      method: 'POST',
      body: { mobile, email, password },
      includeAuth: false
    }),
  
  resetPassword: (token, newPassword) =>
    apiCall('/auth/reset-password', {
      method: 'POST',
      body: { token, newPassword },
      includeAuth: false
    }),
  
  forgotPassword: (email) =>
    apiCall('/auth/forgot-password', {
      method: 'POST',
      body: { email },
      includeAuth: false
    }),
  
  getMe: () => apiCall('/auth/me'),
  
  updateProfile: (updates) =>
    apiCall('/auth/profile', {
      method: 'PUT',
      body: updates
    }),
  
  changePassword: (currentPassword, newPassword) =>
    apiCall('/auth/change-password', {
      method: 'PUT',
      body: { currentPassword, newPassword }
    }),
  
  getPreferences: () => apiCall('/auth/preferences'),
  
  updatePreferences: (preferences) =>
    apiCall('/auth/preferences', {
      method: 'PUT',
      body: preferences
    })
}

// Products API
export const productsAPI = {
  getAll: (filters = {}) => {
    const queryParams = new URLSearchParams()
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        if (Array.isArray(filters[key])) {
          filters[key].forEach(val => queryParams.append(key, val))
        } else {
          queryParams.append(key, filters[key])
        }
      }
    })
    const queryString = queryParams.toString()
    return apiCall(`/products${queryString ? `?${queryString}` : ''}`, { includeAuth: false })
  },
  
  getById: (id) => apiCall(`/products/${id}`, { includeAuth: false }),
  
  getRelated: (id) => apiCall(`/products/${id}/related`, { includeAuth: false }),
  
  getReviews: (productId) => apiCall(`/products/${productId}/reviews`, { includeAuth: false }),
  
  addReview: (productId, rating, comment) =>
    apiCall(`/products/${productId}/reviews`, {
      method: 'POST',
      body: { rating, comment }
    }),
  
  updateReview: (productId, reviewId, rating, comment) =>
    apiCall(`/products/${productId}/reviews/${reviewId}`, {
      method: 'PUT',
      body: { rating, comment }
    }),
  
  deleteReview: (productId, reviewId) =>
    apiCall(`/products/${productId}/reviews/${reviewId}`, {
      method: 'DELETE'
    })
}

// Cart API
export const cartAPI = {
  get: () => apiCall('/cart'),
  
  addItem: (productId, quantity, size, color) =>
    apiCall('/cart', {
      method: 'POST',
      body: { productId, quantity, size, color }
    }),
  
  updateItem: (itemId, quantity) =>
    apiCall(`/cart/${itemId}`, {
      method: 'PUT',
      body: { quantity }
    }),
  
  removeItem: (itemId) =>
    apiCall(`/cart/${itemId}`, {
      method: 'DELETE'
    }),
  
  clear: () =>
    apiCall('/cart', {
      method: 'DELETE'
    })
}

// Checkout API (one-off buy now initiation)
export const checkoutAPI = {
  initiate: (productId, quantity = 1, size = null, color = null) =>
    apiCall('/checkout/initiate', {
      method: 'POST',
      body: { productId, quantity, size, color }
    })
}

// Orders API
export const ordersAPI = {
  create: (orderData) =>
    apiCall('/orders', {
      method: 'POST',
      body: orderData
    }),
  
  getAll: () => apiCall('/orders'),
  
  getById: (id) => apiCall(`/orders/${id}`),
  
  downloadInvoice: async (id) => {
    const token = getToken()
    if (!token) {
      throw new Error('Authentication required')
    }
    
  const API_BASE_URL = import.meta.env.VITE_API_URL
    || (import.meta.env.MODE === 'production' ? 'https://api.arudhrafashions.com/api' : 'http://localhost:5001/api')
    const response = await fetch(`${API_BASE_URL}/orders/${id}/invoice`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (!response.ok) {
      throw new Error('Failed to download invoice')
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
    apiCall(`/orders/${id}/send-invoice`, {
      method: 'POST'
    })
}

// Wishlist API
export const wishlistAPI = {
  getAll: () => apiCall('/wishlist'),
  
  add: (productId) =>
    apiCall('/wishlist', {
      method: 'POST',
      body: { productId }
    }),
  
  remove: (productId) =>
    apiCall(`/wishlist/${productId}`, {
      method: 'DELETE'
    }),
  
  check: (productId) => apiCall(`/wishlist/check/${productId}`)
}

// Compare API
export const compareAPI = {
  getAll: () => apiCall('/compare'),
  
  add: (productId) =>
    apiCall('/compare', {
      method: 'POST',
      body: { productId }
    }),
  
  remove: (productId) =>
    apiCall(`/compare/${productId}`, {
      method: 'DELETE'
    }),
  
  check: (productId) => apiCall(`/compare/check/${productId}`),
  
  getCount: () => apiCall('/compare/count')
}

// Addresses API
export const addressesAPI = {
  getAll: () => apiCall('/addresses'),
  
  add: (addressData) =>
    apiCall('/addresses', {
      method: 'POST',
      body: addressData
    }),
  
  update: (id, addressData) =>
    apiCall(`/addresses/${id}`, {
      method: 'PUT',
      body: addressData
    }),
  
  delete: (id) =>
    apiCall(`/addresses/${id}`, {
      method: 'DELETE'
    })
}

// Payment Methods API
export const paymentAPI = {
  getAll: () => apiCall('/payment-methods'),
  
  add: (paymentData) =>
    apiCall('/payment-methods', {
      method: 'POST',
      body: paymentData
    }),
  
  update: (id, paymentData) =>
    apiCall(`/payment-methods/${id}`, {
      method: 'PUT',
      body: paymentData
    }),
  
  delete: (id) =>
    apiCall(`/payment-methods/${id}`, {
      method: 'DELETE'
    }),

  createRazorpayOrder: (orderData) =>
    apiCall('/payment-methods/razorpay/order', {
      method: 'POST',
      body: orderData
    }),

  verifyRazorpayPayment: (paymentData) =>
    apiCall('/payment-methods/razorpay/verify', {
      method: 'POST',
      body: paymentData
    })
}

// Banners API
export const bannersAPI = {
  getAll: () => apiCall('/banners', { includeAuth: false })
}

// Coupons API
export const couponsAPI = {
  validate: (code, orderTotal) => {
    const queryParams = new URLSearchParams()
    if (orderTotal) queryParams.append('orderTotal', orderTotal)
    return apiCall(`/coupons/validate/${code}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`, { includeAuth: false })
  },
  getAvailable: (orderTotal) => {
    const queryParams = new URLSearchParams()
    if (orderTotal) queryParams.append('orderTotal', orderTotal)
    return apiCall(`/coupons/available${queryParams.toString() ? `?${queryParams.toString()}` : ''}`, { includeAuth: false })
  }
}

// Settings API
export const settingsAPI = {
  get: (category) => {
    if (category) {
      return apiCall(`/settings/${category}`, { includeAuth: false })
    }
    return apiCall('/settings', { includeAuth: false })
  },
  getShipping: () => apiCall('/settings/shipping', { includeAuth: false }),
  getContact: () => apiCall('/settings/contact', { includeAuth: false })
}

// Contact API
export const contactAPI = {
  submit: (formData) =>
    apiCall('/contact', {
      method: 'POST',
      body: formData,
      includeAuth: false
    })
}

// Returns API
export const returnsAPI = {
  getAll: () => apiCall('/returns'),
  create: (returnData) =>
    apiCall('/returns', {
      method: 'POST',
      body: returnData
    }),
  getById: (id) => apiCall(`/returns/${id}`)
}

// Newsletter API
export const newsletterAPI = {
  getStatus: () => apiCall('/newsletter/status'),
  subscribeUser: () => apiCall('/newsletter/subscribe-user', { method: 'POST' }),
  unsubscribeUser: () => apiCall('/newsletter/unsubscribe-user', { method: 'POST' }),
  subscribe: (email, name) =>
    apiCall('/newsletter/subscribe', {
      method: 'POST',
      body: { email, name },
      includeAuth: false
    }),
  unsubscribe: (email) =>
    apiCall('/newsletter/unsubscribe', {
      method: 'POST',
      body: { email },
      includeAuth: false
    })
}

// Content API
export const contentAPI = {
  getHero: () => apiCall('/content/hero', { includeAuth: false }),
  getFeaturedProducts: () => apiCall('/content/featured-products', { includeAuth: false })
}

// New Arrivals API
export const newArrivalsAPI = {
  getAll: () => apiCall('/new-arrivals', { includeAuth: false })
}

// Testimonials API
export const testimonialsAPI = {
  getAll: () => apiCall('/testimonials', { includeAuth: false })
}

// Sale Strip API
export const saleStripAPI = {
  getActive: () => apiCall('/sale-strips', { includeAuth: false }) // Returns array of active strips
}

// Home API - aggregated lightweight payload for homepage
export const homeAPI = {
  get: () => apiCall('/home', { includeAuth: false })
}

// Coins API
export const coinsAPI = {
  getBalance: () => apiCall('/coins/balance'),
  getTransactions: (page = 1, limit = 20) => apiCall(`/coins/transactions?page=${page}&limit=${limit}`),
  calculateDiscount: (coinsToRedeem, subtotal) => apiCall('/coins/calculate-discount', {
    method: 'POST',
    body: { coinsToRedeem, subtotal }
  }),
  redeem: (coinsToRedeem, orderId = null) => apiCall('/coins/redeem', {
    method: 'POST',
    body: { coinsToRedeem, orderId }
  })
}

// Discounts API (public)
export const discountsAPI = {
  getAvailable: (orderTotal, cartItems = []) => {
    const params = new URLSearchParams()
    if (orderTotal) params.append('orderTotal', orderTotal)
    if (cartItems.length > 0) params.append('cartItems', JSON.stringify(cartItems))
    return apiCall(`/discounts/available?${params.toString()}`, { includeAuth: false })
  },
  validate: (code, orderTotal, cartItems = []) => {
    const params = new URLSearchParams()
    if (orderTotal) params.append('orderTotal', orderTotal)
    if (cartItems.length > 0) params.append('cartItems', JSON.stringify(cartItems))
    return apiCall(`/discounts/validate/${code}?${params.toString()}`, { includeAuth: false })
  }
}

export default {
  authAPI,
  productsAPI,
  cartAPI,
  ordersAPI,
  wishlistAPI,
  addressesAPI,
  paymentAPI,
  bannersAPI,
  couponsAPI,
  discountsAPI,
  settingsAPI,
  contactAPI,
  returnsAPI,
  newsletterAPI,
  contentAPI,
  newArrivalsAPI,
  testimonialsAPI,
  saleStripAPI,
  coinsAPI
}

