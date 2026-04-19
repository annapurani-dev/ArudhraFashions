// Push Notification Utility Functions
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

/**
 * Register service worker
 * @returns {Promise<ServiceWorkerRegistration|null>}
 */
export const registerServiceWorker = async () => {
  if (!('serviceWorker' in navigator)) {
    console.log('Service workers not supported')
    return null
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js')
    console.log('Service Worker registered:', registration)
    return registration
  } catch (error) {
    console.error('Service Worker registration failed:', error)
    return null
  }
}

/**
 * Check if push notifications are supported
 * @returns {boolean}
 */
export const isPushSupported = () => {
  return 'serviceWorker' in navigator && 'PushManager' in window
}

/**
 * Request notification permission
 * @returns {Promise<boolean>}
 */
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.log('Notifications not supported')
    return false
  }

  try {
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  } catch (error) {
    console.error('Error requesting notification permission:', error)
    return false
  }
}

/**
 * Get VAPID public key from server
 * @returns {Promise<string|null>}
 */
export const getVapidPublicKey = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/push/vapid-key`, {
      credentials: 'include'
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch VAPID key')
    }
    
    const data = await response.json()
    return data.publicKey
  } catch (error) {
    console.error('Error fetching VAPID key:', error)
    return null
  }
}

/**
 * Subscribe to push notifications
 * @param {ServiceWorkerRegistration} registration - Service worker registration
 * @returns {Promise<boolean>}
 */
export const subscribeToPush = async (registration) => {
  if (!registration) {
    console.error('No service worker registration')
    return false
  }

  try {
    // Get VAPID public key
    const publicKey = await getVapidPublicKey()
    if (!publicKey) {
      throw new Error('Failed to get VAPID public key')
    }

    // Subscribe to push notifications
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey)
    })

    // Get device info
    const deviceInfo = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      timestamp: new Date().toISOString()
    }

    // Send subscription to server
    const response = await fetch(`${API_BASE_URL}/admin/push/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        subscription: subscription.toJSON(),
        deviceInfo
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Failed to subscribe')
    }

    const data = await response.json()
    console.log('Successfully subscribed to push notifications:', data)
    return true
  } catch (error) {
    console.error('Error subscribing to push notifications:', error)
    return false
  }
}

/**
 * Unsubscribe from push notifications
 * @param {ServiceWorkerRegistration} registration - Service worker registration
 * @returns {Promise<boolean>}
 */
export const unsubscribeFromPush = async (registration) => {
  if (!registration) {
    console.error('No service worker registration')
    return false
  }

  try {
    const subscription = await registration.pushManager.getSubscription()
    if (!subscription) {
      console.log('No active subscription found')
      return true
    }

    // Send unsubscribe request to server
    const response = await fetch(`${API_BASE_URL}/admin/push/unsubscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        endpoint: subscription.endpoint
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Failed to unsubscribe')
    }

    // Remove local subscription
    await subscription.unsubscribe()
    console.log('Successfully unsubscribed from push notifications')
    return true
  } catch (error) {
    console.error('Error unsubscribing from push notifications:', error)
    return false
  }
}

/**
 * Get current push subscription status
 * @param {ServiceWorkerRegistration} registration - Service worker registration
 * @returns {Promise<{isSubscribed: boolean, subscription: PushSubscription|null}>}
 */
export const getPushSubscriptionStatus = async (registration) => {
  if (!registration) {
    return { isSubscribed: false, subscription: null }
  }

  try {
    const subscription = await registration.pushManager.getSubscription()
    return {
      isSubscribed: !!subscription,
      subscription
    }
  } catch (error) {
    console.error('Error getting subscription status:', error)
    return { isSubscribed: false, subscription: null }
  }
}

/**
 * Get admin's active subscriptions from server
 * @returns {Promise<Array>}
 */
export const getAdminSubscriptions = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/push/subscriptions`, {
      credentials: 'include'
    })

    if (!response.ok) {
      throw new Error('Failed to fetch subscriptions')
    }

    const data = await response.json()
    return data.subscriptions || []
  } catch (error) {
    console.error('Error fetching admin subscriptions:', error)
    return []
  }
}

/**
 * Convert URL-safe base64 string to Uint8Array
 * @param {string} base64String - Base64 string
 * @returns {Uint8Array}
 */
const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

/**
 * Initialize push notifications
 * @returns {Promise<{success: boolean, registration: ServiceWorkerRegistration|null}>}
 */
export const initializePushNotifications = async () => {
  // Check if supported
  if (!isPushSupported()) {
    console.log('Push notifications not supported')
    return { success: false, registration: null }
  }

  try {
    // Register service worker
    const registration = await registerServiceWorker()
    if (!registration) {
      return { success: false, registration: null }
    }

    // Request notification permission
    const permissionGranted = await requestNotificationPermission()
    if (!permissionGranted) {
      console.log('Notification permission not granted')
      return { success: false, registration }
    }

    return { success: true, registration }
  } catch (error) {
    console.error('Error initializing push notifications:', error)
    return { success: false, registration: null }
  }
}

export default {
  registerServiceWorker,
  isPushSupported,
  requestNotificationPermission,
  getVapidPublicKey,
  subscribeToPush,
  unsubscribeFromPush,
  getPushSubscriptionStatus,
  getAdminSubscriptions,
  initializePushNotifications
}