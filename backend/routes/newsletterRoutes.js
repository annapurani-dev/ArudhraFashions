import express from 'express'
import { Op } from 'sequelize'
import NewsletterSubscriber from '../models/NewsletterSubscriber.js'
import User from '../models/User.js'
import { adminProtect } from '../middleware/adminAuth.js'
import { protect } from '../middleware/auth.js'
import { sendEmail } from '../services/emailService.js'

const router = express.Router()

// @route   POST /api/newsletter/subscribe
// @desc    Subscribe to newsletter
// @access  Public
router.post('/subscribe', async (req, res) => {
  try {
    const { email, name } = req.body

    if (!email) {
      return res.status(400).json({ message: 'Email is required' })
    }

    const [subscriber, created] = await NewsletterSubscriber.findOrCreate({
      where: { email: email.toLowerCase() },
      defaults: {
        email: email.toLowerCase(),
        name: name || null,
        status: 'active'
      }
    })

    if (!created && subscriber.status === 'active') {
      return res.status(400).json({ message: 'Email already subscribed' })
    }

    if (!created && subscriber.status === 'unsubscribed') {
      subscriber.status = 'active'
      subscriber.subscribedAt = new Date()
      subscriber.unsubscribedAt = null
      await subscriber.save()
    }

    res.json({ 
      message: 'Successfully subscribed to newsletter',
      subscriber 
    })
  } catch (error) {
    console.error('Subscribe newsletter error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   POST /api/newsletter/unsubscribe
// @desc    Unsubscribe from newsletter
// @access  Public
router.post('/unsubscribe', async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ message: 'Email is required' })
    }

    const subscriber = await NewsletterSubscriber.findOne({
      where: { email: email.toLowerCase() }
    })

    if (!subscriber) {
      return res.status(404).json({ message: 'Email not found' })
    }

    subscriber.status = 'unsubscribed'
    subscriber.unsubscribedAt = new Date()
    await subscriber.save()

    res.json({ message: 'Successfully unsubscribed' })
  } catch (error) {
    console.error('Unsubscribe newsletter error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/newsletter/subscribers
// @desc    Get all subscribers (admin)
// @access  Admin
router.get('/subscribers', adminProtect, async (req, res) => {
  try {
    const { search, status, page = 1, limit = 20 } = req.query
    const where = {}

    if (search) {
      where[Op.or] = [
        { email: { [Op.iLike]: `%${search}%` } },
        { name: { [Op.iLike]: `%${search}%` } }
      ]
    }

    if (status) {
      where.status = status
    }

    const offset = (page - 1) * limit
    const { count, rows: subscribers } = await NewsletterSubscriber.findAndCountAll({
      where,
      order: [['subscribedAt', 'DESC']],
      limit: Number(limit),
      offset: Number(offset)
    })

    res.json({
      subscribers,
      page: Number(page),
      pages: Math.ceil(count / limit),
      total: count
    })
  } catch (error) {
    console.error('Get admin subscribers error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   POST /api/newsletter/send
// @desc    Send newsletter (admin)
// @access  Admin
router.post('/send', adminProtect, async (req, res) => {
  try {
    const { subject, content } = req.body

    if (!subject || !content) {
      return res.status(400).json({ message: 'Subject and content are required' })
    }

    // Get active subscribers
    const subscribers = await NewsletterSubscriber.findAll({
      where: { status: 'active' }
    })

    if (subscribers.length === 0) {
      return res.status(400).json({ message: 'No active newsletter subscribers found' })
    }

    const sendResults = await Promise.allSettled(
      subscribers.map(subscriber => {
        const html = `
          <div style="font-family: Arial, Helvetica, sans-serif; line-height: 1.6; color: #1f2933;">
            <p>Dear ${subscriber.name || 'fashion enthusiast'},</p>
            ${content}
            <p style="margin-top: 1.5rem; font-size: 0.9rem; color: #475569;">
              You are receiving this email because you subscribed to the Arudhra Fashions newsletter.
              If you wish to unsubscribe, please reply to this email with “unsubscribe.”
            </p>
          </div>
        `
        return sendEmail({
          to: subscriber.email,
          subject,
          html
        })
      })
    )

    const successful = []
    const failed = []
    sendResults.forEach((result, index) => {
      const email = subscribers[index].email
      if (result.status === 'fulfilled' && result.value?.success) {
        successful.push(email)
      } else {
        failed.push({
          email,
          error: (result.value && result.value.message) || (result.reason && result.reason.message) || 'Unknown error'
        })
      }
    })

    res.json({
      message: `Newsletter send job completed`,
      requested: subscribers.length,
      sent: successful.length,
      failed: failed.length,
      failedDetails: failed,
      successful: successful.slice(0, 10) // limit payload
    })
  } catch (error) {
    console.error('Send newsletter error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   DELETE /api/newsletter/subscribers/:id
// @desc    Remove subscriber (admin)
// @access  Admin
router.delete('/subscribers/:id', adminProtect, async (req, res) => {
  try {
    const subscriber = await NewsletterSubscriber.findByPk(req.params.id)
    if (!subscriber) {
      return res.status(404).json({ message: 'Subscriber not found' })
    }

    await subscriber.destroy()
    res.json({ message: 'Subscriber removed' })
  } catch (error) {
    console.error('Remove subscriber error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/newsletter/status
// @desc    Get newsletter subscription status for logged-in user
// @access  Private
router.get('/status', protect, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id)
    if (!user || !user.email) {
      return res.json({ subscribed: false, message: 'No email address on account' })
    }

    const subscriber = await NewsletterSubscriber.findOne({
      where: { email: user.email.toLowerCase() }
    })

    res.json({
      subscribed: subscriber?.status === 'active' || false,
      email: user.email
    })
  } catch (error) {
    console.error('Get newsletter status error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   POST /api/newsletter/subscribe-user
// @desc    Subscribe logged-in user to newsletter
// @access  Private
router.post('/subscribe-user', protect, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    if (!user.email) {
      return res.status(400).json({ message: 'Please add an email address to your account first' })
    }

    const [subscriber, created] = await NewsletterSubscriber.findOrCreate({
      where: { email: user.email.toLowerCase() },
      defaults: {
        email: user.email.toLowerCase(),
        name: user.name || null,
        status: 'active'
      }
    })

    if (!created && subscriber.status === 'active') {
      return res.json({ 
        message: 'Already subscribed to newsletter',
        subscriber 
      })
    }

    if (!created && subscriber.status === 'unsubscribed') {
      subscriber.status = 'active'
      subscriber.subscribedAt = new Date()
      subscriber.unsubscribedAt = null
      await subscriber.save()
    }

    // Update user preferences
    const preferences = user.preferences || {
      emailNotifications: true,
      smsNotifications: false,
      newsletter: false
    }
    preferences.newsletter = true
    await user.update({ preferences }, { fields: ['preferences'] })

    res.json({ 
      message: 'Successfully subscribed to newsletter',
      subscriber 
    })
  } catch (error) {
    console.error('Subscribe user newsletter error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   POST /api/newsletter/unsubscribe-user
// @desc    Unsubscribe logged-in user from newsletter
// @access  Private
router.post('/unsubscribe-user', protect, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id)
    if (!user || !user.email) {
      return res.status(400).json({ message: 'No email address on account' })
    }

    const subscriber = await NewsletterSubscriber.findOne({
      where: { email: user.email.toLowerCase() }
    })

    if (!subscriber) {
      return res.status(404).json({ message: 'Not subscribed to newsletter' })
    }

    subscriber.status = 'unsubscribed'
    subscriber.unsubscribedAt = new Date()
    await subscriber.save()

    // Update user preferences
    const preferences = user.preferences || {
      emailNotifications: true,
      smsNotifications: false,
      newsletter: false
    }
    preferences.newsletter = false
    await user.update({ preferences }, { fields: ['preferences'] })

    res.json({ message: 'Successfully unsubscribed from newsletter' })
  } catch (error) {
    console.error('Unsubscribe user newsletter error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

export default router

