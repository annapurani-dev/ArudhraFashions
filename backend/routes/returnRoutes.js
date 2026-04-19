import express from 'express'
import { Op } from 'sequelize'
import Return from '../models/Return.js'
import Order from '../models/Order.js'
import User from '../models/User.js'
import { adminProtect } from '../middleware/adminAuth.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

// @route   GET /api/returns
// @desc    Get user return requests
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const returns = await Return.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']]
    })

    res.json(returns)
  } catch (error) {
    console.error('Get returns error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   POST /api/returns
// @desc    Create return request
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { orderId, productId, productName, reason, amount } = req.body

    if (!orderId || !productId || !productName || !reason || !amount) {
      return res.status(400).json({ message: 'All fields are required' })
    }

    // Verify order belongs to user
    const order = await Order.findOne({
      where: {
        orderId,
        userId: req.user.id
      }
    })

    if (!order) {
      return res.status(404).json({ message: 'Order not found' })
    }

    // Check if order is delivered
    if (order.status !== 'Delivered') {
      return res.status(400).json({ 
        message: 'Return requests can only be made for delivered orders' 
      })
    }

    // Check 24-hour return window
    let deliveredDate = null
    
    // Find when order was marked as "Delivered" from statusHistory
    if (order.statusHistory && Array.isArray(order.statusHistory)) {
      const deliveredStatus = order.statusHistory.find(
        entry => entry.status === 'Delivered'
      )
      if (deliveredStatus && deliveredStatus.date) {
        deliveredDate = new Date(deliveredStatus.date)
      }
    }
    
    // If not found in statusHistory, use updatedAt as fallback (when status was last changed)
    // But we need to check if status is actually "Delivered"
    if (!deliveredDate) {
      // If status is "Delivered" but no history entry, use updatedAt
      // This is a fallback - ideally statusHistory should always have the entry
      deliveredDate = order.updatedAt
    }

    // Calculate hours since delivery
    const now = new Date()
    const hoursSinceDelivery = (now - deliveredDate) / (1000 * 60 * 60)

    if (hoursSinceDelivery > 24) {
      return res.status(400).json({ 
        message: 'Return requests must be submitted within 24 hours of delivery. The 24-hour window has expired.' 
      })
    }

    // Generate return ID
    const returnId = `RET-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`

    const returnRequest = await Return.create({
      returnId,
      orderId,
      userId: req.user.id,
      productId,
      productName,
      reason,
      amount: parseFloat(amount),
      status: 'pending'
    })

    res.status(201).json(returnRequest)
  } catch (error) {
    console.error('Create return error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/returns/:id
// @desc    Get return details
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const returnRequest = await Return.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    })

    if (!returnRequest) {
      return res.status(404).json({ message: 'Return request not found' })
    }

    res.json(returnRequest)
  } catch (error) {
    console.error('Get return error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/admin/returns
// @desc    Get all returns (admin)
// @access  Admin
router.get('/all', adminProtect, async (req, res) => {
  try {
    const { search, status, page = 1, limit = 20 } = req.query
    const where = {}

    if (search) {
      where[Op.or] = [
        { returnId: { [Op.iLike]: `%${search}%` } },
        { orderId: { [Op.iLike]: `%${search}%` } }
      ]
    }

    if (status) {
      where.status = status
    }

    const offset = (page - 1) * limit
    const { count, rows: returns } = await Return.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
      offset: Number(offset)
    })

    // Format returns with customer name from User model
    const formattedReturns = await Promise.all(returns.map(async (returnItem) => {
      const user = await User.findByPk(returnItem.userId, {
        attributes: ['name', 'email', 'mobile']
      })
      return {
        id: returnItem.id,
        returnId: returnItem.returnId,
        orderId: returnItem.orderId,
        customerName: user?.name || 'Unknown Customer',
        customerEmail: user?.email || '',
        productId: returnItem.productId,
        productName: returnItem.productName,
        reason: returnItem.reason,
        status: returnItem.status,
        amount: returnItem.amount,
        refundAmount: returnItem.amount,
        quantity: 1, // Default quantity, can be added to model if needed
        refundStatus: returnItem.status === 'refunded' ? 'refunded' : 'pending',
        createdAt: returnItem.createdAt,
        updatedAt: returnItem.updatedAt,
        approvedAt: returnItem.approvedAt,
        refundedAt: returnItem.refundedAt
      }
    }))

    res.json({
      returns: formattedReturns,
      page: Number(page),
      pages: Math.ceil(count / limit),
      total: count
    })
  } catch (error) {
    console.error('Get admin returns error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/admin/returns/details/:id
// @desc    Get return details (admin)
// @access  Admin
router.get('/details/:id', adminProtect, async (req, res) => {
  try {
    const returnRequest = await Return.findByPk(req.params.id)

    if (!returnRequest) {
      return res.status(404).json({ message: 'Return request not found' })
    }

    // Get user details
    const user = await User.findByPk(returnRequest.userId, {
      attributes: ['name', 'email', 'mobile']
    })

    // Format response
    const formattedReturn = {
      id: returnRequest.id,
      returnId: returnRequest.returnId,
      orderId: returnRequest.orderId,
      customerName: user?.name || 'Unknown Customer',
      customerEmail: user?.email || '',
      productId: returnRequest.productId,
      productName: returnRequest.productName,
      reason: returnRequest.reason,
      description: returnRequest.reason, // Using reason as description
      status: returnRequest.status,
      amount: returnRequest.amount,
      refundAmount: returnRequest.amount,
      quantity: 1,
      refundStatus: returnRequest.status === 'refunded' ? 'refunded' : 'pending',
      createdAt: returnRequest.createdAt,
      updatedAt: returnRequest.updatedAt,
      approvedAt: returnRequest.approvedAt,
      refundedAt: returnRequest.refundedAt
    }

    res.json(formattedReturn)
  } catch (error) {
    console.error('Get admin return error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   PUT /api/admin/returns/:id/status
// @desc    Update return status (admin)
// @access  Admin
router.put('/status/:id', adminProtect, async (req, res) => {
  try {
    const { status } = req.body
    const validStatuses = ['pending', 'approved', 'rejected', 'refunded']

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' })
    }

    const returnRequest = await Return.findByPk(req.params.id)
    if (!returnRequest) {
      return res.status(404).json({ message: 'Return request not found' })
    }

    returnRequest.status = status
    
    if (status === 'approved') {
      returnRequest.approvedAt = new Date()
    } else if (status === 'refunded') {
      returnRequest.refundedAt = new Date()
    }

    await returnRequest.save()

    res.json(returnRequest)
  } catch (error) {
    console.error('Update return status error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   POST /api/admin/returns/:id/refund
// @desc    Process refund (admin)
// @access  Admin
router.post('/refund/:id', adminProtect, async (req, res) => {
  try {
    const returnRequest = await Return.findByPk(req.params.id)
    if (!returnRequest) {
      return res.status(404).json({ message: 'Return request not found' })
    }

    if (returnRequest.status !== 'approved') {
      return res.status(400).json({ message: 'Return must be approved before refund' })
    }

    returnRequest.status = 'refunded'
    returnRequest.refundedAt = new Date()
    await returnRequest.save()

    res.json({ 
      message: 'Refund processed successfully',
      return: returnRequest 
    })
  } catch (error) {
    console.error('Process refund error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

export default router

