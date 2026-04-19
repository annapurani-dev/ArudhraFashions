import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { returnsAPI } from '../utils/api'
import { Package, User, MapPin, CreditCard, Settings, LogOut, Lock, Truck, Search, CheckCircle, Download, Eye, EyeOff, LogIn, Plus, Shield, Smartphone, Building2, Wallet, Mail, AlertTriangle, RotateCcw, Coins } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useLoginModal } from '../context/LoginModalContext'
import ConfirmationModal from '../components/Modal/ConfirmationModal'
import { useToast } from '../components/Toast/ToastContainer'
import { ordersAPI, addressesAPI, paymentAPI, cartAPI, authAPI, newsletterAPI, coinsAPI } from '../utils/api'
import CoinsTab from '../components/CoinsTab'
import Loading from '../components/Loading/Loading'
import { DashboardOrdersSkeleton } from '../components/Skeletons/PageSkeletons'

function DashboardWeb({ 
  orders, addresses, paymentMethods, loading, 
  activeTab, setActiveTab, showAddAddress, setShowAddAddress,
  editingAddressId, setEditingAddressId, showAddPayment, setShowAddPayment,
  editingPaymentId, setEditingPaymentId, newAddress, setNewAddress,
  newPayment, setNewPayment, razorpayLoaded, paymentFormRef,
  profileForm, setProfileForm, showChangePassword, setShowChangePassword,
  passwordForm, setPasswordForm, showCurrentPassword, setShowCurrentPassword,
  showNewPassword, setShowNewPassword, showConfirmPassword, setShowConfirmPassword,
  error, setError, successMessage, setSuccessMessage, searchOrderQuery, setSearchOrderQuery,
  preferences, setPreferences, newsletterStatus, loadingPreferences,
  handleLogout, handleUpdateProfile, handleChangePassword, handlePreferenceChange,
  loadAddresses, loadPaymentMethods, showDeleteModal, setShowDeleteModal,
  showSuccessToast, showError, user, isAuthenticated, openModal,
  showReturnForm, setShowReturnForm, selectedOrderForReturn, handleOrderSelectForReturn,
  returnForm, setReturnForm, handleProductSelectForReturn, handleSubmitReturn, returns
}) {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <div className="user-dashboard-page">
      <div className="container">
        <h1>{isAuthenticated ? 'My Account' : 'Account'}</h1>
        <div className="dashboard-content">
          {isAuthenticated ? (
            <aside className="dashboard-sidebar">
              <div className="dashboard-sidebar-header">
                <div className="dashboard-user-avatar">
                  <User size={32} />
                </div>
                <div className="dashboard-user-info">
                  <h3 className="dashboard-user-name">{user?.name || 'User'}</h3>
                  <p className="dashboard-user-email">{user?.email || user?.mobile || 'Account'}</p>
                </div>
              </div>
              <nav className="dashboard-nav">
                <button
                  className={`nav-item ${activeTab === 'orders' ? 'active' : ''}`}
                  onClick={() => setActiveTab('orders')}
                >
                  <Package size={20} />
                  <span>Orders</span>
                </button>
                <button
                  className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
                  onClick={() => setActiveTab('profile')}
                >
                  <User size={20} />
                  <span>Profile</span>
                </button>
                <button
                  className={`nav-item ${activeTab === 'addresses' ? 'active' : ''}`}
                  onClick={() => setActiveTab('addresses')}
                >
                  <MapPin size={20} />
                  <span>Addresses</span>
                </button>
                <button
                  className={`nav-item ${activeTab === 'payment' ? 'active' : ''}`}
                  onClick={() => setActiveTab('payment')}
                >
                  <CreditCard size={20} />
                  <span>Payment Methods</span>
                </button>
                <button
                  className={`nav-item ${activeTab === 'track' ? 'active' : ''}`}
                  onClick={() => setActiveTab('track')}
                >
                  <Truck size={20} />
                  <span>Track Order</span>
                </button>
                <button
                  className={`nav-item ${activeTab === 'returns' ? 'active' : ''}`}
                  onClick={() => setActiveTab('returns')}
                >
                  <RotateCcw size={20} />
                  <span>Returns & Exchanges</span>
                </button>
                <button
                  className={`nav-item ${activeTab === 'coins' ? 'active' : ''}`}
                  onClick={() => setActiveTab('coins')}
                >
                  <Coins size={20} />
                  <span>Coins & Rewards</span>
                </button>
                <button
                  className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
                  onClick={() => setActiveTab('settings')}
                >
                  <Settings size={20} />
                  <span>Settings</span>
                </button>
                <button
                  className="nav-item logout-btn"
                  onClick={handleLogout}
                >
                  <LogOut size={20} />
                  <span>Logout</span>
                </button>
              </nav>
            </aside>
          ) : null}

          <div className="dashboard-main">
            {!isAuthenticated ? (
              <div className="dashboard-section">
                <div className="login-prompt">
                  <div className="login-prompt-icon">
                    <LogIn size={64} />
                  </div>
                  <h2>Please Login to Continue</h2>
                  <p>You need to be logged in to access your account dashboard.</p>
                  <button 
                    className="btn btn-primary"
                    onClick={() => openModal('login')}
                  >
                    <LogIn size={20} />
                    Login
                  </button>
                  <p className="login-prompt-hint">
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
            ) : (
              <>
            {/* Orders Tab */}
            {isAuthenticated && activeTab === 'orders' && (
              <div className="dashboard-section">
                <h2>Order History</h2>
                {orders.length === 0 ? (
                  <div className="empty-state">
                    <Package size={48} />
                    <h3>No orders yet</h3>
                    <p>Start shopping to see your orders here</p>
                    <Link to="/products/women" className="btn btn-primary">
                      Start Shopping
                    </Link>
                  </div>
                ) : (
                  <div className="orders-list">
                    {loading ? (
                      <DashboardOrdersSkeleton />
                    ) : orders.length === 0 ? (
                      <div className="empty-state">
                        <Package size={48} />
                        <h3>No orders yet</h3>
                        <p>Start shopping to see your orders here</p>
                        <Link to="/products/women" className="btn btn-primary">
                          Start Shopping
                        </Link>
                      </div>
                    ) : (
                      orders.map(order => {
                        const orderId = order._id || order.id
                        return (
                          <div key={orderId} className="order-card">
                            <div className="order-header">
                              <div>
                                <h3>Order {orderId.slice(-8).toUpperCase()}</h3>
                                <p className="order-date">Placed on {new Date(order.createdAt || order.date).toLocaleDateString('en-IN', { 
                                  year: 'numeric', 
                                  month: 'long', 
                                  day: 'numeric' 
                                })}</p>
                              </div>
                              <span className={`order-status ${(order.status || 'Processing').toLowerCase()}`}>
                                {order.status || 'Processing'}
                              </span>
                            </div>
                            <div className="order-details">
                              <p>{order.items?.length || 0} item(s) • Total: ₹{(Number(order.total) || 0).toFixed(2)}</p>
                          {order.trackingNumber && (
                                <p className="tracking">
                                  Tracking: <strong>{order.trackingNumber}</strong>
                                </p>
                              )}
                          <div className="order-payment">
                            <strong>Payment:</strong>&nbsp;
                            <span>{order.payment?.method === 'cod' ? 'Cash on Delivery' : 'Online'}</span>
                            {order.payment?.status && <span className="text-muted"> • {order.payment.status}</span>}
                          </div>
                            </div>
                            <div className="order-actions">
                              <Link to={`/order/${orderId}`} className="btn btn-outline">
                                View Details
                              </Link>
                              <button 
                                className="btn btn-outline"
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
                              {order.status === 'Delivered' && (
                                <button className="btn btn-outline">Reorder</button>
                              )}
                              {order.trackingNumber && (
                                <Link to={`/track/${order.trackingNumber}`} className="btn btn-primary">
                                  Track Order
                                </Link>
                              )}
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Profile Tab */}
            {isAuthenticated && activeTab === 'profile' && (
              <div className="dashboard-section">
                <div className="profile-header">
                  <h2>Personal Information</h2>
                  <p className="profile-subtitle">Manage your account details and preferences</p>
                </div>
                
                {error && <div className="alert alert-error">{error}</div>}
                {successMessage && <div className="alert alert-success">{successMessage}</div>}
                
                <div className="profile-content">
                  <div className="profile-card">
                    <div className="profile-card-header">
                      <h3>Account Details</h3>
                    </div>
                    <form onSubmit={handleUpdateProfile} className="profile-form">
                      <div className="form-group">
                        <label>Full Name</label>
                        <input
                          type="text"
                          value={profileForm.name}
                          onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                          required
                          placeholder="Enter your full name"
                        />
                      </div>
                      <div className="form-group">
                        <label>Mobile Number</label>
                        <input
                          type="tel"
                          value={profileForm.mobile}
                          disabled
                          className="disabled-input"
                        />
                        <small className="form-hint">Mobile number cannot be changed</small>
                      </div>
                      <div className="form-group">
                        <label>Email Address <span className="optional">(Optional)</span></label>
                        <input
                          type="email"
                          value={profileForm.email}
                          onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                          placeholder="your@email.com"
                        />
                      </div>
                      <div className="form-actions">
                        <button type="submit" className="btn btn-primary">
                          Save Changes
                        </button>
                      </div>
                    </form>
                  </div>

                  <div className="profile-card">
                    <div className="profile-card-header">
                      <h3>Security</h3>
                      <p className="profile-card-description">Change your password to keep your account secure</p>
                    </div>
                    {!showChangePassword ? (
                      <div className="password-section-closed">
                        <div className="password-info">
                          <Lock size={20} />
                          <div>
                            <p className="password-info-title">Password</p>
                            <p className="password-info-desc">Last updated: Recently</p>
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
                      <form onSubmit={handleChangePassword} className="password-form">
                        <div className="form-group">
                          <label>Current Password</label>
                          <div className="password-input-wrapper">
                            <input
                              type={showCurrentPassword ? 'text' : 'password'}
                              value={passwordForm.currentPassword}
                              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                              required
                              placeholder="Enter current password"
                            />
                            <button
                              type="button"
                              className="password-toggle"
                              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            >
                              {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </div>
                        </div>
                        <div className="form-group">
                          <label>New Password</label>
                          <div className="password-input-wrapper">
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
                              className="password-toggle"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                            >
                              {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </div>
                        </div>
                        <div className="form-group">
                          <label>Confirm New Password</label>
                          <div className="password-input-wrapper">
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
                              className="password-toggle"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </div>
                        </div>
                        <div className="form-actions">
                          <button type="submit" className="btn btn-primary">
                            Update Password
                          </button>
                          <button 
                            type="button"
                            className="btn btn-outline"
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
              </div>
            )}

            {/* Addresses Tab */}
            {isAuthenticated && activeTab === 'addresses' && (
              <div className="dashboard-section">
                <h2>Saved Addresses</h2>
                <div className="addresses-list">
                  {addresses && addresses.length > 0 ? (
                    addresses.map(address => {
                      const addressId = address._id || address.id
                      return (
                        <div key={addressId} className="address-card">
                          <div className="address-header">
                            <h3>
                              {address.type === 'Other' && address.otherDetail 
                                ? address.otherDetail 
                                : address.type || 'Home'}
                            </h3>
                            {address.isDefault && <span className="default-badge">Default</span>}
                          </div>
                          <p>{address.name}</p>
                          <p>{address.address}</p>
                          <p>{address.city}, {address.state} {address.zipCode || address.zip}</p>
                          <div className="address-actions">
                            <button 
                              className="btn btn-outline"
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
                            >
                              Edit
                            </button>
                            <button 
                              className="btn btn-outline"
                              onClick={async () => {
                                if (window.confirm('Delete this address?')) {
                                  try {
                                    await addressesAPI.delete(address._id || address.id)
                                    await loadAddresses()
                                    showSuccessToast('Address deleted')
                                  } catch (err) {
                                    showError('Failed to delete address')
                                  }
                                }
                              }}
                            >
                              Delete
                            </button>
                            {!address.isDefault && (
                              <button 
                                className="btn btn-primary"
                                onClick={async () => {
                                  try {
                                    await addressesAPI.update(address._id || address.id, { isDefault: true })
                                    await loadAddresses()
                                    showSuccessToast('Default address updated')
                                  } catch (err) {
                                    showError('Failed to update default address')
                                  }
                                }}
                              >
                                Set as Default
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="empty-state">
                      <MapPin size={48} />
                      <h3>No saved addresses</h3>
                      <p>Add an address to speed up checkout</p>
                    </div>
                  )}
                </div>
                {!showAddAddress ? (
                  <button className="btn btn-primary" onClick={() => {
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
                  }}>
                    <Plus size={18} />
                    Add New Address
                  </button>
                ) : (
                  <div className="add-address-form">
                    <h3>{editingAddressId ? 'Edit Address' : 'Add New Address'}</h3>
                    {error && <div className="alert alert-error">{error}</div>}
                    {successMessage && <div className="alert alert-success">{successMessage}</div>}
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
                          await loadAddresses()
                          showSuccessToast('Address updated successfully!')
                        } else {
                          await addressesAPI.add(addressData)
                          await loadAddresses()
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
                      <div className="form-group">
                        <label>Address Type</label>
                        <div className="address-type-select-wrapper">
                          <select
                            className="address-type-select"
                            value={newAddress.type}
                            onChange={(e) => setNewAddress({ ...newAddress, type: e.target.value, otherDetail: e.target.value !== 'Other' ? '' : newAddress.otherDetail })}
                            required
                          >
                            <option value="Home">Home</option>
                            <option value="Work">Work</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        {newAddress.type === 'Other' && (
                          <div className="form-group" style={{ marginTop: '1rem' }}>
                            <label>Specify Address Type</label>
                            <input
                              type="text"
                              placeholder="e.g., Vacation Home, Office, Warehouse, etc."
                              value={newAddress.otherDetail}
                              onChange={(e) => setNewAddress({ ...newAddress, otherDetail: e.target.value })}
                              className="other-detail-input"
                            />
                          </div>
                        )}
                      </div>
                      <div className="form-group">
                        <label>Full Name</label>
                        <input
                          type="text"
                          value={newAddress.name}
                          onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Street Address</label>
                        <input
                          type="text"
                          value={newAddress.address}
                          onChange={(e) => setNewAddress({ ...newAddress, address: e.target.value })}
                          required
                        />
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label>City</label>
                          <input
                            type="text"
                            value={newAddress.city}
                            onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label>State</label>
                          <input
                            type="text"
                            value={newAddress.state}
                            onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label>ZIP Code</label>
                          <input
                            type="text"
                            value={newAddress.zip}
                            onChange={(e) => setNewAddress({ ...newAddress, zip: e.target.value })}
                            required
                          />
                        </div>
                      </div>
                      <div className="form-group">
                        <label>
                          <input
                            type="checkbox"
                            checked={newAddress.isDefault}
                            onChange={(e) => setNewAddress({ ...newAddress, isDefault: e.target.checked })}
                          />
                          Set as default address
                        </label>
                      </div>
                      <div className="form-actions">
                        <button type="submit" className="btn btn-primary">
                          {editingAddressId ? 'Update Address' : 'Save Address'}
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline"
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
            {isAuthenticated && activeTab === 'track' && (
              <div className="dashboard-section">
                <div className="track-order-header">
                  <div>
                    <h2>Track Your Orders</h2>
                    <p className="section-description">View and track all your orders</p>
                  </div>
                </div>
                
                <div className="track-order-search">
                  <div className="search-input-wrapper">
                    <Search size={20} className="search-icon" />
                    <input
                      type="text"
                      value={searchOrderQuery}
                      onChange={(e) => setSearchOrderQuery(e.target.value)}
                      placeholder="Search by Order ID, Tracking Number, or Status..."
                      className="track-input"
                    />
                    {searchOrderQuery && (
                      <button
                        type="button"
                        className="clear-search"
                        onClick={() => setSearchOrderQuery('')}
                        aria-label="Clear search"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>

                <div className="track-orders-container">
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
                        <div className="empty-state">
                          <Truck size={48} />
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
                      <div className="track-orders-list">
                        {filteredOrders.map(order => {
                          const orderId = order._id || order.id
                          return (
                            <div key={orderId} className="track-order-card">
                              <div className="order-card-header">
                                <div className="order-header-left">
                                  <h3>Order {orderId.slice(-8).toUpperCase()}</h3>
                                  {order.trackingNumber || order.tracking ? (
                                    <p className="tracking-info">
                                      <strong>Tracking:</strong> {order.trackingNumber || order.tracking}
                                    </p>
                                  ) : null}
                                </div>
                                <div className="order-status-badge">
                                  <span className={`status-text ${(order.status || 'Processing').toLowerCase()}`}>
                                    {order.status || 'Processing'}
                                  </span>
                                </div>
                              </div>

                              <div className="order-card-body">
                                <div className="status-timeline-compact">
                                  <div className="timeline-compact">
                                    {[
                                      { label: 'Placed', status: 'completed' },
                                      { label: 'Processing', status: (order.status?.toLowerCase() === 'processing' || order.status?.toLowerCase() === 'shipped' || order.status?.toLowerCase() === 'delivered') ? 'completed' : 'pending' },
                                      { label: 'Shipped', status: (order.status?.toLowerCase() === 'shipped' || order.status?.toLowerCase() === 'delivered') ? 'completed' : 'pending' },
                                      { label: 'Delivered', status: order.status?.toLowerCase() === 'delivered' ? 'completed' : 'pending' }
                                    ].map((step, index) => (
                                      <div key={index} className={`timeline-step-compact ${step.status}`}>
                                        <div className="timeline-marker-compact">
                                          {step.status === 'completed' ? (
                                            <CheckCircle size={16} />
                                          ) : (
                                            <div className="timeline-dot-compact"></div>
                                          )}
                                        </div>
                                        <span className="timeline-label">{step.label}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
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
            {isAuthenticated && activeTab === 'returns' && (
              <div className="dashboard-section">
                <div className="track-order-header">
                  <div>
                    <h2>Returns & Exchanges</h2>
                    <p className="section-description">Select an order to request a return or exchange</p>
                  </div>
                </div>

                {/* My Returns Section */}
                {returns.length > 0 && (
                  <div style={{ marginBottom: '2rem' }}>
                    <h3 style={{ marginBottom: '1rem' }}>My Return Requests</h3>
                    <div className="orders-list">
                      {returns.map(ret => (
                        <div key={ret.id} className="order-card">
                          <div className="order-header">
                            <div>
                              <h3>{ret.returnId}</h3>
                              <p className="order-date">
                                {new Date(ret.requestedAt || ret.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <span className={`order-status ${ret.status}`}>
                              {ret.status}
                            </span>
                          </div>
                          <div className="order-details">
                            <p><strong>Order ID:</strong> {ret.orderId}</p>
                            <p><strong>Product:</strong> {ret.productName}</p>
                            <p><strong>Reason:</strong> {ret.reason}</p>
                            <p><strong>Amount:</strong> ₹{parseFloat(ret.amount).toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {loading ? (
                  <DashboardOrdersSkeleton />
                ) : orders.length === 0 ? (
                  <div className="empty-state">
                    <RotateCcw size={48} />
                    <h3>No orders yet</h3>
                    <p>Start shopping to see your orders here</p>
                    <Link to="/products/women" className="btn btn-primary">
                      Start Shopping
                    </Link>
                  </div>
                ) : (
                  <div className="orders-list">
                    {orders.filter(order => order.status !== 'Cancelled').map(order => {
                      const orderId = order._id || order.id
                      return (
                        <div key={orderId} className="order-card">
                          <div className="order-header">
                            <div>
                              <h3>Order {orderId.slice(-8).toUpperCase()}</h3>
                              <p className="order-date">Placed on {new Date(order.createdAt || order.date).toLocaleDateString('en-IN', { 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              })}</p>
                            </div>
                            <span className={`order-status ${(order.status || 'Processing').toLowerCase()}`}>
                              {order.status || 'Processing'}
                            </span>
                          </div>
                          <div className="order-details">
                            <p>{order.items?.length || 0} item(s) • Total: ₹{(Number(order.total) || 0).toFixed(2)}</p>
                            {order.items?.slice(0, 3).map((item, idx) => (
                              <p key={idx} className="order-item-preview">
                                {item.name} - {item.quantity}x
                              </p>
                            ))}
                            {order.items?.length > 3 && (
                              <p className="order-item-preview">+{order.items.length - 3} more item(s)</p>
                            )}
                          </div>
                          <div className="order-actions">
                            <Link to={`/order/${orderId}`} className="btn btn-outline">
                              View Details
                            </Link>
                            <button 
                              onClick={() => handleOrderSelectForReturn(order)}
                              className="btn btn-primary"
                            >
                              Request Return/Exchange
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Return Form Modal */}
                {showReturnForm && selectedOrderForReturn && (
                  <div className="modal-overlay" onClick={() => setShowReturnForm(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                      <div className="modal-header">
                        <h2>Request Return</h2>
                        <button className="modal-close" onClick={() => setShowReturnForm(false)}>
                          ×
                        </button>
                      </div>
                      <form onSubmit={handleSubmitReturn} className="modal-body">
                        <div className="form-group">
                          <label>Select Product *</label>
                          <select
                            value={returnForm.productId}
                            onChange={(e) => {
                              const item = selectedOrderForReturn.items?.find(i => 
                                (i.product || i.productId) === e.target.value
                              )
                              if (item) {
                                handleProductSelectForReturn(item)
                              }
                            }}
                            required
                          >
                            <option value="">Select a product</option>
                            {selectedOrderForReturn.items?.map((item, idx) => (
                              <option key={idx} value={item.product || item.productId}>
                                {item.name} - ₹{parseFloat(item.price * item.quantity).toLocaleString()}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Reason for Return *</label>
                          <select
                            value={returnForm.reason}
                            onChange={(e) => setReturnForm(prev => ({ ...prev, reason: e.target.value }))}
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
                            value={`₹${parseFloat(returnForm.amount || 0).toLocaleString()}`}
                            disabled
                          />
                        </div>
                        <div className="modal-footer">
                          <button type="button" className="btn btn-outline" onClick={() => setShowReturnForm(false)}>
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
            {isAuthenticated && activeTab === 'coins' && (
              <CoinsTab user={user} showSuccessToast={showSuccessToast} showError={showError} />
            )}

            {/* Settings Tab */}
            {isAuthenticated && activeTab === 'settings' && (
              <div className="dashboard-section">
                <div className="settings-header">
                  <h2>Account Settings</h2>
                  <p className="settings-subtitle">Manage your notification preferences and account settings</p>
                </div>
                {loadingPreferences ? (
                  <div className="empty-state">
                    <Settings size={48} />
                    <p>Loading preferences...</p>
                  </div>
                ) : (
                  <>
                    <div className="settings-list">
                      <div className="setting-item">
                        <div className="setting-icon-wrapper">
                          <Mail size={24} />
                        </div>
                        <div className="setting-content">
                          <h3>Email Notifications</h3>
                          <p>Receive emails about your orders and promotions</p>
                        </div>
                        <label className="toggle">
                          <input 
                            type="checkbox" 
                            checked={preferences.emailNotifications || false}
                            onChange={(e) => handlePreferenceChange('emailNotifications', e.target.checked)}
                            disabled={loadingPreferences}
                          />
                          <span></span>
                        </label>
                      </div>
                      <div className="setting-item">
                        <div className="setting-icon-wrapper">
                          <Mail size={24} />
                        </div>
                        <div className="setting-content">
                          <h3>Newsletter</h3>
                          <p>
                            {newsletterStatus.email 
                              ? `Subscribe to our newsletter for updates and offers (${newsletterStatus.email})`
                              : 'Subscribe to our newsletter for updates and offers'
                            }
                            {!user?.email && (
                              <span className="setting-hint">
                                Add an email address to your profile to subscribe
                              </span>
                            )}
                          </p>
                        </div>
                        <label className="toggle">
                          <input 
                            type="checkbox" 
                            checked={preferences.newsletter || false}
                            onChange={(e) => handlePreferenceChange('newsletter', e.target.checked)}
                            disabled={loadingPreferences || !user?.email}
                          />
                          <span></span>
                        </label>
                      </div>
                    </div>
                    <div className="danger-zone">
                      <div className="danger-zone-header">
                        <AlertTriangle size={24} />
                        <h3>Danger Zone</h3>
                      </div>
                      <p className="danger-zone-description">
                        Once you delete your account, there is no going back. Please be certain.
                      </p>
                      <button 
                        className="btn btn-danger"
                        onClick={() => setShowDeleteModal(true)}
                      >
                        Delete Account
                      </button>
                    </div>
                  </>
                )}
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
              </div>
            )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardWeb
