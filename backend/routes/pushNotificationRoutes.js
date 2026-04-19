import express from 'express'
import { adminProtect } from '../middleware/adminAuth.js'
import { 
  subscribeAdmin, 
  unsubscribeAdmin, 
  getAdminSubscriptions,
  getVapidPublicKey
} from '../services/pushNotificationService.js'

const router = express.Router()

// All routes require admin authentication
router.use(adminProtect)

// @route   GET /api/admin/push/vapid-key
// @desc    Get VAPID public key for frontend
// @access  Admin
router.get('/vapid-key', (req, res) => {
  try {
    const publicKey = getVapidPublicKey()
    res.json({ publicKey })
  } catch (error) {
    console.error('Get VAPID key error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   POST /api/admin/push/subscribe
// @desc    Subscribe to push notifications
// @access  Admin
router.post('/subscribe', async (req, res) => {
  try {
    const { subscription, deviceInfo } = req.body
    
    if (!subscription) {
      return res.status(400).json({ message: 'Subscription data is required' })
    }

    if (!subscription.endpoint || !subscription.keys) {
      return res.status(400).json({ message: 'Invalid subscription format' })
    }

    const result = await subscribeAdmin(req.admin.id, subscription, deviceInfo)
    
    if (result.success) {
      res.json({ message: result.message, subscription: result.subscription })
    } else {
      res.status(400).json({ message: result.message })
    }
  } catch (error) {
    console.error('Subscribe push notification error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   POST /api/admin/push/unsubscribe
// @desc    Unsubscribe from push notifications
// @access  Admin
router.post('/unsubscribe', async (req, res) => {
  try {
    const { endpoint } = req.body
    
    if (!endpoint) {
      return res.status(400).json({ message: 'Endpoint is required' })
    }

    const result = await unsubscribeAdmin(req.admin.id, endpoint)
    
    if (result.success) {
      res.json({ message: result.message })
    } else {
      res.status(400).json({ message: result.message })
    }
  } catch (error) {
    console.error('Unsubscribe push notification error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/admin/push/subscriptions
// @desc    Get admin's active subscriptions
// @access  Admin
router.get('/subscriptions', async (req, res) => {
  try {
    const result = await getAdminSubscriptions(req.admin.id)
    
    if (result.success) {
      res.json({ subscriptions: result.subscriptions })
    } else {
      res.status(500).json({ message: result.message })
    }
  } catch (error) {
    console.error('Get subscriptions error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

export default router