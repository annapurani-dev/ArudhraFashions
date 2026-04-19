import express from 'express'
import User from '../models/User.js'
import { protect } from '../middleware/auth.js'
import crypto from 'crypto'

const router = express.Router()

// Razorpay configuration
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET

// @route   GET /api/payment-methods
// @desc    Get user payment methods
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id)
    res.json(user.paymentMethods || [])
  } catch (error) {
    console.error('Get payment methods error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   POST /api/payment-methods/razorpay/order
// @desc    Create Razorpay order for payment method tokenization
// @access  Private
router.post('/razorpay/order', protect, async (req, res) => {
  try {
    const { amount, currency, receipt } = req.body

    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      return res.status(500).json({ message: 'Razorpay configuration missing' })
    }

    // Create order using Razorpay API
    const orderData = {
      amount: amount * 100, // Convert to paise
      currency: currency || 'INR',
      receipt: receipt || `pm_${Date.now()}`,
      payment_capture: 1
    }

    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64')}`
      },
      body: JSON.stringify(orderData)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.description || 'Failed to create Razorpay order')
    }

    const order = await response.json()
    res.json({ orderId: order.id, amount: order.amount, currency: order.currency })
  } catch (error) {
    console.error('Create Razorpay order error:', error)
    res.status(500).json({ message: error.message || 'Server error' })
  }
})

// @route   POST /api/payment-methods/razorpay/verify
// @desc    Verify Razorpay payment and save payment method
// @access  Private
router.post('/razorpay/verify', protect, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, cardName } = req.body

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: 'Missing payment verification data' })
    }

    // Verify signature
    const text = `${razorpay_order_id}|${razorpay_payment_id}`
    const generatedSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(text)
      .digest('hex')

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ message: 'Invalid payment signature' })
    }

    // Fetch payment details from Razorpay
    const paymentResponse = await fetch(`https://api.razorpay.com/v1/payments/${razorpay_payment_id}`, {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64')}`
      }
    })

    if (!paymentResponse.ok) {
      throw new Error('Failed to fetch payment details')
    }

    const paymentDetails = await paymentResponse.json()
    
    // Extract card details from payment method
    const cardDetails = paymentDetails.card || {}
    const last4 = cardDetails.last4 || '****'
    const expMonth = cardDetails.expiry_month || '**'
    const expYear = cardDetails.expiry_year || '**'
    const network = cardDetails.network || 'Card'

    const user = await User.findByPk(req.user.id)
    
    // Create new array instead of mutating
    const existingPaymentMethods = Array.isArray(user.paymentMethods) ? [...user.paymentMethods] : []
    const newPaymentMethod = {
      id: `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      razorpayPaymentId: razorpay_payment_id,
      razorpayOrderId: razorpay_order_id,
      last4,
      expMonth: String(expMonth).padStart(2, '0'),
      expYear: String(expYear).slice(-2),
      cardName: cardName || 'Cardholder',
      network,
      method: 'card',
      savedAt: new Date().toISOString()
    }

    existingPaymentMethods.push(newPaymentMethod)
    
    // Use update method for JSONB fields
    await user.update(
      { paymentMethods: existingPaymentMethods },
      { fields: ['paymentMethods'] }
    )

    // Reload user to get fresh data
    await user.reload()

    res.status(201).json(user.paymentMethods || [])
  } catch (error) {
    console.error('Verify Razorpay payment error:', error)
    res.status(500).json({ message: error.message || 'Server error' })
  }
})

// @route   POST /api/payment-methods
// @desc    Add new payment method (legacy support)
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { razorpayPaymentId, razorpayOrderId, razorpaySignature, cardName, method } = req.body

    // If Razorpay data is provided, verify and save
    if (razorpayPaymentId && razorpayOrderId && razorpaySignature) {
      // Verify signature
      const text = `${razorpayOrderId}|${razorpayPaymentId}`
      const generatedSignature = crypto
        .createHmac('sha256', RAZORPAY_KEY_SECRET)
        .update(text)
        .digest('hex')

      if (generatedSignature !== razorpaySignature) {
        return res.status(400).json({ message: 'Invalid payment signature' })
      }

      // Fetch payment details from Razorpay
      const paymentResponse = await fetch(`https://api.razorpay.com/v1/payments/${razorpayPaymentId}`, {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64')}`
        }
      })

      if (!paymentResponse.ok) {
        throw new Error('Failed to fetch payment details')
      }

      const paymentDetails = await paymentResponse.json()
      const cardDetails = paymentDetails.card || {}
      
      const user = await User.findByPk(req.user.id)
      const existingPaymentMethods = Array.isArray(user.paymentMethods) ? [...user.paymentMethods] : []
      
      const newPaymentMethod = {
        id: `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        razorpayPaymentId,
        razorpayOrderId,
        last4: cardDetails.last4 || '****',
        expMonth: String(cardDetails.expiry_month || '**').padStart(2, '0'),
        expYear: String(cardDetails.expiry_year || '**').slice(-2),
        cardName: cardName || 'Cardholder',
        network: cardDetails.network || 'Card',
        method: method || 'card',
        savedAt: new Date().toISOString()
      }

      existingPaymentMethods.push(newPaymentMethod)
      
      await user.update(
        { paymentMethods: existingPaymentMethods },
        { fields: ['paymentMethods'] }
      )

      await user.reload()
      return res.status(201).json(user.paymentMethods || [])
    }

    // Handle UPI, Net Banking, and Wallet preferences
    const { upiId, bank, walletProvider } = req.body
    
    if (method === 'upi' && !upiId) {
      return res.status(400).json({ message: 'Please provide UPI ID' })
    }
    if (method === 'netbanking' && !bank) {
      return res.status(400).json({ message: 'Please select a bank' })
    }
    if (method === 'wallet' && !walletProvider) {
      return res.status(400).json({ message: 'Please select a wallet provider' })
    }

      const user = await User.findByPk(req.user.id)
      const existingPaymentMethods = Array.isArray(user.paymentMethods) ? [...user.paymentMethods] : []
      
      const newPaymentMethod = {
        id: `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        method: method || 'card',
        ...(method === 'upi' && { upiId }),
        ...(method === 'netbanking' && { bank }),
        ...(method === 'wallet' && { walletProvider }),
        savedAt: new Date().toISOString()
      }

      existingPaymentMethods.push(newPaymentMethod)
      
      await user.update(
        { paymentMethods: existingPaymentMethods },
        { fields: ['paymentMethods'] }
      )

      await user.reload()
      res.status(201).json(user.paymentMethods || [])
  } catch (error) {
    console.error('Add payment method error:', error)
    res.status(500).json({ message: error.message || 'Server error' })
  }
})

// @route   PUT /api/payment-methods/:id
// @desc    Update payment method
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const { method, upiId, bank, walletProvider, cardName } = req.body
    const user = await User.findByPk(req.user.id)
    
    const existingPaymentMethods = Array.isArray(user.paymentMethods) ? [...user.paymentMethods] : []
    const paymentIndex = existingPaymentMethods.findIndex(
      pm => pm.id === req.params.id
    )

    if (paymentIndex === -1) {
      return res.status(404).json({ message: 'Payment method not found' })
    }

    // Validate based on method type
    if (method === 'upi' && !upiId) {
      return res.status(400).json({ message: 'Please provide UPI ID' })
    }
    if (method === 'netbanking' && !bank) {
      return res.status(400).json({ message: 'Please select a bank' })
    }
    if (method === 'wallet' && !walletProvider) {
      return res.status(400).json({ message: 'Please select a wallet provider' })
    }

    // Update payment method
    const updatedPaymentMethod = {
      ...existingPaymentMethods[paymentIndex],
      ...(method && { method }),
      ...(method === 'upi' && { upiId }),
      ...(method === 'netbanking' && { bank }),
      ...(method === 'wallet' && { walletProvider }),
      ...(cardName && { cardName }),
      updatedAt: new Date().toISOString()
    }

    // Remove fields that don't apply to the new method type
    if (method === 'upi') {
      delete updatedPaymentMethod.last4
      delete updatedPaymentMethod.expMonth
      delete updatedPaymentMethod.expYear
      delete updatedPaymentMethod.network
      delete updatedPaymentMethod.bank
      delete updatedPaymentMethod.walletProvider
    } else if (method === 'netbanking') {
      delete updatedPaymentMethod.last4
      delete updatedPaymentMethod.expMonth
      delete updatedPaymentMethod.expYear
      delete updatedPaymentMethod.network
      delete updatedPaymentMethod.upiId
      delete updatedPaymentMethod.walletProvider
    } else if (method === 'wallet') {
      delete updatedPaymentMethod.last4
      delete updatedPaymentMethod.expMonth
      delete updatedPaymentMethod.expYear
      delete updatedPaymentMethod.network
      delete updatedPaymentMethod.upiId
      delete updatedPaymentMethod.bank
    }

    existingPaymentMethods[paymentIndex] = updatedPaymentMethod
    
    await user.update(
      { paymentMethods: existingPaymentMethods },
      { fields: ['paymentMethods'] }
    )
    
    await user.reload()
    
    res.json(user.paymentMethods || [])
  } catch (error) {
    console.error('Update payment method error:', error)
    res.status(500).json({ message: error.message || 'Server error' })
  }
})

// @route   DELETE /api/payment-methods/:id
// @desc    Delete payment method
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id)
    
    const existingPaymentMethods = Array.isArray(user.paymentMethods) ? [...user.paymentMethods] : []
    const updatedPaymentMethods = existingPaymentMethods.filter(
      method => method.id !== req.params.id
    )
    
    await user.update(
      { paymentMethods: updatedPaymentMethods },
      { fields: ['paymentMethods'] }
    )
    
    await user.reload()
    
    res.json({ message: 'Payment method deleted', paymentMethods: user.paymentMethods || [] })
  } catch (error) {
    console.error('Delete payment method error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

export default router
