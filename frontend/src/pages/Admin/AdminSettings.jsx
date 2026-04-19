import { useState, useEffect } from 'react'
import { Save, Store, Truck, CreditCard, Mail, Globe, Bell } from 'lucide-react'
import { useToast } from '../../components/Toast/ToastContainer'
import { adminSettingsAPI } from '../../utils/adminApi'
import { 
  initializePushNotifications, 
  subscribeToPush, 
  unsubscribeFromPush, 
  getPushSubscriptionStatus,
  getAdminSubscriptions
} from '../../utils/pushNotifications'

function AdminSettings() {
  const { success, error: showError } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [pushSupported, setPushSupported] = useState(false)
  const [pushPermission, setPushPermission] = useState(false)
  const [pushSubscribed, setPushSubscribed] = useState(false)
  const [pushLoading, setPushLoading] = useState(false)
  const [registration, setRegistration] = useState(null)
  const [subscriptions, setSubscriptions] = useState([])
  const [settings, setSettings] = useState({
    store: {
      name: 'Arudhra Fashions',
      email: 'support@arudhrafashions.com',
      phone: '+91 98765 43210',
      address: '123 Fashion Street, Mumbai, Maharashtra 400001, India'
    },
    shipping: {
      freeShippingThreshold: 2000,
      standardShippingCost: 99,
      expressShippingCost: 199,
      sameDayCost: 299
    },
    tax: {
      gstRate: 18
    },
    payment: {
      enableCOD: true,
      enableUPI: true,
      enableCards: true
    }
  })

  useEffect(() => {
    loadSettings()
    initializePushNotificationsUI()
  }, [])

  const initializePushNotificationsUI = async () => {
    try {
      // Check if push is supported
      const supported = 'serviceWorker' in navigator && 'PushManager' in window
      setPushSupported(supported)
      
      if (!supported) return

      // Initialize push notifications
      const result = await initializePushNotifications()
      setRegistration(result.registration)
      
      if (result.success) {
        setPushPermission(true)
        // Check subscription status
        const status = await getPushSubscriptionStatus(result.registration)
        setPushSubscribed(status.isSubscribed)
        
        // Load existing subscriptions
        const subs = await getAdminSubscriptions()
        setSubscriptions(subs)
      }
    } catch (error) {
      console.error('Error initializing push notifications:', error)
    }
  }

  const handlePushToggle = async () => {
    if (!registration) return

    setPushLoading(true)
    try {
      if (pushSubscribed) {
        // Unsubscribe
        const success = await unsubscribeFromPush(registration)
        if (success) {
          setPushSubscribed(false)
          success('Push notifications disabled')
          // Refresh subscriptions list
          const subs = await getAdminSubscriptions()
          setSubscriptions(subs)
        } else {
          showError('Failed to disable push notifications')
        }
      } else {
        // Subscribe
        const success = await subscribeToPush(registration)
        if (success) {
          setPushSubscribed(true)
          success('Push notifications enabled')
          // Refresh subscriptions list
          const subs = await getAdminSubscriptions()
          setSubscriptions(subs)
        } else {
          showError('Failed to enable push notifications')
        }
      }
    } catch (error) {
      console.error('Error toggling push notifications:', error)
      showError('Failed to update push notification settings')
    } finally {
      setPushLoading(false)
    }
  }

  const loadSettings = async () => {
    try {
      setLoading(true)
      const [storeSettings, shippingSettings, taxSettings, paymentSettings] = await Promise.all([
        adminSettingsAPI.getAll('store'),
        adminSettingsAPI.getAll('shipping'),
        adminSettingsAPI.getAll('tax'),
        adminSettingsAPI.getAll('payment')
      ])

      setSettings(prev => ({
        ...prev,
        store: { ...prev.store, ...storeSettings },
        shipping: { ...prev.shipping, ...shippingSettings },
        tax: { ...prev.tax, ...taxSettings },
        payment: { ...prev.payment, ...paymentSettings }
      }))
    } catch (err) {
      console.error('Error loading settings:', err)
      showError('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // Save all settings
      await adminSettingsAPI.update({
        ...settings.store,
        ...settings.shipping,
        ...settings.tax,
        ...settings.payment
      })
      success('Settings saved successfully')
    } catch (err) {
      showError('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const updateSetting = (section, key, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }))
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>Settings</h1>
          <p>Configure store settings and preferences</p>
        </div>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving || loading}>
          <Save size={18} />
          {saving ? 'Saving...' : 'Save All Changes'}
        </button>
      </div>

      <div className="settings-sections">
        {/* Push Notifications Section */}
        <div className="settings-section-card">
          <div className="section-icon">
            <Bell size={24} />
          </div>
          <div className="section-content">
            <h2>Push Notifications</h2>
            <p>Receive real-time notifications for new orders and important events</p>
            
            {!pushSupported ? (
              <div className="notification-banner warning">
                <p>Push notifications are not supported in your browser</p>
              </div>
            ) : (
              <>
                <div className="form-group">
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={pushSubscribed}
                      onChange={handlePushToggle}
                      disabled={pushLoading}
                    />
                    <span className="slider"></span>
                    <span className="label">
                      {pushLoading ? 'Updating...' : 
                       pushSubscribed ? 'Notifications Enabled' : 'Enable Notifications'}
                    </span>
                  </label>
                </div>
                
                {pushSubscribed && subscriptions.length > 0 && (
                  <div className="subscriptions-list">
                    <h3>Active Devices ({subscriptions.length})</h3>
                    {subscriptions.map((sub) => (
                      <div key={sub.id} className="subscription-item">
                        <div className="subscription-info">
                          <p><strong>Device:</strong> {sub.deviceInfo?.platform || 'Unknown'}</p>
                          <p><strong>Subscribed:</strong> {new Date(sub.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {!pushPermission && (
                  <div className="notification-banner info">
                    <p>Please allow notification permissions in your browser to enable push notifications</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Store Information */}
        <div className="settings-section-card">
          <div className="section-icon">
            <Store size={24} />
          </div>
          <div className="section-content">
            <h2>Store Information</h2>
            <div className="form-group">
              <label>Store Name</label>
              <input
                type="text"
                value={settings.store.name}
                onChange={(e) => updateSetting('store', 'name', e.target.value)}
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={settings.store.email}
                  onChange={(e) => updateSetting('store', 'email', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  value={settings.store.phone}
                  onChange={(e) => updateSetting('store', 'phone', e.target.value)}
                />
              </div>
            </div>
            <div className="form-group">
              <label>Address</label>
              <textarea
                rows="3"
                value={settings.store.address}
                onChange={(e) => updateSetting('store', 'address', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Shipping Settings */}
        <div className="settings-section-card">
          <div className="section-icon">
            <Truck size={24} />
          </div>
          <div className="section-content">
            <h2>Shipping Settings</h2>
            <div className="form-group">
              <label>Free Shipping Threshold (₹)</label>
              <input
                type="number"
                value={settings.shipping.freeShippingThreshold}
                onChange={(e) => updateSetting('shipping', 'freeShippingThreshold', parseInt(e.target.value))}
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Standard Shipping (₹)</label>
                <input
                  type="number"
                  value={settings.shipping.standardShippingCost}
                  onChange={(e) => updateSetting('shipping', 'standardShippingCost', parseInt(e.target.value))}
                />
              </div>
              <div className="form-group">
                <label>Express Shipping (₹)</label>
                <input
                  type="number"
                  value={settings.shipping.expressShippingCost}
                  onChange={(e) => updateSetting('shipping', 'expressShippingCost', parseInt(e.target.value))}
                />
              </div>
            </div>
            <div className="form-group">
              <label>Same Day Delivery (₹)</label>
              <input
                type="number"
                value={settings.shipping.sameDayCost}
                onChange={(e) => updateSetting('shipping', 'sameDayCost', parseInt(e.target.value))}
              />
            </div>
          </div>
        </div>

        {/* Tax Settings */}
        <div className="settings-section-card">
          <div className="section-icon">
            <CreditCard size={24} />
          </div>
          <div className="section-content">
            <h2>Tax Settings</h2>
            <div className="form-group">
              <label>GST Rate (%)</label>
              <input
                type="number"
                value={settings.tax.gstRate}
                onChange={(e) => updateSetting('tax', 'gstRate', parseInt(e.target.value))}
                min="0"
                max="100"
              />
            </div>
          </div>
        </div>

        {/* Payment Settings */}
        <div className="settings-section-card">
          <div className="section-icon">
            <CreditCard size={24} />
          </div>
          <div className="section-content">
            <h2>Payment Methods</h2>
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.payment.enableCOD}
                  onChange={(e) => updateSetting('payment', 'enableCOD', e.target.checked)}
                />
                <span>Cash on Delivery (COD)</span>
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.payment.enableUPI}
                  onChange={(e) => updateSetting('payment', 'enableUPI', e.target.checked)}
                />
                <span>UPI</span>
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.payment.enableCards}
                  onChange={(e) => updateSetting('payment', 'enableCards', e.target.checked)}
                />
                <span>Credit/Debit Cards</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminSettings