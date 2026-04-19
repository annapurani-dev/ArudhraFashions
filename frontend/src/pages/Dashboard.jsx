import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useDevice } from '../hooks/useDevice'
import DashboardMobile from './Dashboard.mobile'
import DashboardWeb from './Dashboard.web'
import { ordersAPI, addressesAPI, paymentAPI, authAPI, newsletterAPI, returnsAPI, coinsAPI } from '../utils/api'
import { useAuth } from '../context/AuthContext'
import { useLoginModal } from '../context/LoginModalContext'
import { useToast } from '../components/Toast/ToastContainer'

function Dashboard() {
  const isMobile = useDevice()
  const location = useLocation()
  const { user, logout, isAuthenticated, updateProfile, changePassword } = useAuth()
  const { openModal } = useLoginModal()
  const { success: showSuccessToast, error: showError } = useToast()
  const [activeTab, setActiveTab] = useState('orders')
  const [orders, setOrders] = useState([])
  const [addresses, setAddresses] = useState([])
  const [loading, setLoading] = useState(false)
  const [showAddAddress, setShowAddAddress] = useState(false)
  const [editingAddressId, setEditingAddressId] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [newAddress, setNewAddress] = useState({
    type: 'Home',
    name: user?.name || '',
    address: '',
    city: '',
    state: '',
    zip: '',
    isDefault: false,
    otherDetail: ''
  })
  const [paymentMethods, setPaymentMethods] = useState([])
  const [showAddPayment, setShowAddPayment] = useState(false)
  const [newPayment, setNewPayment] = useState({
    methodType: 'card',
    cardName: '',
    upiId: '',
    netBankingBank: '',
    walletProvider: ''
  })
  const [razorpayLoaded, setRazorpayLoaded] = useState(false)
  const paymentFormRef = useRef(null)
  const [editingPaymentId, setEditingPaymentId] = useState(null)
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    mobile: user?.mobile || ''
  })
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [searchOrderQuery, setSearchOrderQuery] = useState('')
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    smsNotifications: false,
    newsletter: false
  })
  const [newsletterStatus, setNewsletterStatus] = useState({ subscribed: false, email: null })
  const [loadingPreferences, setLoadingPreferences] = useState(false)
  const [showReturnForm, setShowReturnForm] = useState(false)
  const [selectedOrderForReturn, setSelectedOrderForReturn] = useState(null)
  const [returnForm, setReturnForm] = useState({
    orderId: '',
    productId: '',
    productName: '',
    reason: '',
    amount: ''
  })
  const [returns, setReturns] = useState([])

  // Handle tab from location state
  useEffect(() => {
    if (location.state?.tab) {
      setActiveTab(location.state.tab)
      // Clear the state to prevent reopening on refresh
      window.history.replaceState({}, document.title)
    }
  }, [location.state])

  // Load data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadOrders()
      loadAddresses()
      loadPaymentMethods()
      loadPreferences()
      loadNewsletterStatus()
      loadReturns()
    }
  }, [isAuthenticated])

  // Live refresh user orders when Orders tab is active. Poll every 10s; pause when tab hidden.
  useEffect(() => {
    let intervalId = null

    const startPolling = () => {
      if (intervalId) return
      intervalId = setInterval(() => {
        loadOrders()
      }, 10000)
    }
    const stopPolling = () => {
      if (intervalId) {
        clearInterval(intervalId)
        intervalId = null
      }
    }
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && activeTab === 'orders') startPolling()
      else stopPolling()
    }

    if (isAuthenticated && activeTab === 'orders' && document.visibilityState === 'visible') {
      startPolling()
    }
    document.addEventListener('visibilitychange', handleVisibility)

    // Re-evaluate when activeTab or isAuthenticated changes
    return () => {
      stopPolling()
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [activeTab, isAuthenticated])

  const loadReturns = async () => {
    try {
      if (isAuthenticated) {
        const returnsData = await returnsAPI.getAll()
        setReturns(Array.isArray(returnsData) ? returnsData : [])
      }
    } catch (err) {
      console.error('Failed to load returns:', err)
    }
  }

  // Helper function to check if order can be returned (within 24 hours of delivery)
  const canReturnOrder = (order) => {
    if (order.status !== 'Delivered') {
      return { canReturn: false, message: 'Return requests can only be made for delivered orders' }
    }

    // Find when order was marked as "Delivered" from statusHistory
    let deliveredDate = null
    if (order.statusHistory && Array.isArray(order.statusHistory)) {
      const deliveredStatus = order.statusHistory.find(
        entry => entry.status === 'Delivered'
      )
      if (deliveredStatus && deliveredStatus.date) {
        deliveredDate = new Date(deliveredStatus.date)
      }
    }

    // If not found in statusHistory, use updatedAt as fallback
    if (!deliveredDate && order.updatedAt) {
      deliveredDate = new Date(order.updatedAt)
    }

    if (!deliveredDate) {
      return { canReturn: false, message: 'Unable to determine delivery date' }
    }

    // Calculate hours since delivery
    const now = new Date()
    const hoursSinceDelivery = (now - deliveredDate) / (1000 * 60 * 60)

    if (hoursSinceDelivery > 24) {
      return { 
        canReturn: false, 
        message: 'Return requests must be submitted within 24 hours of delivery. The 24-hour window has expired.' 
      }
    }

    return { canReturn: true }
  }

  const handleOrderSelectForReturn = (order) => {
    const returnCheck = canReturnOrder(order)
    if (!returnCheck.canReturn) {
      showError(returnCheck.message)
      return
    }
    setSelectedOrderForReturn(order)
    setShowReturnForm(true)
  }

  const handleProductSelectForReturn = (item) => {
    setReturnForm(prev => ({
      ...prev,
      orderId: selectedOrderForReturn.orderId || selectedOrderForReturn._id || selectedOrderForReturn.id,
      productId: item.product || item.productId,
      productName: item.name,
      amount: item.price * item.quantity
    }))
  }

  const handleSubmitReturn = async (e) => {
    e.preventDefault()
    if (!returnForm.orderId || !returnForm.productId || !returnForm.reason || !returnForm.amount) {
      showError('Please fill in all required fields')
      return
    }

    // Double-check 24-hour window before submitting
    if (selectedOrderForReturn) {
      const returnCheck = canReturnOrder(selectedOrderForReturn)
      if (!returnCheck.canReturn) {
        showError(returnCheck.message)
        return
      }
    }

    try {
      await returnsAPI.create(returnForm)
      showSuccessToast('Return request submitted successfully')
      setShowReturnForm(false)
      setReturnForm({ orderId: '', productId: '', productName: '', reason: '', amount: '' })
      setSelectedOrderForReturn(null)
      loadReturns()
      loadOrders()
    } catch (err) {
      console.error('Failed to submit return:', err)
      const errorMessage = err.message || 'Failed to submit return request'
      showError(errorMessage)
    }
  }

  // Razorpay loading removed (payment methods UI removed)

  // Update profile form when user changes
  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        email: user.email || '',
        mobile: user.mobile || ''
      })
      setNewAddress(prev => ({ ...prev, name: user.name || '' }))
    }
  }, [user])

  const loadOrders = async () => {
    try {
      setLoading(true)
      const response = await ordersAPI.getAll()
      setOrders(Array.isArray(response) ? response : (response.orders || []))
    } catch (err) {
      console.error('Failed to load orders:', err)
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  const loadAddresses = async () => {
    try {
      const response = await addressesAPI.getAll()
      const addressesList = Array.isArray(response) ? response : (response.addresses || [])
      setAddresses(addressesList)
      return addressesList
    } catch (err) {
      console.error('Failed to load addresses:', err)
      setAddresses([])
      throw err
    }
  }

  const loadPaymentMethods = async () => {
    try {
      const response = await paymentAPI.getAll()
      setPaymentMethods(Array.isArray(response) ? response : (response.paymentMethods || []))
    } catch (err) {
      console.error('Failed to load payment methods:', err)
      setPaymentMethods([])
    }
  }

  // Load Razorpay script
  useEffect(() => {
    const loadRazorpay = () => {
      if (window.Razorpay) {
        setRazorpayLoaded(true)
        return
      }

      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.async = true
      script.onload = () => {
        setRazorpayLoaded(true)
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

  const loadPreferences = async () => {
    try {
      setLoadingPreferences(true)
      const prefs = await authAPI.getPreferences()
      setPreferences(prefs)
    } catch (err) {
      console.error('Failed to load preferences:', err)
    } finally {
      setLoadingPreferences(false)
    }
  }

  const loadNewsletterStatus = async () => {
    try {
      const status = await newsletterAPI.getStatus()
      setNewsletterStatus(status)
      if (status.subscribed !== undefined) {
        setPreferences(prev => ({ ...prev, newsletter: status.subscribed }))
      }
    } catch (err) {
      console.error('Failed to load newsletter status:', err)
    }
  }

  const handlePreferenceChange = async (key, value) => {
    try {
      const updatedPreferences = { ...preferences, [key]: value }
      setPreferences(updatedPreferences)
      
      if (key === 'newsletter') {
        if (value) {
          if (!user?.email) {
            showError('Please add an email address to your account first')
            setPreferences(prev => ({ ...prev, newsletter: false }))
            return
          }
          await newsletterAPI.subscribeUser()
          await loadNewsletterStatus()
          showSuccessToast('Subscribed to newsletter successfully')
        } else {
          await newsletterAPI.unsubscribeUser()
          await loadNewsletterStatus()
          showSuccessToast('Unsubscribed from newsletter')
        }
      } else {
        await authAPI.updatePreferences({ [key]: value })
        showSuccessToast('Preferences updated successfully')
      }
    } catch (err) {
      console.error('Failed to update preference:', err)
      showError(err.response?.data?.message || 'Failed to update preference')
      setPreferences(prev => ({ ...prev, [key]: !value }))
    }
  }

  const handleLogout = () => {
    logout()
    setActiveTab('login')
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    setError('')
    setSuccessMessage('')
    
    try {
      await updateProfile(profileForm)
      showSuccessToast('Profile updated successfully!')
    } catch (err) {
      setError(err.message)
      showError(err.message)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setError('')
    setSuccessMessage('')
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('New passwords do not match')
      showError('New passwords do not match')
      return
    }
    
    if (passwordForm.newPassword.length < 8) {
      setError('Password must be at least 8 characters')
      showError('Password must be at least 8 characters')
      return
    }
    
    try {
      await changePassword(passwordForm.currentPassword, passwordForm.newPassword)
      showSuccessToast('Password changed successfully!')
      setShowChangePassword(false)
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
    } catch (err) {
      setError(err.message)
      showError(err.message)
    }
  }

  // Render mobile or web version
  if (isMobile) {
    return (
      <DashboardMobile
        orders={orders}
        addresses={addresses}
        paymentMethods={paymentMethods}
        loading={loading}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        showAddAddress={showAddAddress}
        setShowAddAddress={setShowAddAddress}
        editingAddressId={editingAddressId}
        setEditingAddressId={setEditingAddressId}
        showAddPayment={showAddPayment}
        setShowAddPayment={setShowAddPayment}
        editingPaymentId={editingPaymentId}
        setEditingPaymentId={setEditingPaymentId}
        newAddress={newAddress}
        setNewAddress={setNewAddress}
        newPayment={newPayment}
        setNewPayment={setNewPayment}
        razorpayLoaded={razorpayLoaded}
        paymentFormRef={paymentFormRef}
        profileForm={profileForm}
        setProfileForm={setProfileForm}
        showChangePassword={showChangePassword}
        setShowChangePassword={setShowChangePassword}
        passwordForm={passwordForm}
        setPasswordForm={setPasswordForm}
        showCurrentPassword={showCurrentPassword}
        setShowCurrentPassword={setShowCurrentPassword}
        showNewPassword={showNewPassword}
        setShowNewPassword={setShowNewPassword}
        showConfirmPassword={showConfirmPassword}
        setShowConfirmPassword={setShowConfirmPassword}
        error={error}
        setError={setError}
        successMessage={successMessage}
        setSuccessMessage={setSuccessMessage}
        searchOrderQuery={searchOrderQuery}
        setSearchOrderQuery={setSearchOrderQuery}
        preferences={preferences}
        setPreferences={setPreferences}
        newsletterStatus={newsletterStatus}
        loadingPreferences={loadingPreferences}
        handleLogout={handleLogout}
        handleUpdateProfile={handleUpdateProfile}
        handleChangePassword={handleChangePassword}
        handlePreferenceChange={handlePreferenceChange}
        loadAddresses={loadAddresses}
        loadPaymentMethods={loadPaymentMethods}
        showDeleteModal={showDeleteModal}
        setShowDeleteModal={setShowDeleteModal}
        showSuccessToast={showSuccessToast}
        showError={showError}
        user={user}
        isAuthenticated={isAuthenticated}
        openModal={openModal}
        showReturnForm={showReturnForm}
        setShowReturnForm={setShowReturnForm}
        selectedOrderForReturn={selectedOrderForReturn}
        handleOrderSelectForReturn={handleOrderSelectForReturn}
        returnForm={returnForm}
        setReturnForm={setReturnForm}
        handleProductSelectForReturn={handleProductSelectForReturn}
        handleSubmitReturn={handleSubmitReturn}
        returns={returns}
      />
    )
  }

                      return (
    <DashboardWeb
      orders={orders}
      addresses={addresses}
      paymentMethods={paymentMethods}
      loading={loading}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      showAddAddress={showAddAddress}
      setShowAddAddress={setShowAddAddress}
      editingAddressId={editingAddressId}
      setEditingAddressId={setEditingAddressId}
      showAddPayment={showAddPayment}
      setShowAddPayment={setShowAddPayment}
      editingPaymentId={editingPaymentId}
      setEditingPaymentId={setEditingPaymentId}
      newAddress={newAddress}
      setNewAddress={setNewAddress}
      newPayment={newPayment}
      setNewPayment={setNewPayment}
      razorpayLoaded={razorpayLoaded}
      paymentFormRef={paymentFormRef}
      profileForm={profileForm}
      setProfileForm={setProfileForm}
      showChangePassword={showChangePassword}
      setShowChangePassword={setShowChangePassword}
      passwordForm={passwordForm}
      setPasswordForm={setPasswordForm}
      showCurrentPassword={showCurrentPassword}
      setShowCurrentPassword={setShowCurrentPassword}
      showNewPassword={showNewPassword}
      setShowNewPassword={setShowNewPassword}
      showConfirmPassword={showConfirmPassword}
      setShowConfirmPassword={setShowConfirmPassword}
      error={error}
      setError={setError}
      successMessage={successMessage}
      setSuccessMessage={setSuccessMessage}
      searchOrderQuery={searchOrderQuery}
      setSearchOrderQuery={setSearchOrderQuery}
      preferences={preferences}
      setPreferences={setPreferences}
      newsletterStatus={newsletterStatus}
      loadingPreferences={loadingPreferences}
      handleLogout={handleLogout}
      handleUpdateProfile={handleUpdateProfile}
      handleChangePassword={handleChangePassword}
      handlePreferenceChange={handlePreferenceChange}
      loadAddresses={loadAddresses}
      loadPaymentMethods={loadPaymentMethods}
      showDeleteModal={showDeleteModal}
      setShowDeleteModal={setShowDeleteModal}
      showSuccessToast={showSuccessToast}
      showError={showError}
      user={user}
      isAuthenticated={isAuthenticated}
      openModal={openModal}
      showReturnForm={showReturnForm}
      setShowReturnForm={setShowReturnForm}
      selectedOrderForReturn={selectedOrderForReturn}
      handleOrderSelectForReturn={handleOrderSelectForReturn}
      returnForm={returnForm}
      setReturnForm={setReturnForm}
      handleProductSelectForReturn={handleProductSelectForReturn}
      handleSubmitReturn={handleSubmitReturn}
      returns={returns}
    />
  )
}

export default Dashboard
