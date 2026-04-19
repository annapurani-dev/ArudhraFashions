import express from 'express'
import { Op } from 'sequelize'
import Product from '../models/Product.js'
import Order from '../models/Order.js'
import User from '../models/User.js'
import Return from '../models/Return.js'
import InventoryLog from '../models/InventoryLog.js'
import CoinTransaction from '../models/CoinTransaction.js'
import Setting from '../models/Setting.js'
import { adminProtect } from '../middleware/adminAuth.js'
import { generateInvoicePDF } from '../utils/invoiceGenerator.js'
import { sendEmailWithPDF } from '../services/emailService.js'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const router = express.Router()

// All admin routes require admin authentication
router.use(adminProtect)

// Helper function to build WHERE condition for order lookup
// Handles UUID vs orderId string to avoid PostgreSQL UUID type errors
const buildOrderWhereCondition = (idParam) => {
  // Check if the parameter is a valid UUID format
  // UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx (8-4-4-4-12 hex characters)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  const isUUID = uuidRegex.test(idParam)
  
  // Only check UUID id field if input is a valid UUID
  return isUUID
    ? {
        [Op.or]: [
          { id: idParam },
          { orderId: idParam },
          { tracking: idParam }
        ]
      }
    : {
        [Op.or]: [
          { orderId: idParam },
          { tracking: idParam }
        ]
      }
}

// @route   GET /api/admin/stats
// @desc    Get dashboard statistics
// @access  Admin
router.get('/stats', async (req, res) => {
  try {
    const totalProducts = await Product.count({ where: { isActive: true } })
    const totalOrders = await Order.count()
    const totalCustomers = await User.count()
    
    // Calculate total revenue
    const orders = await Order.findAll({ 
      where: { status: { [Op.ne]: 'Cancelled' } } 
    })
    const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total || 0), 0)
    
    // Calculate recent changes (mock for now - can be enhanced with date comparisons)
    const revenueChange = 12.5 // Can calculate from previous period
    const ordersChange = 8.3

    res.json({
      totalRevenue,
      totalOrders,
      totalCustomers,
      totalProducts,
      revenueChange,
      ordersChange
    })
  } catch (error) {
    console.error('Get admin stats error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/admin/recent-orders
// @desc    Get recent orders
// @access  Admin
router.get('/recent-orders', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10
    const orders = await Order.findAll({
      include: [{
        association: 'user',
        attributes: ['name', 'mobile', 'email']
      }],
      order: [['createdAt', 'DESC']],
      limit
    })

    const formattedOrders = orders.map(order => ({
      id: order.orderId,
      customer: order.user?.name || order.shippingAddress?.name || 'Guest',
      email: order.user?.email || order.shippingAddress?.email || '',
      mobile: order.user?.mobile || order.shippingAddress?.mobile || '',
      amount: order.total,
      status: order.status,
      date: order.createdAt,
      items: order.items?.length || 0
    }))

    res.json(formattedOrders)
  } catch (error) {
    console.error('Get recent orders error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/admin/top-products
// @desc    Get top selling products
// @access  Admin
router.get('/top-products', async (req, res) => {
  try {
    // Aggregate products by sales (from orders)
    const orders = await Order.findAll({ 
      where: { status: { [Op.ne]: 'Cancelled' } } 
    })
    
    const productSales = {}
    
    orders.forEach(order => {
      const items = order.items || []
      items.forEach(item => {
        const productId = item.product
        if (productId) {
          if (!productSales[productId]) {
            productSales[productId] = {
              productId,
              sales: 0,
              revenue: 0
            }
          }
          productSales[productId].sales += item.quantity || 0
          productSales[productId].revenue += parseFloat(item.price || 0) * (item.quantity || 0)
        }
      })
    })

    // Get product details
    const productIds = Object.keys(productSales)
    const products = productIds.length > 0 ? await Product.findAll({
      where: { id: { [Op.in]: productIds } }
    }) : []

    const productMap = {}
    products.forEach(p => {
      productMap[p.id] = p
    })

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 10)
      .map(item => ({
        name: productMap[item.productId]?.name || 'Unknown',
        sales: item.sales,
        revenue: item.revenue
      }))

    res.json(topProducts)
  } catch (error) {
    console.error('Get top products error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/admin/revenue-chart
// @desc    Get revenue chart data for selected period
// @access  Admin
router.get('/revenue-chart', async (req, res) => {
  try {
    const { period = '7days' } = req.query
    
    // Calculate date range based on period
    const now = new Date()
    let startDate = new Date()
    
    switch (period) {
      case '7days':
        startDate.setDate(now.getDate() - 7)
        break
      case '30days':
        startDate.setDate(now.getDate() - 30)
        break
      case '3months':
        startDate.setMonth(now.getMonth() - 3)
        break
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1)
        break
      default:
        startDate.setDate(now.getDate() - 7)
    }
    
    // Get orders in the date range
    const orders = await Order.findAll({
      where: {
        status: { [Op.ne]: 'Cancelled' },
        createdAt: {
          [Op.gte]: startDate,
          [Op.lte]: now
        }
      },
      order: [['createdAt', 'ASC']]
    })
    
    // Group revenue by day
    const revenueByDay = {}
    
    orders.forEach(order => {
      const orderDate = new Date(order.createdAt)
      const dateKey = orderDate.toISOString().split('T')[0] // YYYY-MM-DD
      
      if (!revenueByDay[dateKey]) {
        revenueByDay[dateKey] = 0
      }
      revenueByDay[dateKey] += parseFloat(order.total || 0)
    })
    
    // Convert to array format for chart
    const chartData = []
    const currentDate = new Date(startDate)
    
    while (currentDate <= now) {
      const dateKey = currentDate.toISOString().split('T')[0]
      const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'short' })
      const dayNumber = currentDate.getDate()
      
      chartData.push({
        date: dateKey,
        day: dayName,
        dayNumber: dayNumber,
        revenue: revenueByDay[dateKey] || 0
      })
      
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    // Calculate max revenue for percentage calculation
    const maxRevenue = Math.max(...chartData.map(d => d.revenue), 1)
    
    // Add percentage for bar height
    const chartDataWithPercentages = chartData.map(item => ({
      ...item,
      percentage: maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0
    }))
    
    res.json({
      period,
      data: chartDataWithPercentages,
      totalRevenue: chartData.reduce((sum, item) => sum + item.revenue, 0)
    })
  } catch (error) {
    console.error('Get revenue chart error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/admin/order-status-breakdown
// @desc    Get order status breakdown for dashboard
// @access  Admin
router.get('/order-status-breakdown', async (req, res) => {
  try {
    const orders = await Order.findAll({
      attributes: ['status']
    })
    
    const statusCounts = {
      'Pending': 0,
      'Processing': 0,
      'Shipped': 0,
      'Delivered': 0,
      'Cancelled': 0,
      'Returned': 0
    }
    
    orders.forEach(order => {
      const status = order.status || 'Pending'
      if (statusCounts.hasOwnProperty(status)) {
        statusCounts[status]++
      } else {
        statusCounts['Pending']++
      }
    })
    
    const total = orders.length
    const breakdown = Object.keys(statusCounts).map(status => ({
      status,
      count: statusCounts[status],
      percentage: total > 0 ? ((statusCounts[status] / total) * 100).toFixed(1) : 0
    })).filter(item => item.count > 0)
    
    res.json({
      breakdown,
      total
    })
  } catch (error) {
    console.error('Get order status breakdown error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/admin/returns-summary
// @desc    Get returns and refunds summary for dashboard
// @access  Admin
router.get('/returns-summary', async (req, res) => {
  try {
    const returns = await Return.findAll({
      attributes: ['status', 'amount']
    })
    
    const totalReturns = returns.length
    const pendingReturns = returns.filter(r => r.status === 'pending' || r.status === 'approved').length
    const refundedReturns = returns.filter(r => r.status === 'refunded').length
    const totalRefundedAmount = returns
      .filter(r => r.status === 'refunded')
      .reduce((sum, r) => sum + parseFloat(r.amount || 0), 0)
    const pendingRefundAmount = returns
      .filter(r => r.status === 'pending' || r.status === 'approved')
      .reduce((sum, r) => sum + parseFloat(r.amount || 0), 0)
    
    res.json({
      totalReturns,
      pendingReturns,
      refundedReturns,
      totalRefundedAmount,
      pendingRefundAmount
    })
  } catch (error) {
    console.error('Get returns summary error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/admin/top-customers
// @desc    Get top customers by total spent
// @access  Admin
router.get('/top-customers', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5
    
    const users = await User.findAll({
      attributes: ['id', 'name', 'email', 'mobile']
    })
    
    const customerStats = await Promise.all(users.map(async (user) => {
      const orders = await Order.findAll({
        where: {
          userId: user.id,
          status: { [Op.ne]: 'Cancelled' }
        }
      })
      
      const totalSpent = orders.reduce((sum, order) => sum + parseFloat(order.total || 0), 0)
      const totalOrders = orders.length
      
      return {
        id: user.id,
        name: user.name || 'Guest',
        email: user.email || '',
        mobile: user.mobile || '',
        totalSpent,
        totalOrders
      }
    }))
    
    const topCustomers = customerStats
      .filter(customer => customer.totalSpent > 0)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, limit)
    
    res.json(topCustomers)
  } catch (error) {
    console.error('Get top customers error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/admin/products
// @desc    Get all products (admin view)
// @access  Admin
router.get('/products', async (req, res) => {
  try {
    const { search, status, page = 1, limit = 20 } = req.query
    const where = {}

    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } }
      ]
    }

    if (status === 'active') where.isActive = true
    if (status === 'inactive') where.isActive = false

    const offset = (page - 1) * limit
    const { count, rows: products } = await Product.findAndCountAll({
      where,
      include: [
        {
          association: 'category',
          required: false
        },
        {
          association: 'subcategory',
          required: false
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
      offset: Number(offset)
    })

    res.json({
      products,
      page: Number(page),
      pages: Math.ceil(count / limit),
      total: count
    })
  } catch (error) {
    console.error('Get admin products error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   POST /api/admin/products
// @desc    Create new product
// @access  Admin
router.post('/products', async (req, res) => {
  try {
    const productData = req.body
    console.log('Creating product with data:', productData)
    
    // Validate required fields
    if (!productData.name) {
      return res.status(400).json({ message: 'Product name is required' })
    }
    if (!productData.categoryId) {
      return res.status(400).json({ message: 'Category is required' })
    }
    if (!productData.subcategoryId) {
      return res.status(400).json({ message: 'Subcategory is required' })
    }

    if (!productData.price) {
      return res.status(400).json({ message: 'Product price is required' })
    }

    const product = await Product.create(productData)
    await product.reload({
      include: [
        {
          association: 'category',
          required: false
        },
        {
          association: 'subcategory',
          required: false
        }
      ]
    })
    
    // Create inventory log entry for initial stock
    try {
      await InventoryLog.create({
        productId: product.id,
        quantity: product.stockCount || 0,
        type: product.stockCount > 0 ? 'in' : 'adjustment',
        reason: product.stockCount > 0 ? 'Initial stock - Product created' : 'Product created with zero stock',
        createdBy: req.admin?.id
      })
      console.log('Inventory log created for new product:', product.id, 'Stock:', product.stockCount)
    } catch (logError) {
      // Log error but don't fail product creation
      console.error('Failed to create inventory log:', logError)
    }
    
    console.log('Product created successfully:', {
      id: product.id,
      name: product.name,
      categoryId: product.categoryId,
      subcategoryId: product.subcategoryId,
      isActive: product.isActive,
      category: product.category?.name,
      subcategory: product.subcategory?.name,
      stockCount: product.stockCount
    })
    res.status(201).json(product)
  } catch (error) {
    console.error('Create product error:', error)
    // Return more specific error messages
    if (error.name === 'SequelizeValidationError') {
      const messages = error.errors.map(e => e.message).join(', ')
      return res.status(400).json({ message: `Validation error: ${messages}` })
    }
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({ message: 'Invalid category or subcategory selected' })
    }
    res.status(500).json({ message: error.message || 'Server error' })
  }
})

// @route   GET /api/admin/products/:id
// @desc    Get single product (admin)
// @access  Admin
router.get('/products/:id', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [
        {
          association: 'category',
          required: false
        },
        {
          association: 'subcategory',
          required: false
        }
      ]
    })

    if (!product) {
      return res.status(404).json({ message: 'Product not found' })
    }

    res.json(product)
  } catch (error) {
    console.error('Get product error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   PUT /api/admin/products/:id
// @desc    Update product
// @access  Admin
router.put('/products/:id', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id)

    if (!product) {
      return res.status(404).json({ message: 'Product not found' })
    }

    await product.update(req.body)
    await product.reload({
      include: [
        {
          association: 'category',
          required: false
        },
        {
          association: 'subcategory',
          required: false
        }
      ]
    })

    res.json(product)
  } catch (error) {
    console.error('Update product error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   DELETE /api/admin/products/:id
// @desc    Delete product
// @access  Admin
router.delete('/products/:id', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id)

    if (!product) {
      return res.status(404).json({ message: 'Product not found' })
    }

    await product.destroy()

    res.json({ message: 'Product deleted' })
  } catch (error) {
    console.error('Delete product error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   PUT /api/admin/products/:id/status
// @desc    Toggle product status
// @access  Admin
router.put('/products/:id/status', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id)

    if (!product) {
      return res.status(404).json({ message: 'Product not found' })
    }

    product.isActive = !product.isActive
    await product.save()

    res.json(product)
  } catch (error) {
    console.error('Toggle product status error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/admin/orders
// @desc    Get all orders (admin view)
// @access  Admin
router.get('/orders', async (req, res) => {
  try {
    const { search, status, page = 1, limit = 20 } = req.query
    const where = {}

    if (search) {
      where[Op.or] = [
        { orderId: { [Op.iLike]: `%${search}%` } },
        { tracking: { [Op.iLike]: `%${search}%` } }
      ]
    }

    if (status) {
      where.status = status
    }

    const offset = (page - 1) * limit
    const { count, rows: orders } = await Order.findAndCountAll({
      where,
      include: [{
        association: 'user',
        attributes: ['name', 'mobile', 'email']
      }],
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
      offset: Number(offset)
    })

    const formattedOrders = orders.map(order => ({
      id: order.orderId,
      customer: order.user?.name || order.shippingAddress?.name || 'Guest',
      email: order.user?.email || order.shippingAddress?.email || '',
      mobile: order.user?.mobile || order.shippingAddress?.mobile || '',
      amount: order.total,
      status: order.status,
      date: order.createdAt,
      items: order.items?.length || 0,
      tracking: order.tracking,
      paymentMethod: order.payment?.method || (order.payment?.razorpayPaymentId ? 'online' : 'online'),
      paymentStatus: order.payment?.status || null,
      invoicePath: order.invoicePath || null
    }))

    res.json({
      orders: formattedOrders,
      page: Number(page),
      pages: Math.ceil(count / limit),
      total: count
    })
  } catch (error) {
    console.error('Get admin orders error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/admin/orders/:id
// @desc    Get order details
// @access  Admin
router.get('/orders/:id', async (req, res) => {
  try {
    const order = await Order.findOne({
      where: buildOrderWhereCondition(req.params.id),
      include: [{
        association: 'user'
      }]
    })

    if (!order) {
      return res.status(404).json({ message: 'Order not found' })
    }

    res.json(order)
  } catch (error) {
    console.error('Get admin order error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   PUT /api/admin/orders/:id/status
// @desc    Update order status
// @access  Admin
router.put('/orders/:id/status', async (req, res) => {
  try {
    const { status } = req.body
    const validStatuses = ['Processing', 'Shipped', 'Delivered', 'Cancelled', 'Returned']

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' })
    }

    const order = await Order.findOne({
      where: buildOrderWhereCondition(req.params.id)
    })

    if (!order) {
      return res.status(404).json({ message: 'Order not found' })
    }

    order.status = status
    const statusHistory = order.statusHistory || []
    statusHistory.push({
      status,
      date: new Date(),
      note: `Status updated to ${status}`
    })
    order.statusHistory = statusHistory

    await order.save()

    res.json(order)
  } catch (error) {
    console.error('Update order status error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   PUT /api/admin/orders/:id/payment-status
// @desc    Update payment status (e.g., mark COD collected)
// @access  Admin
router.put('/orders/:id/payment-status', async (req, res) => {
  try {
    const { paymentStatus, note, method } = req.body // e.g. 'pending'|'collected'|'paid'|'failed'
    const order = await Order.findOne({
      where: buildOrderWhereCondition(req.params.id),
      include: [{ model: User, as: 'user' }]
    })

    if (!order) return res.status(404).json({ message: 'Order not found' })

    // normalize payment object
    const payment = { ...(order.payment || {}) }
    if (method) payment.method = method
    payment.status = paymentStatus
    order.payment = payment

    // update order status when payment confirmed
    if (paymentStatus === 'collected' || paymentStatus === 'paid') {
      order.status = 'Processing'
    }

    // append status history
    order.statusHistory = order.statusHistory || []
    order.statusHistory.push({
      status: order.status,
      date: new Date(),
      note: note || `Payment status updated to ${paymentStatus}`
    })

    await order.save()

    // On collected/paid: generate invoice + award coins + send email
    if (paymentStatus === 'collected' || paymentStatus === 'paid') {
      const user = order.user || { name: order.shippingAddress?.name, email: order.shippingAddress?.email, mobile: order.shippingAddress?.mobile }

      // generate invoice
      try {
        const invoicePath = await generateInvoicePDF(order, user)
        if (invoicePath) {
          order.invoicePath = invoicePath
          await order.save()
        }
      } catch (invErr) {
        console.error('Invoice generation error on payment update:', invErr)
      }

      // award coins using fixed tier-based rules
      try {
        const { getCoinsForOrderTotal } = require('../utils/coinRules')
        const total = parseFloat(order.total || 0)
        if (total > 0 && order.userId) {
          const coinsToAward = getCoinsForOrderTotal(total)
          if (coinsToAward > 0) {
            const u = await User.findByPk(order.userId)
            if (u) {
              const newBalance = (u.coins || 0) + coinsToAward
              u.coins = newBalance
              await u.save()

              await CoinTransaction.create({
                userId: u.id,
                type: 'earned',
                amount: coinsToAward,
                balanceAfter: newBalance,
                description: `Earned from order ${order.orderId}`,
                orderId: order.orderId,
                metadata: { orderTotal: total, coinsEarned: coinsToAward }
              })
            }
          }
        }
      } catch (coinErr) {
        console.error('Error awarding coins on payment update:', coinErr)
      }

      // optionally email invoice
      try {
        if ((order.user && order.user.email) || order.shippingAddress?.email) {
          await sendEmailWithPDF({
            to: order.user?.email || order.shippingAddress?.email,
            subject: `Invoice ${order.invoiceId || order.orderId}`,
            html: `Please find attached your invoice for order ${order.orderId}.`,
            pdfPath: order.invoicePath,
            pdfName: `invoice-${order.orderId}.pdf`
          })
        }
      } catch (emailErr) {
        console.error('Failed to email invoice after payment update:', emailErr)
      }
    }

    res.json(order)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/admin/orders/:id/invoice
// @desc    Download invoice PDF (admin)
// @access  Admin
router.get('/orders/:id/invoice', async (req, res) => {
  try {
    const order = await Order.findOne({
      where: buildOrderWhereCondition(req.params.id),
      include: [{
        model: User,
        as: 'user',
        attributes: ['name', 'email', 'mobile']
      }]
    })

    if (!order) {
      return res.status(404).json({ message: 'Order not found' })
    }

    // Validate order has items
    if (!order.items || !Array.isArray(order.items) || order.items.length === 0) {
      return res.status(400).json({ message: 'Order has no items' })
    }

    // Generate invoice PDF
    const user = order.user || { name: order.shippingAddress?.name, email: order.shippingAddress?.email, mobile: order.shippingAddress?.mobile }
    const invoicePath = await generateInvoicePDF(order, user)

    // Send PDF file
    // invoicePath is relative like /uploads/invoices/filename.pdf
    const filepath = path.join(__dirname, '..', invoicePath)
    
    if (!fs.existsSync(filepath)) {
      console.error('Invoice file not found at:', filepath)
      console.error('Expected path:', invoicePath)
      return res.status(500).json({ message: 'Invoice file not found after generation' })
    }

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${order.orderId}.pdf"`)
    res.sendFile(path.resolve(filepath))
  } catch (error) {
    console.error('Download invoice error:', error)
    console.error('Error stack:', error.stack)
    res.status(500).json({ 
      message: error.message || 'Server error while generating invoice',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
})

// @route   POST /api/admin/orders/:id/send-invoice
// @desc    Send invoice to customer via email (PDF attachment) - Admin
// @access  Admin
router.post('/orders/:id/send-invoice', async (req, res) => {
  try {
    const order = await Order.findOne({
      where: buildOrderWhereCondition(req.params.id),
      include: [{
        model: User,
        as: 'user',
        attributes: ['name', 'email', 'mobile']
      }]
    })

    if (!order) {
      return res.status(404).json({ message: 'Order not found' })
    }

    const user = order.user || { name: order.shippingAddress?.name, email: order.shippingAddress?.email }
    const hasEmail = user.email || order.shippingAddress?.email

    if (!hasEmail) {
      return res.status(400).json({ message: 'Email address is required to send the invoice.' })
    }

    // Generate invoice PDF
    const invoicePath = await generateInvoicePDF(order, user)
    const frontendUrl = process.env.FRONTEND_URL || 'https://arudhrafashions.com'
    const backendUrl = process.env.BACKEND_URL || process.env.API_URL || 'https://api.arudhrafashions.com'
    const invoiceUrl = `${backendUrl}${invoicePath}`

    const results = {
      emailSent: false,
      message: ''
    }

    const emailResult = await sendEmailWithPDF({
      to: hasEmail,
      subject: `Invoice for Order ${order.orderId} - Arudhra Fashions`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Invoice for Order ${order.orderId}</h2>
          <p>Dear ${user.name || 'Customer'},</p>
          <p>Please find attached your invoice for order <strong>${order.orderId}</strong>.</p>
          <p><strong>Order Total:</strong> ₹${parseFloat(order.total || 0).toFixed(2)}</p>
          <p>Thank you for shopping with Arudhra Fashions!</p>
        </div>
      `,
      pdfPath: invoicePath,
      pdfName: `invoice-${order.orderId}.pdf`
    })

    results.emailSent = emailResult.success
    if (emailResult.success) {
      results.message = 'Invoice sent via email'
    } else {
      results.message = emailResult.message || 'Failed to send email'
    }

    res.json({
      success: true,
      ...results,
      invoiceUrl
    })
  } catch (error) {
    console.error('Send invoice error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/admin/customers
// @desc    Get all customers
// @access  Admin
router.get('/customers', async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query
    const where = {}

    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { mobile: { [Op.iLike]: `%${search}%` } }
      ]
    }

    const offset = (page - 1) * limit
    const { count, rows: users } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
      offset: Number(offset)
    })

    // Calculate customer stats
    const customers = await Promise.all(users.map(async (user) => {
      const orders = await Order.findAll({ where: { userId: user.id } })
      const totalSpent = orders.reduce((sum, order) => sum + parseFloat(order.total || 0), 0)

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        orders: orders.length,
        totalSpent,
        joined: user.createdAt,
        status: user.status || 'active'
      }
    }))

    res.json({
      customers,
      page: Number(page),
      pages: Math.ceil(count / limit),
      total: count
    })
  } catch (error) {
    console.error('Get admin customers error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/admin/customers/:id
// @desc    Get customer details
// @access  Admin
router.get('/customers/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] },
      include: [{
        association: 'orders'
      }]
    })

    if (!user) {
      return res.status(404).json({ message: 'Customer not found' })
    }

    const orders = await Order.findAll({ where: { userId: user.id } })
    const totalSpent = orders.reduce((sum, order) => sum + parseFloat(order.total || 0), 0)

    res.json({
      ...user.toJSON(),
      ordersCount: orders.length,
      totalSpent
    })
  } catch (error) {
    console.error('Get customer details error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   PUT /api/admin/customers/:id/status
// @desc    Toggle customer status
// @access  Admin
router.put('/customers/:id/status', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id)

    if (!user) {
      return res.status(404).json({ message: 'Customer not found' })
    }

    user.status = user.status === 'active' ? 'inactive' : 'active'
    await user.save()

    res.json({
      ...user.toJSON(),
      status: user.status
    })
  } catch (error) {
    console.error('Toggle customer status error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

export default router
