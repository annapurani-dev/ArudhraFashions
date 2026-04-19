import webpush from 'web-push'
import { PushSubscription } from '../models/index.js'

// Configure web-push with VAPID keys
// You should generate these keys using: npx web-push generate-vapid-keys
const vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY || 'YOUR_PUBLIC_KEY_HERE',
  privateKey: process.env.VAPID_PRIVATE_KEY || 'YOUR_PRIVATE_KEY_HERE'
}

webpush.setVapidDetails(
  'mailto:fashion.arudhra@gmail.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
)

/**
 * Send push notification to all subscribed admins
 * @param {Object} payload - Notification payload
 * @returns {Promise<Object>} - Result object with success count
 */
export const sendPushNotificationToAdmins = async (payload) => {
  try {
    // Get all active subscriptions
    const subscriptions = await PushSubscription.findAll({
      where: { isActive: true },
      include: [{
        association: 'admin',
        where: { isActive: true }
      }]
    })

    if (subscriptions.length === 0) {
      return { success: true, message: 'No active subscriptions found', sentCount: 0 }
    }

    const notificationPayload = JSON.stringify(payload)
    const sendPromises = subscriptions.map(async (subscription) => {
      try {
        const pushSubscription = {
          endpoint: subscription.endpoint,
          keys: subscription.keys
        }

        await webpush.sendNotification(pushSubscription, notificationPayload)
        return { success: true, subscriptionId: subscription.id }
      } catch (error) {
        console.error(`Failed to send push notification to subscription ${subscription.id}:`, error)
        
        // If subscription is invalid/expired, mark it as inactive
        if (error.statusCode === 404 || error.statusCode === 410) {
          await subscription.update({ isActive: false })
          console.log(`Marked subscription ${subscription.id} as inactive`)
        }
        
        return { success: false, subscriptionId: subscription.id, error: error.message }
      }
    })

    const results = await Promise.all(sendPromises)
    const successful = results.filter(r => r.success).length

    return {
      success: true,
      message: `Sent to ${successful}/${subscriptions.length} devices`,
      sentCount: successful,
      totalSubscriptions: subscriptions.length
    }
  } catch (error) {
    console.error('Error sending push notifications to admins:', error)
    return {
      success: false,
      message: error.message,
      sentCount: 0,
      totalSubscriptions: 0
    }
  }
}

/**
 * Subscribe admin to push notifications
 * @param {string} adminId - Admin ID
 * @param {Object} subscription - Web Push subscription object
 * @param {Object} deviceInfo - Device information
 * @returns {Promise<Object>} - Result object
 */
export const subscribeAdmin = async (adminId, subscription, deviceInfo = null) => {
  try {
    // Check if subscription already exists
    const existing = await PushSubscription.findOne({
      where: { endpoint: subscription.endpoint }
    })

    if (existing) {
      // Update existing subscription
      await existing.update({
        adminId,
        keys: subscription.keys,
        deviceInfo,
        isActive: true
      })
      return { success: true, message: 'Subscription updated', subscription: existing }
    }

    // Create new subscription
    const newSubscription = await PushSubscription.create({
      adminId,
      endpoint: subscription.endpoint,
      keys: subscription.keys,
      deviceInfo,
      isActive: true
    })

    return { success: true, message: 'Subscribed successfully', subscription: newSubscription }
  } catch (error) {
    console.error('Error subscribing admin:', error)
    return { success: false, message: error.message }
  }
}

/**
 * Unsubscribe admin from push notifications
 * @param {string} adminId - Admin ID
 * @param {string} endpoint - Subscription endpoint
 * @returns {Promise<Object>} - Result object
 */
export const unsubscribeAdmin = async (adminId, endpoint) => {
  try {
    const subscription = await PushSubscription.findOne({
      where: { adminId, endpoint }
    })

    if (!subscription) {
      return { success: false, message: 'Subscription not found' }
    }

    await subscription.update({ isActive: false })
    return { success: true, message: 'Unsubscribed successfully' }
  } catch (error) {
    console.error('Error unsubscribing admin:', error)
    return { success: false, message: error.message }
  }
}

/**
 * Get admin's active subscriptions
 * @param {string} adminId - Admin ID
 * @returns {Promise<Object>} - Result object with subscriptions
 */
export const getAdminSubscriptions = async (adminId) => {
  try {
    const subscriptions = await PushSubscription.findAll({
      where: { adminId, isActive: true },
      attributes: ['id', 'endpoint', 'deviceInfo', 'createdAt']
    })

    return { success: true, subscriptions }
  } catch (error) {
    console.error('Error getting admin subscriptions:', error)
    return { success: false, message: error.message, subscriptions: [] }
  }
}

/**
 * Get VAPID public key for frontend
 * @returns {string} - Public key
 */
export const getVapidPublicKey = () => {
  return vapidKeys.publicKey
}

export default {
  sendPushNotificationToAdmins,
  subscribeAdmin,
  unsubscribeAdmin,
  getAdminSubscriptions,
  getVapidPublicKey
}