import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Package, User, MapPin, CreditCard, Settings, LogOut, Lock, Truck, Search, CheckCircle, Download, Eye, EyeOff, LogIn, Plus, Shield, Smartphone, Building2, Wallet, Mail, AlertTriangle, ChevronRight, Edit2, Trash2, X, RotateCcw, Coins } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useLoginModal } from '../context/LoginModalContext'
import ConfirmationModal from '../components/Modal/ConfirmationModal'
import { useToast } from '../components/Toast/ToastContainer'
import { ordersAPI, addressesAPI, paymentAPI, cartAPI, authAPI, newsletterAPI, returnsAPI, coinsAPI } from '../utils/api'
import CoinsTab from '../components/CoinsTab'
import Loading from '../components/Loading/Loading'
import { PreferencesSkeleton } from '../components/Skeletons/PageSkeletons'
import { DashboardOrdersSkeleton } from '../components/Skeletons/PageSkeletons'

function DashboardMobile({
  orders = [],
  addresses = [],
  paymentMethods = [],
  loading = false,
  activeTab = 'orders',
  setActiveTab,
  showAddAddress,
  setShowAddAddress,
  editingAddressId,
  setEditingAddressId,
  showAddPayment,
  setShowAddPayment,
  editingPaymentId,
  setEditingPaymentId,
  newAddress,
  setNewAddress,
  newPayment,
  setNewPayment,
  razorpayLoaded,
  paymentFormRef,
  profileForm,
  setProfileForm,
  showChangePassword,
  setShowChangePassword,
  passwordForm,
  setPasswordForm,
  showCurrentPassword,
  setShowCurrentPassword,
  showNewPassword,
  setShowNewPassword,
  showConfirmPassword,
  setShowConfirmPassword,
  error,
  setError,
  successMessage,
  setSuccessMessage,
  searchOrderQuery,
  setSearchOrderQuery,
  preferences,
  setPreferences,
  newsletterStatus,
  loadingPreferences,
  handleLogout,
  handleUpdateProfile,
  handleChangePassword,
  handlePreferenceChange,
  loadAddresses,
  loadPaymentMethods,
  showDeleteModal,
  setShowDeleteModal,
  showSuccessToast,
  showError,
  user,
  isAuthenticated,
  openModal,
  showReturnForm,
  setShowReturnForm,
  selectedOrderForReturn,
  handleOrderSelectForReturn,
  returnForm,
  setReturnForm,
  handleProductSelectForReturn,
  handleSubmitReturn,
  returns = []
}) {
  const { logout, updateProfile, changePassword } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [localActiveTab, setLocalActiveTab] = useState(activeTab || 'orders')
  const [localOrders, setLocalOrders] = useState(orders || [])
  const [localLoading, setLocalLoading] = useState(loading || false)
  const [localAddresses, setLocalAddresses] = useState(addresses || [])
  const [localPaymentMethods, setLocalPaymentMethods] = useState(paymentMethods || [])
  const [localShowAddAddress, setLocalShowAddAddress] = useState(showAddAddress || false)
  const [localEditingAddressId, setLocalEditingAddressId] = useState(editingAddressId || null)
  const [localShowAddPayment, setLocalShowAddPayment] = useState(showAddPayment || false)
  const [localEditingPaymentId, setLocalEditingPaymentId] = useState(editingPaymentId || null)
  const [localNewAddress, setLocalNewAddress] = useState(newAddress || {
    type: 'Home',
    name: user?.name || '',
    address: '',
    city: '',
    state: '',
    zip: '',
    isDefault: false,
    otherDetail: ''
  })
  const [localNewPayment, setLocalNewPayment] = useState(newPayment || {
    methodType: 'card',
    cardName: '',
    upiId: '',
    netBankingBank: '',
    walletProvider: ''
  })
  const [localRazorpayLoaded, setLocalRazorpayLoaded] = useState(razorpayLoaded || false)
  const [localProfileForm, setLocalProfileForm] = useState(profileForm || {
    name: user?.name || '',
    email: user?.email || '',
    mobile: user?.mobile || ''
  })
  const [localShowChangePassword, setLocalShowChangePassword] = useState(showChangePassword || false)
  const [localPasswordForm, setLocalPasswordForm] = useState(passwordForm || {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [localShowCurrentPassword, setLocalShowCurrentPassword] = useState(showCurrentPassword || false)
  const [localShowNewPassword, setLocalShowNewPassword] = useState(showNewPassword || false)
  const [localShowConfirmPassword, setLocalShowConfirmPassword] = useState(showConfirmPassword || false)
  const [localError, setLocalError] = useState(error || '')
  const [localSuccessMessage, setLocalSuccessMessage] = useState(successMessage || '')
  const [localSearchOrderQuery, setLocalSearchOrderQuery] = useState(searchOrderQuery || '')
  const [localPreferences, setLocalPreferences] = useState(preferences || {
    emailNotifications: true,
    smsNotifications: false,
    newsletter: false
  })
  const [localNewsletterStatus, setLocalNewsletterStatus] = useState(newsletterStatus || { subscribed: false, email: null })
  const [localLoadingPreferences, setLocalLoadingPreferences] = useState(loadingPreferences || false)
  const [localShowDeleteModal, setLocalShowDeleteModal] = useState(showDeleteModal || false)
  const [localShowReturnForm, setLocalShowReturnForm] = useState(showReturnForm || false)
  const [localSelectedOrderForReturn, setLocalSelectedOrderForReturn] = useState(selectedOrderForReturn || null)
  const [localReturnForm, setLocalReturnForm] = useState(returnForm || {
    orderId: '',
    productId: '',
    productName: '',
    reason: '',
    amount: ''
  })
  const [localReturns, setLocalReturns] = useState(returns || [])
  
  // Local state fallbacks (only used if props not provided)
  const [localAddressesState, setLocalAddressesState] = useState([])
  const [localPaymentMethodsState, setLocalPaymentMethodsState] = useState([])
  const [localLoadingState, setLocalLoadingState] = useState(false)
  const [localShowAddAddressState, setLocalShowAddAddressState] = useState(false)
  const [localEditingAddressIdState, setLocalEditingAddressIdState] = useState(null)
  const [localShowAddPaymentState, setLocalShowAddPaymentState] = useState(false)
  const [localEditingPaymentIdState, setLocalEditingPaymentIdState] = useState(null)
  const [localNewAddressState, setLocalNewAddressState] = useState({
    type: 'Home',
    name: user?.name || '',
    address: '',
    city: '',
    state: '',
    zip: '',
    isDefault: false,
    otherDetail: ''
  })
  const [localNewPaymentState, setLocalNewPaymentState] = useState({
    methodType: 'card',
    cardName: '',
    upiId: '',
    netBankingBank: '',
    walletProvider: ''
  })
  const [localRazorpayLoadedState, setLocalRazorpayLoadedState] = useState(false)
  const razorpayFormRef = useRef(null)
  const localPaymentFormRef = useRef(null)
  const [localEditingPaymentIdState2, setLocalEditingPaymentIdState2] = useState(null)
  const [localProfileFormState, setLocalProfileFormState] = useState({
    name: user?.name || '',
    email: user?.email || '',
    mobile: user?.mobile || ''
  })
  const [localShowChangePasswordState, setLocalShowChangePasswordState] = useState(false)
  const [localPasswordFormState, setLocalPasswordFormState] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [localShowCurrentPasswordState, setLocalShowCurrentPasswordState] = useState(false)
  const [localShowNewPasswordState, setLocalShowNewPasswordState] = useState(false)
  const [localShowConfirmPasswordState, setLocalShowConfirmPasswordState] = useState(false)
  const [localErrorState, setLocalErrorState] = useState('')
  const [localSuccessMessageState, setLocalSuccessMessageState] = useState('')
  const [localSearchOrderQueryState, setLocalSearchOrderQueryState] = useState('')
  const [localPreferencesState, setLocalPreferencesState] = useState({
    emailNotifications: true,
    smsNotifications: false,
    newsletter: false
  })
  const [localNewsletterStatusState, setLocalNewsletterStatusState] = useState({ subscribed: false, email: null })
  const [localLoadingPreferencesState, setLocalLoadingPreferencesState] = useState(false)
  const [localShowDeleteModalState, setLocalShowDeleteModalState] = useState(false)
  
  // Use props if available, otherwise use local state
  const currentAddresses = addresses.length > 0 ? addresses : localAddressesState
  const currentPaymentMethods = paymentMethods.length > 0 ? paymentMethods : localPaymentMethodsState
  const currentLoading = loading !== undefined ? loading : localLoadingState
  const currentShowAddAddress = showAddAddress !== undefined ? showAddAddress : localShowAddAddressState
  const currentEditingAddressId = editingAddressId !== undefined ? editingAddressId : localEditingAddressIdState
  const currentShowAddPayment = showAddPayment !== undefined ? showAddPayment : localShowAddPaymentState
  const currentEditingPaymentId = editingPaymentId !== undefined ? editingPaymentId : localEditingPaymentIdState2
  const currentNewAddress = newAddress ? newAddress : localNewAddressState
  const currentNewPayment = newPayment ? newPayment : localNewPaymentState
  const currentRazorpayLoaded = razorpayLoaded !== undefined ? razorpayLoaded : localRazorpayLoadedState
  const currentProfileForm = profileForm ? profileForm : localProfileFormState
  const currentShowChangePassword = showChangePassword !== undefined ? showChangePassword : localShowChangePasswordState
  const currentPasswordForm = passwordForm ? passwordForm : localPasswordFormState
  const currentShowCurrentPassword = showCurrentPassword !== undefined ? showCurrentPassword : localShowCurrentPasswordState
  const currentShowNewPassword = showNewPassword !== undefined ? showNewPassword : localShowNewPasswordState
  const currentShowConfirmPassword = showConfirmPassword !== undefined ? showConfirmPassword : localShowConfirmPasswordState
  const currentError = error !== undefined ? error : localErrorState
  const currentSuccessMessage = successMessage !== undefined ? successMessage : localSuccessMessageState
  const currentSearchOrderQuery = searchOrderQuery !== undefined ? searchOrderQuery : localSearchOrderQueryState
  const currentPreferences = preferences ? preferences : localPreferencesState
  const currentNewsletterStatus = newsletterStatus ? newsletterStatus : localNewsletterStatusState
  const currentLoadingPreferences = loadingPreferences !== undefined ? loadingPreferences : localLoadingPreferencesState
  const currentShowDeleteModal = showDeleteModal !== undefined ? showDeleteModal : localShowDeleteModalState

  // Load data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadOrdersFinal()
      loadAddressesFinal()
      loadPaymentMethodsFinal()
      loadPreferencesFinal()
      loadNewsletterStatusFinal()
    }
  }, [isAuthenticated])

  // Load Razorpay script
  useEffect(() => {
    const loadRazorpay = () => {
      if (window.Razorpay) {
        if (setRazorpayLoaded) {
          setRazorpayLoaded(true)
        } else {
          setLocalRazorpayLoadedState(true)
        }
        return
      }

      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.async = true
      script.onload = () => {
        if (setRazorpayLoaded) {
          setRazorpayLoaded(true)
        } else {
          setLocalRazorpayLoadedState(true)
        }
      }
      script.onerror = () => {
        console.error('Failed to load Razorpay script')
        showError('Failed to load payment gateway. Please refresh the page.')
      }
      document.body.appendChild(script)

      return () => {
        if (document.body.contains(script)) {
          document.body.removeChild(script)
        }
      }
    }

    if (showAddPayment) {
      loadRazorpay()
    }
  }, [showAddPayment])

  // Update profile form when user changes
  useEffect(() => {
    if (user) {
      if (setProfileForm) {
        setProfileForm({
          name: user.name || '',
          email: user.email || '',
          mobile: user.mobile || ''
        })
      } else {
        setLocalProfileFormState({
          name: user.name || '',
          email: user.email || '',
          mobile: user.mobile || ''
        })
      }
      if (setNewAddress) {
        setNewAddress(prev => ({ ...prev, name: user.name || '' }))
      } else {
        setLocalNewAddressState(prev => ({ ...prev, name: user.name || '' }))
      }
    }
  }, [user])

  // Handle tab from location state or props
  useEffect(() => {
    if (location.state?.tab) {
      const tab = location.state.tab
      if (setActiveTab) {
        setActiveTab(tab)
      } else {
        setLocalActiveTab(tab)
      }
    }
  }, [location.state, setActiveTab])

  // Sync activeTab with props
  useEffect(() => {
    if (activeTab && activeTab !== localActiveTab) {
      setLocalActiveTab(activeTab)
    }
  }, [activeTab])

  const loadOrdersLocal = async () => {
    try {
      if (setLoading) {
        setLoading(true)
      } else {
        setLocalLoadingState(true)
      }
      const response = await ordersAPI.getAll()
      const ordersList = Array.isArray(response) ? response : (response.orders || [])
      // Orders are managed by parent component, update local state for fallback
      setLocalOrders(ordersList)
    } catch (err) {
      console.error('Failed to load orders:', err)
      // Orders are managed by parent component, update local state for fallback
      setLocalOrders([])
    } finally {
      if (setLoading) {
        setLoading(false)
      } else {
        setLocalLoadingState(false)
      }
    }
  }

  const loadAddressesLocal = async () => {
    try {
      const response = await addressesAPI.getAll()
      const addressesList = Array.isArray(response) ? response : (response.addresses || [])
      if (setAddresses) {
        setAddresses(addressesList)
      } else {
        setLocalAddressesState(addressesList)
      }
      return addressesList
    } catch (err) {
      console.error('Failed to load addresses:', err)
      if (setAddresses) {
        setAddresses([])
      } else {
        setLocalAddressesState([])
      }
      throw err
    }
  }

  const loadPaymentMethodsLocal = async () => {
    try {
      const response = await paymentAPI.getAll()
      const methods = Array.isArray(response) ? response : (response.paymentMethods || [])
      if (setPaymentMethods) {
        setPaymentMethods(methods)
      } else {
        setLocalPaymentMethodsState(methods)
      }
    } catch (err) {
      console.error('Failed to load payment methods:', err)
      if (setPaymentMethods) {
        setPaymentMethods([])
      } else {
        setLocalPaymentMethodsState([])
      }
    }
  }

  const loadPreferencesLocal = async () => {
    try {
      if (setLoadingPreferences) {
        setLoadingPreferences(true)
      } else {
        setLocalLoadingPreferencesState(true)
      }
      const prefs = await authAPI.getPreferences()
      if (setPreferences) {
        setPreferences(prefs)
      } else {
        setLocalPreferencesState(prefs)
      }
    } catch (err) {
      console.error('Failed to load preferences:', err)
    } finally {
      if (setLoadingPreferences) {
        setLoadingPreferences(false)
      } else {
        setLocalLoadingPreferencesState(false)
      }
    }
  }

  const loadNewsletterStatusLocal = async () => {
    try {
      const status = await newsletterAPI.getStatus()
      if (setNewsletterStatus) {
        setNewsletterStatus(status)
      } else {
        setLocalNewsletterStatusState(status)
      }
      if (status.subscribed !== undefined) {
        if (setPreferences) {
          setPreferences(prev => ({ ...prev, newsletter: status.subscribed }))
        } else {
          setLocalPreferencesState(prev => ({ ...prev, newsletter: status.subscribed }))
        }
      }
    } catch (err) {
      console.error('Failed to load newsletter status:', err)
    }
  }

  // Wrapper functions - use props if available, otherwise use local
  const loadOrdersFinal = (typeof loadOrders !== 'undefined' && loadOrders) ? loadOrders : loadOrdersLocal
  const loadAddressesFinal = (typeof loadAddresses !== 'undefined' && loadAddresses) ? loadAddresses : loadAddressesLocal
  const loadPaymentMethodsFinal = (typeof loadPaymentMethods !== 'undefined' && loadPaymentMethods) ? loadPaymentMethods : loadPaymentMethodsLocal
  const loadPreferencesFinal = (typeof loadPreferences !== 'undefined' && loadPreferences) ? loadPreferences : loadPreferencesLocal
  const loadNewsletterStatusFinal = (typeof loadNewsletterStatus !== 'undefined' && loadNewsletterStatus) ? loadNewsletterStatus : loadNewsletterStatusLocal

  const handlePreferenceChangeLocal = async (key, value) => {
    try {
      const currentPrefs = preferences || localPreferencesState
      const updatedPreferences = { ...currentPrefs, [key]: value }
      if (setPreferences) {
        setPreferences(updatedPreferences)
      } else {
        setLocalPreferencesState(updatedPreferences)
      }
      
      if (key === 'newsletter') {
        if (value) {
          if (!user?.email) {
            showError('Please add an email address to your account first')
            if (setPreferences) {
              setPreferences(prev => ({ ...prev, newsletter: false }))
            } else {
              setLocalPreferencesState(prev => ({ ...prev, newsletter: false }))
            }
            return
          }
          await newsletterAPI.subscribeUser()
          await loadNewsletterStatusFinal()
          showSuccessToast('Subscribed to newsletter successfully')
        } else {
          await newsletterAPI.unsubscribeUser()
          await loadNewsletterStatusFinal()
          showSuccessToast('Unsubscribed from newsletter')
        }
      } else {
        await authAPI.updatePreferences({ [key]: value })
        showSuccessToast('Preferences updated successfully')
      }
    } catch (err) {
      console.error('Failed to update preference:', err)
      showError(err.response?.data?.message || 'Failed to update preference')
      if (setPreferences) {
        setPreferences(prev => ({ ...prev, [key]: !value }))
      } else {
        setLocalPreferencesState(prev => ({ ...prev, [key]: !value }))
      }
    }
  }

  const handleLogoutLocal = () => {
    logout()
    if (setActiveTab) {
      setActiveTab('login')
    } else {
      setLocalActiveTab('login')
    }
    navigate('/')
  }
  
  // Use prop handlers if provided, otherwise use local
  const handleLogoutFinal = handleLogout || handleLogoutLocal
  const handleUpdateProfileFinal = handleUpdateProfile || handleUpdateProfileLocal
  const handleChangePasswordFinal = handleChangePassword || handleChangePasswordLocal
  const handlePreferenceChangeFinal = handlePreferenceChange || handlePreferenceChangeLocal

  const handleUpdateProfileLocal = async (e) => {
    e.preventDefault()
    const currentError = error !== undefined ? setError : setLocalErrorState
    const currentSuccessMessage = successMessage !== undefined ? setSuccessMessage : setLocalSuccessMessageState
    if (currentError === setError) {
      setError('')
    } else {
      setLocalErrorState('')
    }
    if (currentSuccessMessage === setSuccessMessage) {
      setSuccessMessage('')
    } else {
      setLocalSuccessMessageState('')
    }
    
    try {
      const currentProfileForm = profileForm || localProfileFormState
      await updateProfile(currentProfileForm)
      showSuccessToast('Profile updated successfully!')
    } catch (err) {
      if (currentError === setError) {
        setError(err.message)
      } else {
        setLocalErrorState(err.message)
      }
      showError(err.message)
    }
  }

  const handleChangePasswordLocal = async (e) => {
    e.preventDefault()
    if (setError) {
      setError('')
    } else {
      setLocalErrorState('')
    }
    if (setSuccessMessage) {
      setSuccessMessage('')
    } else {
      setLocalSuccessMessageState('')
    }
    
    const currentPasswordForm = passwordForm || localPasswordFormState
    if (currentPasswordForm.newPassword !== currentPasswordForm.confirmPassword) {
      const errorMsg = 'New passwords do not match'
      if (setError) {
        setError(errorMsg)
      } else {
        setLocalErrorState(errorMsg)
      }
      showError(errorMsg)
      return
    }
    
    if (currentPasswordForm.newPassword.length < 8) {
      const errorMsg = 'Password must be at least 8 characters'
      if (setError) {
        setError(errorMsg)
      } else {
        setLocalErrorState(errorMsg)
      }
      showError(errorMsg)
      return
    }
    
    try {
      await changePassword(currentPasswordForm.currentPassword, currentPasswordForm.newPassword)
      showSuccessToast('Password changed successfully!')
      if (setShowChangePassword) {
        setShowChangePassword(false)
      } else {
        setLocalShowChangePasswordState(false)
      }
      const resetForm = {
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }
      if (setPasswordForm) {
        setPasswordForm(resetForm)
      } else {
        setLocalPasswordFormState(resetForm)
      }
    } catch (err) {
      if (setError) {
        setError(err.message)
      } else {
        setLocalErrorState(err.message)
      }
      showError(err.message)
    }
  }

  // Navigation tabs configuration
  const navTabs = [
    { id: 'orders', label: 'Orders', icon: Package },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'addresses', label: 'Addresses', icon: MapPin },
    { id: 'payment', label: 'Payment', icon: CreditCard },
    { id: 'track', label: 'Track', icon: Truck },
    { id: 'returns', label: 'Returns', icon: RotateCcw },
    { id: 'coins', label: 'Coins', icon: Coins },
    { id: 'settings', label: 'Settings', icon: Settings }
  ]

  if (!isAuthenticated) {
    return (
      <div className="dashboard-mobile-page">
        <div className="dashboard-mobile-header">
          <h1>My Account</h1>
        </div>
        <div className="dashboard-mobile-content">
          <div className="login-prompt-mobile">
            <div className="login-prompt-icon-mobile">
              <User size={64} />
            </div>
            <h2>Please Login to Continue</h2>
            <p>You need to be logged in to access your account dashboard.</p>
            <button 
              className="btn btn-primary btn-large"
              onClick={() => openModal('login')}
            >
              <LogIn size={20} />
              Login
            </button>
            <p className="login-prompt-hint-mobile">
              Don't have an account?{' '}
              <button 
                className="link-button"
                onClick={() => openModal('register')}
              >
                Create one here
              </button>
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-mobile-page">
      {/* Mobile Header */}
      <div className="dashboard-mobile-header">
        <h1>My Account</h1>
        <button className="logout-btn-mobile" onClick={handleLogoutFinal} title="Logout">
          <LogOut size={20} />
        </button>
      </div>

      {/* User Profile Header */}
      <div className="dashboard-mobile-profile-header">
        <div className="dashboard-mobile-user-avatar">
          <User size={28} />
        </div>
        <div className="dashboard-mobile-user-info">
          <h3 className="dashboard-mobile-user-name">{user?.name || 'User'}</h3>
          <p className="dashboard-mobile-user-email">{user?.email || user?.mobile || 'Account'}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-mobile-content">
        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="dashboard-section-mobile">
            <div className="section-header-mobile">
              <h2>Order History</h2>
            </div>
            {loading ? (
              <DashboardOrdersSkeleton />
            ) : orders.length === 0 ? (
              <div className="empty-state-mobile">
                <Package size={64} />
                <h3>No orders yet</h3>
                <p>Start shopping to see your orders here</p>
                <Link to="/products/women" className="btn btn-primary">
                  Start Shopping
                </Link>
              </div>
            ) : (
              <div className="orders-list-mobile">
                {orders.map(order => {
                  const orderId = order._id || order.id
                  return (
                    <div key={orderId} className="order-card-mobile">
                      <div className="order-card-header-mobile">
                        <div>
                          <h3>Order #{orderId.slice(-8).toUpperCase()}</h3>
                          <p className="order-date-mobile">
                            {new Date(order.createdAt || order.date).toLocaleDateString('en-IN', { 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </p>
                        </div>
                        <span className={`order-status-badge-mobile ${(order.status || 'Processing').toLowerCase()}`}>
                          {order.status || 'Processing'}
                        </span>
                      </div>
                      <div className="order-card-body-mobile">
                        <div className="order-info-row-mobile">
                          <span className="order-info-label">Items:</span>
                          <span className="order-info-value">{order.items?.length || 0}</span>
                        </div>
                        <div className="order-info-row-mobile">
                          <span className="order-info-label">Total:</span>
                          <span className="order-info-value">₹{(Number(order.total) || 0).toFixed(2)}</span>
                        </div>
                        <div className="order-info-row-mobile">
                          <span className="order-info-label">Payment:</span>
                          <span className="order-info-value">{order.payment?.method === 'cod' ? 'Cash on Delivery' : 'Online'}{order.payment?.status ? ` • ${order.payment.status}` : ''}</span>
                        </div>
                        {order.trackingNumber && (
                          <div className="order-info-row-mobile">
                            <span className="order-info-label">Tracking:</span>
                            <span className="order-info-value">{order.trackingNumber}</span>
                          </div>
                        )}
                      </div>
                      <div className="order-card-actions-mobile">
                        <Link to={`/order/${orderId}`} className="btn btn-outline btn-sm-mobile">
                          View Details
                        </Link>
                        <button 
                          className="btn btn-outline btn-sm-mobile"
                          onClick={async () => {
                            try {
                              await ordersAPI.downloadInvoice(orderId)
                              showSuccessToast('Invoice downloaded successfully')
                            } catch (err) {
                              console.error('Failed to download invoice:', err)
                              showError('Failed to download invoice')
                            }
                          }}
                        >
                          <Download size={16} />
                          Invoice
                        </button>
                        {order.trackingNumber && (
                          <Link to={`/track/${order.trackingNumber}`} className="btn btn-primary btn-sm-mobile">
                            Track
                          </Link>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="dashboard-section-mobile">
            <div className="section-header-mobile">
              <h2>Personal Information</h2>
            </div>
            
            {error && <div className="alert-mobile alert-error-mobile">{error}</div>}
            {successMessage && <div className="alert-mobile alert-success-mobile">{successMessage}</div>}
            
            <div className="profile-card-mobile">
              <div className="card-header-mobile">
                <h3>Account Details</h3>
              </div>
              <form onSubmit={handleUpdateProfileFinal} className="form-mobile">
                <div className="form-group-mobile">
                  <label>Full Name</label>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    required
                    placeholder="Enter your full name"
                  />
                </div>
                <div className="form-group-mobile">
                  <label>Mobile Number</label>
                  <input
                    type="tel"
                    value={profileForm.mobile}
                    disabled
                    className="disabled-input-mobile"
                  />
                  <small className="form-hint-mobile">Mobile number cannot be changed</small>
                </div>
                <div className="form-group-mobile">
                  <label>Email Address <span className="optional">(Optional)</span></label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    placeholder="your@email.com"
                  />
                </div>
                <button type="submit" className="btn btn-primary btn-full-mobile">
                  Save Changes
                </button>
              </form>
            </div>

            <div className="profile-card-mobile">
              <div className="card-header-mobile">
                <h3>Security</h3>
                <p className="card-description-mobile">Change your password to keep your account secure</p>
              </div>
              {!showChangePassword ? (
                <div className="password-section-closed-mobile">
                  <div className="password-info-mobile">
                    <Lock size={24} />
                    <div>
                      <p className="password-info-title-mobile">Password</p>
                      <p className="password-info-desc-mobile">Last updated: Recently</p>
                    </div>
                  </div>
                  <button 
                    type="button"
                    className="btn btn-outline"
                    onClick={() => setShowChangePassword(true)}
                  >
                    Change Password
                  </button>
                </div>
              ) : (
                <form onSubmit={handleChangePasswordFinal} className="form-mobile">
                  <div className="form-group-mobile">
                    <label>Current Password</label>
                    <div className="password-input-wrapper-mobile">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                        required
                        placeholder="Enter current password"
                      />
                      <button
                        type="button"
                        className="password-toggle-mobile"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>
                  <div className="form-group-mobile">
                    <label>New Password</label>
                    <div className="password-input-wrapper-mobile">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        required
                        placeholder="Enter new password (min. 8 characters)"
                        minLength="8"
                      />
                      <button
                        type="button"
                        className="password-toggle-mobile"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>
                  <div className="form-group-mobile">
                    <label>Confirm New Password</label>
                    <div className="password-input-wrapper-mobile">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                        required
                        placeholder="Confirm new password"
                        minLength="8"
                      />
                      <button
                        type="button"
                        className="password-toggle-mobile"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>
                  <div className="form-actions-mobile">
                    <button type="submit" className="btn btn-primary btn-full-mobile">
                      Update Password
                    </button>
                    <button 
                      type="button"
                      className="btn btn-outline btn-full-mobile"
                      onClick={() => {
                        setShowChangePassword(false)
                        setPasswordForm({
                          currentPassword: '',
                          newPassword: '',
                          confirmPassword: ''
                        })
                        setError('')
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Addresses Tab */}
        {activeTab === 'addresses' && (
          <div className="dashboard-section-mobile">
            <div className="section-header-mobile">
              <h2>Saved Addresses</h2>
            </div>
            {addresses && addresses.length > 0 ? (
              <div className="addresses-list-mobile">
                {addresses.map(address => {
                  const addressId = address._id || address.id
                  return (
                    <div key={addressId} className="address-card-mobile">
                      <div className="address-card-header-mobile">
                        <div>
                          <h3>
                            {address.type === 'Other' && address.otherDetail 
                              ? address.otherDetail 
                              : address.type || 'Home'}
                          </h3>
                          {address.isDefault && <span className="default-badge-mobile">Default</span>}
                        </div>
                        <div className="address-actions-mobile">
                          <button 
                            className="icon-btn-mobile"
                            onClick={() => {
                              setEditingAddressId(address._id || address.id)
                              setNewAddress({
                                type: address.type || 'Home',
                                name: address.name || '',
                                address: address.address || '',
                                city: address.city || '',
                                state: address.state || '',
                                zip: address.zip || address.zipCode || '',
                                isDefault: address.isDefault || false,
                                otherDetail: address.otherDetail || ''
                              })
                              setShowAddAddress(true)
                            }}
                            title="Edit"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            className="icon-btn-mobile"
                            onClick={async () => {
                              if (window.confirm('Delete this address?')) {
                                try {
                                  await addressesAPI.delete(address._id || address.id)
                                  await loadAddressesFinal()
                                  showSuccessToast('Address deleted')
                                } catch (err) {
                                  showError('Failed to delete address')
                                }
                              }
                            }}
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                      <div className="address-card-body-mobile">
                        <p className="address-name-mobile">{address.name}</p>
                        <p className="address-line-mobile">{address.address}</p>
                        <p className="address-line-mobile">{address.city}, {address.state} {address.zipCode || address.zip}</p>
                      </div>
                      {!address.isDefault && (
                        <div className="address-card-footer-mobile">
                          <button 
                            className="btn btn-primary btn-sm-mobile btn-full-mobile"
                            onClick={async () => {
                              try {
                                await addressesAPI.update(address._id || address.id, { isDefault: true })
                                await loadAddressesFinal()
                                showSuccessToast('Default address updated')
                              } catch (err) {
                                showError('Failed to update default address')
                              }
                            }}
                          >
                            Set as Default
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="empty-state-mobile">
                <MapPin size={64} />
                <h3>No saved addresses</h3>
                <p>Add an address to speed up checkout</p>
              </div>
            )}
            
            {!showAddAddress ? (
              <button 
                className="btn btn-primary btn-full-mobile btn-add-mobile" 
                onClick={() => {
                  setEditingAddressId(null)
                  setShowAddAddress(true)
                  setNewAddress({
                    type: 'Home',
                    name: user?.name || '',
                    address: '',
                    city: '',
                    state: '',
                    zip: '',
                    isDefault: false,
                    otherDetail: ''
                  })
                }}
              >
                <Plus size={20} />
                Add New Address
              </button>
            ) : (
              <div className="add-address-form-mobile">
                <div className="form-header-mobile">
                  <h3>{editingAddressId ? 'Edit Address' : 'Add New Address'}</h3>
                  <button
                    className="close-form-btn-mobile"
                    onClick={() => {
                      setShowAddAddress(false)
                      setEditingAddressId(null)
                      setNewAddress({
                        type: 'Home',
                        name: user?.name || '',
                        address: '',
                        city: '',
                        state: '',
                        zip: '',
                        isDefault: false,
                        otherDetail: ''
                      })
                      setError('')
                    }}
                  >
                    <X size={20} />
                  </button>
                </div>
                {error && <div className="alert-mobile alert-error-mobile">{error}</div>}
                {successMessage && <div className="alert-mobile alert-success-mobile">{successMessage}</div>}
                <form onSubmit={async (e) => {
                  e.preventDefault()
                  setError('')
                  setSuccessMessage('')
                  try {
                    if (!newAddress.name || !newAddress.address || !newAddress.city || !newAddress.state || !newAddress.zip) {
                      const errorMsg = 'Please fill in all required fields'
                      setError(errorMsg)
                      showError(errorMsg)
                      return
                    }

                    const addressData = {
                      type: newAddress.type || 'Home',
                      name: newAddress.name,
                      address: newAddress.address,
                      city: newAddress.city,
                      state: newAddress.state,
                      zip: newAddress.zip,
                      isDefault: addresses.length === 0 || newAddress.isDefault,
                      ...(newAddress.type === 'Other' && newAddress.otherDetail && { otherDetail: newAddress.otherDetail })
                    }

                    if (editingAddressId) {
                      await addressesAPI.update(editingAddressId, addressData)
                      await loadAddressesFinal()
                      showSuccessToast('Address updated successfully!')
                    } else {
                      await addressesAPI.add(addressData)
                      await loadAddressesFinal()
                      showSuccessToast('Address added successfully!')
                    }
                    
                    setShowAddAddress(false)
                    setEditingAddressId(null)
                    setNewAddress({
                      type: 'Home',
                      name: user?.name || '',
                      address: '',
                      city: '',
                      state: '',
                      zip: '',
                      isDefault: false,
                      otherDetail: ''
                    })
                    setError('')
                    setSuccessMessage('')
                  } catch (err) {
                    console.error('Failed to save address:', err)
                    const errorMsg = err.response?.data?.message || err.message || (editingAddressId ? 'Failed to update address' : 'Failed to add address')
                    setError(errorMsg)
                    showError(errorMsg)
                  }
                }}>
                  <div className="form-group-mobile">
                    <label>Address Type</label>
                    <select
                      value={newAddress.type}
                      onChange={(e) => setNewAddress({ ...newAddress, type: e.target.value, otherDetail: e.target.value !== 'Other' ? '' : newAddress.otherDetail })}
                      required
                    >
                      <option value="Home">Home</option>
                      <option value="Work">Work</option>
                      <option value="Other">Other</option>
                    </select>
                    {newAddress.type === 'Other' && (
                      <input
                        type="text"
                        placeholder="Specify address type"
                        value={newAddress.otherDetail}
                        onChange={(e) => setNewAddress({ ...newAddress, otherDetail: e.target.value })}
                        className="form-input-mobile"
                        style={{ marginTop: '0.75rem' }}
                      />
                    )}
                  </div>
                  <div className="form-group-mobile">
                    <label>Full Name</label>
                    <input
                      type="text"
                      value={newAddress.name}
                      onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group-mobile">
                    <label>Street Address</label>
                    <input
                      type="text"
                      value={newAddress.address}
                      onChange={(e) => setNewAddress({ ...newAddress, address: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group-mobile">
                    <label>City</label>
                    <input
                      type="text"
                      value={newAddress.city}
                      onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group-mobile">
                    <label>State</label>
                    <input
                      type="text"
                      value={newAddress.state}
                      onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group-mobile">
                    <label>ZIP Code</label>
                    <input
                      type="text"
                      value={newAddress.zip}
                      onChange={(e) => setNewAddress({ ...newAddress, zip: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group-mobile checkbox-group-mobile">
                    <label>
                      <input
                        type="checkbox"
                        checked={newAddress.isDefault}
                        onChange={(e) => setNewAddress({ ...newAddress, isDefault: e.target.checked })}
                      />
                      Set as default address
                    </label>
                  </div>
                  <div className="form-actions-mobile">
                    <button type="submit" className="btn btn-primary btn-full-mobile">
                      {editingAddressId ? 'Update Address' : 'Save Address'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline btn-full-mobile"
                      onClick={() => {
                        setShowAddAddress(false)
                        setEditingAddressId(null)
                        setNewAddress({
                          type: 'Home',
                          name: user?.name || '',
                          address: '',
                          city: '',
                          state: '',
                          zip: '',
                          isDefault: false,
                          otherDetail: ''
                        })
                        setError('')
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {activeTab === 'payment' && (
          <div className="dashboard-section-mobile">
            <div className="section-header-mobile">
              <h2>Payment Methods</h2>
            </div>
            {paymentMethods.length > 0 ? (
              <div className="payment-methods-list-mobile">
                {paymentMethods.map(method => {
                  const methodType = method.method || method.type || 'card'
                  const PaymentIcon = methodType === 'card' ? CreditCard : 
                                     methodType === 'upi' ? Smartphone :
                                     methodType === 'netbanking' ? Building2 : Wallet
                  
                  return (
                    <div key={method._id || method.id} className="payment-card-mobile">
                      <div className="payment-card-header-mobile">
                        <div className="payment-icon-wrapper-mobile">
                          <PaymentIcon size={24} />
                        </div>
                        <div className="payment-info-mobile">
                          {methodType === 'card' && (
                            <>
                              <p className="payment-title-mobile">•••• •••• •••• {method.last4 || '****'}</p>
                              <span className="payment-subtitle-mobile">{method.network || 'Card'} • Expires {method.expMonth || '**'}/{method.expYear || '**'}</span>
                              {method.cardName && <span className="payment-detail-mobile">{method.cardName}</span>}
                            </>
                          )}
                          {methodType === 'upi' && (
                            <>
                              <p className="payment-title-mobile">UPI</p>
                              <span className="payment-subtitle-mobile">{method.upiId || 'UPI Payment Method'}</span>
                            </>
                          )}
                          {methodType === 'netbanking' && (
                            <>
                              <p className="payment-title-mobile">Net Banking</p>
                              <span className="payment-subtitle-mobile">{method.bank || 'Bank Account'}</span>
                            </>
                          )}
                          {methodType === 'wallet' && (
                            <>
                              <p className="payment-title-mobile">Digital Wallet</p>
                              <span className="payment-subtitle-mobile">{method.walletProvider || 'Wallet'}</span>
                            </>
                          )}
                        </div>
                        <div className="payment-actions-mobile">
                          <button 
                            className="icon-btn-mobile"
                            onClick={() => {
                              const paymentId = method._id || method.id
                              setEditingPaymentId(paymentId)
                              setNewPayment({
                                methodType: methodType,
                                cardName: method.cardName || '',
                                upiId: method.upiId || '',
                                netBankingBank: method.bank || '',
                                walletProvider: method.walletProvider || ''
                              })
                              setShowAddPayment(true)
                            }}
                            title="Edit"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            className="icon-btn-mobile"
                            onClick={async () => {
                              if (window.confirm('Delete this payment method?')) {
                                try {
                                  await paymentAPI.delete(method._id || method.id)
                                  loadPaymentMethodsFinal()
                                  showSuccessToast('Payment method deleted')
                                } catch (err) {
                                  showError('Failed to delete payment method')
                                }
                              }
                            }}
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="empty-state-mobile">
                <CreditCard size={64} />
                <h3>No payment methods</h3>
                <p>Add a payment method for faster checkout</p>
              </div>
            )}
            
            {!showAddPayment ? (
              <button 
                className="btn btn-primary btn-full-mobile btn-add-mobile" 
                onClick={() => {
                  setEditingPaymentId(null)
                  setShowAddPayment(true)
                  setNewPayment({
                    methodType: 'card',
                    cardName: '',
                    upiId: '',
                    netBankingBank: '',
                    walletProvider: ''
                  })
                }}
              >
                <Plus size={20} />
                Add New Payment Method
              </button>
            ) : (
              <div className="add-payment-form-mobile" ref={paymentFormRef}>
                <div className="form-header-mobile">
                  <h3>{editingPaymentId ? 'Edit Payment Method' : 'Add New Payment Method'}</h3>
                  <button
                    className="close-form-btn-mobile"
                    onClick={() => {
                      setShowAddPayment(false)
                      setEditingPaymentId(null)
                      setNewPayment({ methodType: 'card', cardName: '', upiId: '', netBankingBank: '', walletProvider: '' })
                      setError('')
                    }}
                  >
                    <X size={20} />
                  </button>
                </div>
                {error && <div className="alert-mobile alert-error-mobile">{error}</div>}
                {successMessage && <div className="alert-mobile alert-success-mobile">{successMessage}</div>}
                
                <form onSubmit={async (e) => {
                  e.preventDefault()
                  setError('')
                  setSuccessMessage('')
                  
                  try {
                    let paymentData = {}

                    if (newPayment.methodType === 'card') {
                      if (!newPayment.cardName) {
                        setError('Please enter cardholder name')
                        return
                      }

                      if (editingPaymentId) {
                        paymentData = {
                          method: 'card',
                          cardName: newPayment.cardName
                        }
                        
                        await paymentAPI.update(editingPaymentId, paymentData)
                        await loadPaymentMethodsFinal()
                        showSuccessToast('Payment method updated successfully!')
                        setShowAddPayment(false)
                        setEditingPaymentId(null)
                        setNewPayment({ methodType: 'card', cardName: '', upiId: '', netBankingBank: '', walletProvider: '' })
                        setError('')
                        setSuccessMessage('')
                        return
                      }

                      if (!razorpayLoaded) {
                        setError('Payment gateway is loading. Please wait...')
                        return
                      }

                      const options = {
                        key: import.meta.env.VITE_RAZORPAY_KEY_ID || '',
                        amount: 100,
                        currency: 'INR',
                        name: 'Arudhra Fashions',
                        description: 'Save Payment Method',
                        prefill: {
                          name: newPayment.cardName,
                          email: user?.email || '',
                          contact: user?.mobile || ''
                        },
                        handler: async function(response) {
                          try {
                            paymentData = {
                              razorpayPaymentId: response.razorpay_payment_id,
                              razorpayOrderId: response.razorpay_order_id,
                              razorpaySignature: response.razorpay_signature,
                              cardName: newPayment.cardName,
                              method: 'card'
                            }
                            
                            await paymentAPI.add(paymentData)
                            await loadPaymentMethodsFinal()
                            showSuccessToast('Payment method saved successfully!')
                            setShowAddPayment(false)
                            setEditingPaymentId(null)
                            setNewPayment({ methodType: 'card', cardName: '', upiId: '', netBankingBank: '', walletProvider: '' })
                            setError('')
                            setSuccessMessage('')
                          } catch (err) {
                            console.error('Failed to save payment method:', err)
                            const errorMsg = err.response?.data?.message || err.message || 'Failed to save payment method'
                            setError(errorMsg)
                            showError(errorMsg)
                          }
                        },
                        modal: {
                          ondismiss: function() {
                            console.log('Payment method collection cancelled')
                          }
                        },
                        theme: {
                          color: '#7A5051'
                        }
                      }

                      const orderResponse = await paymentAPI.createRazorpayOrder({
                        amount: 100,
                        currency: 'INR',
                        receipt: `pm_${Date.now()}`
                      })
                      
                      if (!orderResponse.orderId) {
                        throw new Error('Failed to create payment order')
                      }
                      
                      options.order_id = orderResponse.orderId
                      
                      const razorpay = new window.Razorpay(options)
                      razorpay.on('payment.failed', function(response) {
                        setError(response.error.description || 'Payment failed. Please try again.')
                        showError(response.error.description || 'Payment failed. Please try again.')
                      })
                      razorpay.open()
                    } else {
                      if (newPayment.methodType === 'upi' && !newPayment.upiId) {
                        setError('Please enter UPI ID')
                        return
                      }
                      if (newPayment.methodType === 'netbanking' && !newPayment.netBankingBank) {
                        setError('Please select a bank')
                        return
                      }
                      if (newPayment.methodType === 'wallet' && !newPayment.walletProvider) {
                        setError('Please select a wallet provider')
                        return
                      }

                      paymentData = {
                        method: newPayment.methodType,
                        ...(newPayment.methodType === 'upi' && { upiId: newPayment.upiId }),
                        ...(newPayment.methodType === 'netbanking' && { bank: newPayment.netBankingBank }),
                        ...(newPayment.methodType === 'wallet' && { walletProvider: newPayment.walletProvider })
                      }

                      if (editingPaymentId) {
                        await paymentAPI.update(editingPaymentId, paymentData)
                        showSuccessToast('Payment method updated successfully!')
                      } else {
                        await paymentAPI.add(paymentData)
                        showSuccessToast('Payment method saved successfully!')
                      }
                      
                            await loadPaymentMethodsFinal()
                      setShowAddPayment(false)
                      setEditingPaymentId(null)
                      setNewPayment({ methodType: 'card', cardName: '', upiId: '', netBankingBank: '', walletProvider: '' })
                      setError('')
                      setSuccessMessage('')
                    }
                  } catch (err) {
                    console.error('Failed to add payment method:', err)
                    const errorMsg = err.response?.data?.message || err.message || 'Failed to add payment method'
                    setError(errorMsg)
                    showError(errorMsg)
                  }
                }}>
                  <div className="form-group-mobile">
                    <label>Payment Method Type</label>
                    <select
                      value={newPayment.methodType}
                      onChange={(e) => setNewPayment({ ...newPayment, methodType: e.target.value })}
                      required
                    >
                      <option value="card">Credit/Debit Card</option>
                      <option value="upi">UPI</option>
                      <option value="netbanking">Net Banking</option>
                      <option value="wallet">Digital Wallet</option>
                    </select>
                  </div>

                  {newPayment.methodType === 'card' && (
                    <>
                      <div className="razorpay-info-mobile">
                        <Shield size={20} />
                        <p>Your card details are securely processed by Razorpay. We never store your full card details.</p>
                      </div>
                      {!razorpayLoaded && (
                        <div className="loading-payment-mobile">
                          <p>Loading secure payment form...</p>
                        </div>
                      )}
                      <div className="form-group-mobile">
                        <label>Cardholder Name</label>
                        <input
                          type="text"
                          value={newPayment.cardName}
                          onChange={(e) => setNewPayment({ ...newPayment, cardName: e.target.value })}
                          required
                          placeholder="John Doe"
                        />
                      </div>
                    </>
                  )}

                  {newPayment.methodType === 'upi' && (
                    <div className="form-group-mobile">
                      <label>UPI ID</label>
                      <input
                        type="text"
                        value={newPayment.upiId}
                        onChange={(e) => setNewPayment({ ...newPayment, upiId: e.target.value })}
                        required
                        placeholder="yourname@upi"
                        pattern="[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}"
                      />
                      <small className="form-hint-mobile">Enter your UPI ID (e.g., yourname@paytm, yourname@ybl)</small>
                    </div>
                  )}

                  {newPayment.methodType === 'netbanking' && (
                    <div className="form-group-mobile">
                      <label>Select Bank</label>
                      <select
                        value={newPayment.netBankingBank}
                        onChange={(e) => setNewPayment({ ...newPayment, netBankingBank: e.target.value })}
                        required
                      >
                        <option value="">Select your bank</option>
                        <option value="HDFC">HDFC Bank</option>
                        <option value="ICICI">ICICI Bank</option>
                        <option value="SBI">State Bank of India</option>
                        <option value="AXIS">Axis Bank</option>
                        <option value="KOTAK">Kotak Mahindra Bank</option>
                        <option value="PNB">Punjab National Bank</option>
                        <option value="BOI">Bank of India</option>
                        <option value="BOB">Bank of Baroda</option>
                        <option value="CANARA">Canara Bank</option>
                        <option value="UNION">Union Bank of India</option>
                        <option value="IDBI">IDBI Bank</option>
                        <option value="YES">Yes Bank</option>
                        <option value="INDUS">IndusInd Bank</option>
                        <option value="FEDERAL">Federal Bank</option>
                        <option value="OTHER">Other Bank</option>
                      </select>
                    </div>
                  )}

                  {newPayment.methodType === 'wallet' && (
                    <div className="form-group-mobile">
                      <label>Select Wallet Provider</label>
                      <select
                        value={newPayment.walletProvider}
                        onChange={(e) => setNewPayment({ ...newPayment, walletProvider: e.target.value })}
                        required
                      >
                        <option value="">Select wallet</option>
                        <option value="Paytm">Paytm</option>
                        <option value="PhonePe">PhonePe</option>
                        <option value="Amazon Pay">Amazon Pay</option>
                        <option value="FreeCharge">FreeCharge</option>
                        <option value="MobiKwik">MobiKwik</option>
                        <option value="Airtel Money">Airtel Money</option>
                        <option value="JioMoney">JioMoney</option>
                      </select>
                    </div>
                  )}

                  <div className="form-actions-mobile">
                    <button 
                      type="submit" 
                      className="btn btn-primary btn-full-mobile" 
                      disabled={newPayment.methodType === 'card' && !razorpayLoaded && !editingPaymentId}
                    >
                      {editingPaymentId ? (
                        'Update Payment Method'
                      ) : newPayment.methodType === 'card' ? (
                        <>
                          <Shield size={18} />
                          Save Payment Method Securely
                        </>
                      ) : (
                        'Save Payment Method'
                      )}
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline btn-full-mobile"
                      onClick={() => {
                        setShowAddPayment(false)
                        setEditingPaymentId(null)
                        setNewPayment({ methodType: 'card', cardName: '', upiId: '', netBankingBank: '', walletProvider: '' })
                        setError('')
                        setSuccessMessage('')
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* Track Order Tab */}
        {activeTab === 'track' && (
          <div className="dashboard-section-mobile">
            <div className="section-header-mobile">
              <h2>Track Your Orders</h2>
            </div>
            
            <div className="track-order-search-mobile">
              <div className="search-input-wrapper-mobile">
                <Search size={20} className="search-icon-mobile" />
                <input
                  type="text"
                  value={searchOrderQuery}
                  onChange={(e) => setSearchOrderQuery(e.target.value)}
                  placeholder="Search by Order ID or Tracking Number..."
                  className="track-input-mobile"
                />
                {searchOrderQuery && (
                  <button
                    type="button"
                    className="clear-search-mobile"
                    onClick={() => setSearchOrderQuery('')}
                    aria-label="Clear search"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            </div>

            <div className="track-orders-container-mobile">
              {(() => {
                const isDeliveredMoreThan3DaysAgo = (order) => {
                  if (order.status?.toLowerCase() !== 'delivered') return false
                  
                  if (order.statusHistory && Array.isArray(order.statusHistory)) {
                    const deliveredEntry = order.statusHistory.find(
                      entry => entry.status?.toLowerCase() === 'delivered'
                    )
                    if (deliveredEntry && deliveredEntry.date) {
                      const deliveredDate = new Date(deliveredEntry.date)
                      const threeDaysAgo = new Date()
                      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
                      return deliveredDate < threeDaysAgo
                    }
                  }
                  
                  if (order.updatedAt) {
                    const updatedDate = new Date(order.updatedAt)
                    const threeDaysAgo = new Date()
                    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
                    return updatedDate < threeDaysAgo
                  }
                  
                  return false
                }

                const trackableOrders = orders.filter(order => {
                  if (isDeliveredMoreThan3DaysAgo(order)) {
                    return false
                  }
                  return true
                })

                const filteredOrders = trackableOrders.filter(order => {
                  if (!searchOrderQuery.trim()) return true
                  const query = searchOrderQuery.toLowerCase()
                  const orderId = (order._id || order.id || '').toString().toLowerCase()
                  const orderDate = new Date(order.createdAt || order.date).toLocaleDateString().toLowerCase()
                  return (
                    orderId.includes(query) ||
                    order.trackingNumber?.toLowerCase().includes(query) ||
                    order.tracking?.toLowerCase().includes(query) ||
                    (order.status || '').toLowerCase().includes(query) ||
                    orderDate.includes(query)
                  )
                })

                if (filteredOrders.length === 0) {
                  return (
                    <div className="empty-state-mobile">
                      <Truck size={64} />
                      <h3>{searchOrderQuery ? 'No orders found' : 'No orders to track'}</h3>
                      <p>{searchOrderQuery ? 'Try a different search term' : 'All your orders have been delivered or there are no orders yet'}</p>
                      {!searchOrderQuery && (
                        <Link to="/products/women" className="btn btn-primary">
                          Start Shopping
                        </Link>
                      )}
                    </div>
                  )
                }

                return (
                  <div className="track-orders-list-mobile">
                    {filteredOrders.map(order => {
                      const orderId = order._id || order.id
                      return (
                        <div key={orderId} className="track-order-card-mobile">
                          <div className="track-order-header-mobile">
                            <div>
                              <h3>Order #{orderId.slice(-8).toUpperCase()}</h3>
                              {order.trackingNumber || order.tracking ? (
                                <p className="tracking-info-mobile">
                                  <strong>Tracking:</strong> {order.trackingNumber || order.tracking}
                                </p>
                              ) : null}
                            </div>
                            <span className={`order-status-badge-mobile ${(order.status || 'Processing').toLowerCase()}`}>
                              {order.status || 'Processing'}
                            </span>
                          </div>

                          <div className="status-timeline-mobile">
                            {[
                              { label: 'Placed', status: 'completed' },
                              { label: 'Processing', status: (order.status?.toLowerCase() === 'processing' || order.status?.toLowerCase() === 'shipped' || order.status?.toLowerCase() === 'delivered') ? 'completed' : 'pending' },
                              { label: 'Shipped', status: (order.status?.toLowerCase() === 'shipped' || order.status?.toLowerCase() === 'delivered') ? 'completed' : 'pending' },
                              { label: 'Delivered', status: order.status?.toLowerCase() === 'delivered' ? 'completed' : 'pending' }
                            ].map((step, index) => (
                              <div key={index} className={`timeline-step-mobile ${step.status}`}>
                                <div className="timeline-marker-mobile">
                                  {step.status === 'completed' ? (
                                    <CheckCircle size={18} />
                                  ) : (
                                    <div className="timeline-dot-mobile"></div>
                                  )}
                                </div>
                                <span className="timeline-label-mobile">{step.label}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })()}
            </div>
          </div>
        )}

        {/* Returns & Exchanges Tab */}
        {(activeTab || localActiveTab) === 'returns' && (
          <div className="dashboard-section-mobile">
            <div className="section-header-mobile">
              <h2>Returns & Exchanges</h2>
            </div>

            {/* My Returns Section */}
            {(returns || localReturns).length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ marginBottom: '0.75rem', fontSize: '1.1rem' }}>My Return Requests</h3>
                <div className="orders-list-mobile">
                  {(returns || localReturns).map(ret => (
                    <div key={ret.id} className="order-card-mobile">
                      <div className="order-card-header-mobile">
                        <div>
                          <h3>{ret.returnId}</h3>
                          <p className="order-date-mobile">
                            {new Date(ret.requestedAt || ret.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`order-status-badge-mobile ${ret.status}`}>
                          {ret.status}
                        </span>
                      </div>
                      <div className="order-card-body-mobile">
                        <div className="order-info-row-mobile">
                          <span className="order-info-label">Order ID:</span>
                          <span className="order-info-value">{ret.orderId}</span>
                        </div>
                        <div className="order-info-row-mobile">
                          <span className="order-info-label">Product:</span>
                          <span className="order-info-value">{ret.productName}</span>
                        </div>
                        <div className="order-info-row-mobile">
                          <span className="order-info-label">Reason:</span>
                          <span className="order-info-value">{ret.reason}</span>
                        </div>
                        <div className="order-info-row-mobile">
                          <span className="order-info-label">Amount:</span>
                          <span className="order-info-value">₹{parseFloat(ret.amount).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {(loading || localLoading) ? (
              <DashboardOrdersSkeleton />
            ) : (orders || localOrders).length === 0 ? (
              <div className="empty-state-mobile">
                <RotateCcw size={64} />
                <h3>No orders yet</h3>
                <p>Start shopping to see your orders here</p>
                <Link to="/products/women" className="btn btn-primary">
                  Start Shopping
                </Link>
              </div>
            ) : (
              <div className="orders-list-mobile">
                {(orders || localOrders).filter(order => order.status !== 'Cancelled').map(order => {
                  const orderId = order._id || order.id
                  return (
                    <div key={orderId} className="order-card-mobile">
                      <div className="order-card-header-mobile">
                        <div>
                          <h3>Order #{orderId.slice(-8).toUpperCase()}</h3>
                          <p className="order-date-mobile">
                            {new Date(order.createdAt || order.date).toLocaleDateString('en-IN', { 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </p>
                        </div>
                        <span className={`order-status-badge-mobile ${(order.status || 'Processing').toLowerCase()}`}>
                          {order.status || 'Processing'}
                        </span>
                      </div>
                      <div className="order-card-body-mobile">
                        <div className="order-info-row-mobile">
                          <span className="order-info-label">Items:</span>
                          <span className="order-info-value">{order.items?.length || 0}</span>
                        </div>
                        <div className="order-info-row-mobile">
                          <span className="order-info-label">Total:</span>
                          <span className="order-info-value">₹{(Number(order.total) || 0).toFixed(2)}</span>
                        </div>
                        {order.items?.slice(0, 2).map((item, idx) => (
                          <div key={idx} className="order-info-row-mobile">
                            <span className="order-info-label">{item.name}:</span>
                            <span className="order-info-value">{item.quantity}x</span>
                          </div>
                        ))}
                        {order.items?.length > 2 && (
                          <div className="order-info-row-mobile">
                            <span className="order-info-label">+{order.items.length - 2} more:</span>
                          </div>
                        )}
                      </div>
                      <div className="order-card-actions-mobile">
                        <Link to={`/order/${orderId}`} className="btn btn-outline btn-sm-mobile">
                          View Details
                        </Link>
                        <button 
                          onClick={() => {
                            if (handleOrderSelectForReturn) {
                              handleOrderSelectForReturn(order)
                            } else {
                              setLocalSelectedOrderForReturn(order)
                              setLocalShowReturnForm(true)
                            }
                          }}
                          className="btn btn-primary btn-sm-mobile"
                        >
                          Request Return
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Return Form Modal */}
            {(showReturnForm || localShowReturnForm) && (selectedOrderForReturn || localSelectedOrderForReturn) && (
              <div className="modal-overlay" onClick={() => {
                if (setShowReturnForm) {
                  setShowReturnForm(false)
                } else {
                  setLocalShowReturnForm(false)
                }
              }}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <h2>Request Return</h2>
                    <button className="modal-close" onClick={() => {
                      if (setShowReturnForm) {
                        setShowReturnForm(false)
                      } else {
                        setLocalShowReturnForm(false)
                      }
                    }}>
                      ×
                    </button>
                  </div>
                  <form onSubmit={(e) => {
                    if (handleSubmitReturn) {
                      handleSubmitReturn(e)
                    } else {
                      e.preventDefault()
                      const currentReturnForm = returnForm || localReturnForm
                      const currentSelectedOrder = selectedOrderForReturn || localSelectedOrderForReturn
                      if (!currentReturnForm.orderId || !currentReturnForm.productId || !currentReturnForm.reason || !currentReturnForm.amount) {
                        showError('Please fill in all required fields')
                        return
                      }
                      returnsAPI.create(currentReturnForm)
                        .then(() => {
                          showSuccessToast('Return request submitted successfully')
                          setLocalShowReturnForm(false)
                          setLocalReturnForm({ orderId: '', productId: '', productName: '', reason: '', amount: '' })
                          setLocalSelectedOrderForReturn(null)
                          loadOrdersFinal()
                        })
                        .catch((err) => {
                          console.error('Failed to submit return:', err)
                          showError('Failed to submit return request')
                        })
                    }
                  }} className="modal-body">
                    <div className="form-group">
                      <label>Select Product *</label>
                      <select
                        value={(returnForm || localReturnForm).productId}
                        onChange={(e) => {
                          const currentSelectedOrder = selectedOrderForReturn || localSelectedOrderForReturn
                          const item = currentSelectedOrder.items?.find(i => 
                            (i.product || i.productId) === e.target.value
                          )
                          if (item) {
                            if (handleProductSelectForReturn) {
                              handleProductSelectForReturn(item)
                            } else {
                              setLocalReturnForm(prev => ({
                                ...prev,
                                orderId: currentSelectedOrder.orderId || currentSelectedOrder._id || currentSelectedOrder.id,
                                productId: item.product || item.productId,
                                productName: item.name,
                                amount: item.price * item.quantity
                              }))
                            }
                          }
                        }}
                        required
                      >
                        <option value="">Select a product</option>
                        {(selectedOrderForReturn || localSelectedOrderForReturn).items?.map((item, idx) => (
                          <option key={idx} value={item.product || item.productId}>
                            {item.name} - ₹{parseFloat(item.price * item.quantity).toLocaleString()}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Reason for Return *</label>
                      <select
                        value={(returnForm || localReturnForm).reason}
                        onChange={(e) => {
                          if (setReturnForm) {
                            setReturnForm(prev => ({ ...prev, reason: e.target.value }))
                          } else {
                            setLocalReturnForm(prev => ({ ...prev, reason: e.target.value }))
                          }
                        }}
                        required
                      >
                        <option value="">Select reason</option>
                        <option value="Size not fitting">Size not fitting</option>
                        <option value="Changed mind">Changed mind</option>
                        <option value="Defective item">Defective item</option>
                        <option value="Wrong item received">Wrong item received</option>
                        <option value="Quality issues">Quality issues</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Refund Amount</label>
                      <input
                        type="text"
                        value={`₹${parseFloat((returnForm || localReturnForm).amount || 0).toLocaleString()}`}
                        disabled
                      />
                    </div>
                    <div className="modal-footer">
                      <button type="button" className="btn btn-outline" onClick={() => {
                        if (setShowReturnForm) {
                          setShowReturnForm(false)
                        } else {
                          setLocalShowReturnForm(false)
                        }
                      }}>
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-primary">
                        Submit Return Request
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Coins Tab */}
        {activeTab === 'coins' && (
          <CoinsTab user={user} showSuccessToast={showSuccessToast} showError={showError} />
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="dashboard-section-mobile">
            <div className="section-header-mobile">
              <h2>Account Settings</h2>
            </div>
            {loadingPreferences ? (
              <PreferencesSkeleton />
            ) : (
              <>
                <div className="settings-list-mobile">
                  <div className="setting-item-mobile">
                    <div className="setting-icon-wrapper-mobile">
                      <Mail size={24} />
                    </div>
                    <div className="setting-content-mobile">
                      <h3>Email Notifications</h3>
                      <p>Receive emails about your orders and promotions</p>
                    </div>
                    <label className="toggle-mobile">
                      <input 
                        type="checkbox" 
                        checked={preferences.emailNotifications || false}
                        onChange={(e) => handlePreferenceChangeFinal('emailNotifications', e.target.checked)}
                        disabled={loadingPreferences}
                      />
                      <span></span>
                    </label>
                  </div>
                  <div className="setting-item-mobile">
                    <div className="setting-icon-wrapper-mobile">
                      <Mail size={24} />
                    </div>
                    <div className="setting-content-mobile">
                      <h3>Newsletter</h3>
                      <p>
                        {newsletterStatus.email 
                          ? `Subscribe to our newsletter (${newsletterStatus.email})`
                          : 'Subscribe to our newsletter for updates and offers'
                        }
                        {!user?.email && (
                          <span className="setting-hint-mobile">Add an email address to your profile to subscribe</span>
                        )}
                      </p>
                    </div>
                    <label className="toggle-mobile">
                      <input 
                        type="checkbox" 
                        checked={preferences.newsletter || false}
                        onChange={(e) => handlePreferenceChangeFinal('newsletter', e.target.checked)}
                        disabled={loadingPreferences || !user?.email}
                      />
                      <span></span>
                    </label>
                  </div>
                </div>
                <div className="danger-zone-mobile">
                  <div className="danger-zone-header-mobile">
                    <AlertTriangle size={24} />
                    <h3>Danger Zone</h3>
                  </div>
                  <p className="danger-zone-description-mobile">
                    Once you delete your account, there is no going back. Please be certain.
                  </p>
                  <button 
                    className="btn btn-danger btn-full-mobile"
                    onClick={() => setShowDeleteModal(true)}
                  >
                    Delete Account
                  </button>
                </div>
                <ConfirmationModal
                  isOpen={showDeleteModal}
                  onClose={() => setShowDeleteModal(false)}
                  onConfirm={() => {
                    showError('Account deletion is not available in demo mode')
                    setShowDeleteModal(false)
                  }}
                  title="Delete Account"
                  message="Are you sure you want to delete your account? This action cannot be undone. All your data, orders, and preferences will be permanently deleted."
                  confirmText="Delete Account"
                  cancelText="Cancel"
                  type="danger"
                />
              </>
            )}
          </div>
        )}
      </div>

      {/* Bottom Navigation Bar */}
      <div className="dashboard-bottom-nav-mobile">
        {navTabs.map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              className={`nav-tab-mobile ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={22} />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default DashboardMobile
