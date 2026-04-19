import express from 'express'
import { Op } from 'sequelize'
import Order from '../models/Order.js'
import Cart from '../models/Cart.js'
import User from '../models/User.js'
import Product from '../models/Product.js'
import InventoryLog from '../models/InventoryLog.js'
import Coupon from '../models/Coupon.js'
import CouponUsage from '../models/CouponUsage.js'
import Discount from '../models/Discount.js'
import CoinTransaction from '../models/CoinTransaction.js'
import Setting from '../models/Setting.js'
import { getCoinsForOrderTotal } from '../utils/coinRules.js'
import { sequelize } from '../config/db.js'
import { protect } from '../middleware/auth.js'
import { generateInvoicePDF } from '../utils/invoiceGenerator.js'
import { sendEmailWithPDF, sendOrderConfirmationEmail, sendAdminOrderNotification } from '../services/emailService.js'
import { sendPushNotificationToAdmins } from '../services/pushNotificationService.js'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import fs from 'fs'
import crypto from 'crypto'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const router = express.Router()

// @route   POST /api/orders
// @desc    Create new order
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { shippingAddress, payment, shippingMethod, couponCode, discountCode, discount, discountDiscount, coinsRedeemed } = req.body

    // Validate that only one of coupon or discount can be used, not both
    if (couponCode && discountCode) {
      return res.status(400).json({
        message: 'You can only use either a coupon or a discount, not both together. Please remove one and try again.'
      })
    }

    // Normalize COD payment selection: if frontend sent method 'cod', set a default pending status.
    if (payment && payment.method === 'cod') {
      // ensure method and status are present on the payment object
      payment.method = 'cod'
      payment.status = payment.status || 'pending'
    }

    // Verify Razorpay payment if provided (skip if COD)
    if (payment?.method !== 'cod' && payment.razorpayPaymentId && payment.razorpayOrderId && payment.razorpaySignature) {
      const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET
      if (!RAZORPAY_KEY_SECRET) {
        return res.status(500).json({ message: 'Payment gateway configuration missing' })
      }

      // Verify signature
      const text = `${payment.razorpayOrderId}|${payment.razorpayPaymentId}`
      const generatedSignature = crypto
        .createHmac('sha256', RAZORPAY_KEY_SECRET)
        .update(text)
        .digest('hex')

      if (generatedSignature !== payment.razorpaySignature) {
        return res.status(400).json({ message: 'Invalid payment signature' })
      }

      // Verify payment status with Razorpay
      try {
        const paymentResponse = await fetch(`https://api.razorpay.com/v1/payments/${payment.razorpayPaymentId}`, {
          headers: {
            'Authorization': `Basic ${Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64')}`
          }
        })

        if (!paymentResponse.ok) {
          return res.status(400).json({ message: 'Payment verification failed' })
        }

        const paymentDetails = await paymentResponse.json()
        if (paymentDetails.status !== 'captured' && paymentDetails.status !== 'authorized') {
          return res.status(400).json({ message: 'Payment not completed' })
        }
      } catch (err) {
        console.error('Razorpay verification error:', err)
        return res.status(500).json({ message: 'Payment verification failed' })
      }
    }

    // Determine source of order items:
    // - If frontend provided explicit items (buy-now flow), use them.
    // - Otherwise, load user's cart from DB.
    let cart = null
    let usedCart = false
    if (req.body.items && Array.isArray(req.body.items) && req.body.items.length > 0) {
      // Build a lightweight cart-like object from provided items.
      cart = {
        items: req.body.items.map(it => ({
          product: it.product || it.productId || null,
          name: it.name || (it.product && it.product.name) || null,
          image: it.image || (it.product && (it.product.images || it.product.image) ? ((it.product.images && it.product.images[0]) || it.product.image) : null),
          price: it.price ?? (it.product && it.product.price) ?? 0,
          quantity: it.quantity || 1,
          size: it.size || null,
          color: it.color || null
        }))
      }
      usedCart = false
    } else {
      // Get user cart from DB
      cart = await Cart.findOne({ where: { userId: req.user.id } })
      if (!cart || !cart.items || cart.items.length === 0) {
        return res.status(400).json({ message: 'Cart is empty' })
      }
      usedCart = true
    }

    // Validate stock availability for all items before creating order
    for (const item of cart.items) {
      const productId = item.product
      if (!productId) continue

      const product = await Product.findByPk(productId)
      if (!product) {
        return res.status(400).json({ message: `Product not found: ${item.name || productId}` })
      }

      // Validate variant-specific stock
      let variantStock = 0;
      const inventory = Array.isArray(product.inventory) ? product.inventory : [];

      const normalizedColor = item.color === undefined || item.color === '' ? null : item.color;
      const normalizedSize = item.size === undefined || item.size === '' ? null : item.size;

      const colorGroup = inventory.find(group =>
        group.colorName === normalizedColor ||
        (group.colorName === null && !normalizedColor)
      );

      if (colorGroup && Array.isArray(colorGroup.sizes)) {
        const sizeVariant = colorGroup.sizes.find(s => s.size === normalizedSize);
        if (sizeVariant) {
          variantStock = parseInt(sizeVariant.stock) || 0;
        }
      }

      if (!product.inStock || variantStock < item.quantity) {
        return res.status(400).json({
          message: `Sorry, a specific variant of "${product.name}" is currently out of stock.`
        })
      }
    }

    // Calculate totals
    const subtotal = cart.items.reduce((sum, item) => sum + (parseFloat(item.price || 0) * (item.quantity || 1)), 0)
    let shippingCost = 0
    if (shippingMethod === 'standard') shippingCost = 100
    else if (shippingMethod === 'express') shippingCost = 200
    else if (subtotal < 2000) shippingCost = 100

    const appliedCouponDiscount = discount || 0
    const appliedDiscountDiscount = discountDiscount || 0
    const totalDiscount = appliedCouponDiscount + appliedDiscountDiscount
    const tax = (subtotal - totalDiscount) * 0.18
    const total = subtotal - totalDiscount + shippingCost + tax

    // Generate order number (AF-ORD-000001) and invoice number (AF-INV-000001) using DB-backed counters
    let orderNumber, invoiceNumber
    const t = await sequelize.transaction()
    try {
      // Order counter
      let orderCounter = await Setting.findOne({ where: { key: 'order_counter' }, transaction: t, lock: t.LOCK.UPDATE })
      if (!orderCounter) {
        orderCounter = await Setting.create({ key: 'order_counter', value: '1', type: 'number', description: 'Global order counter' }, { transaction: t })
      } else {
        const next = String((parseInt(orderCounter.value || '0', 10) || 0) + 1)
        orderCounter.value = next
        await orderCounter.save({ transaction: t })
      }
      const orderSeq = String(parseInt(orderCounter.value || '0', 10) || 0)
      orderNumber = `AF-ORD-${orderSeq.padStart(6, '0')}`

      // Invoice counter
      let invoiceCounter = await Setting.findOne({ where: { key: 'invoice_counter' }, transaction: t, lock: t.LOCK.UPDATE })
      if (!invoiceCounter) {
        invoiceCounter = await Setting.create({ key: 'invoice_counter', value: '1', type: 'number', description: 'Global invoice counter' }, { transaction: t })
      } else {
        const nextInv = String((parseInt(invoiceCounter.value || '0', 10) || 0) + 1)
        invoiceCounter.value = nextInv
        await invoiceCounter.save({ transaction: t })
      }
      const invoiceSeq = String(parseInt(invoiceCounter.value || '0', 10) || 0)
      invoiceNumber = `AF-INV-${invoiceSeq.padStart(6, '0')}`

      // Generate tracking (keeps previous random-tracking behavior)
      var tracking = `TRACK${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`
    } catch (err) {
      await t.rollback()
      throw err
    }

    // Validate coupon usage if coupon code is provided
    if (couponCode) {
      const coupon = await Coupon.findOne({
        where: { code: couponCode.toUpperCase() }
      })

      if (coupon) {
        // Check per-user usage limit
        // If userUsageLimit is 'once', user can only use it once
        // If usageLimit is set, check against that limit
        const shouldCheckUsage = coupon.userUsageLimit === 'once' || coupon.usageLimit

        if (shouldCheckUsage) {
          const userUsageCount = await CouponUsage.count({
            where: {
              couponId: coupon.id,
              userId: req.user.id
            }
          })

          // For 'once' limit, check if already used
          if (coupon.userUsageLimit === 'once' && userUsageCount >= 1) {
            return res.status(400).json({
              message: 'This coupon can only be used once per account.'
            })
          }

          // For multiple-use with usageLimit, check against the limit
          if (coupon.usageLimit && userUsageCount >= coupon.usageLimit) {
            return res.status(400).json({
              message: `You have reached the usage limit for this coupon. You can use it ${coupon.usageLimit} time${coupon.usageLimit > 1 ? 's' : ''} per account.`
            })
          }
        }
      }
    }

    // Validate discount usage if discount code is provided
    if (discountCode) {
      const discount = await Discount.findOne({
        where: { code: discountCode.toUpperCase() }
      })

      if (discount) {
        // Check global usage limit
        if (discount.usageLimit && discount.used >= discount.usageLimit) {
          return res.status(400).json({
            message: 'Discount usage limit reached'
          })
        }
      }
    }

    // Create order (commit counters first)
    const order = await Order.create({
      orderId: orderNumber,
      userId: req.user.id,
      items: cart.items.map(item => ({
        product: item.product,
        name: item.name,
        image: item.image,
        price: item.price,
        quantity: item.quantity,
        size: item.size,
        color: item.color
      })),
      shippingAddress,
      payment: {
        ...payment,
        // For COD orders, payment.status may already be 'pending' (or updated by admin later).
        // For online payments, mark as 'paid' when razorpay payment id is present.
        status: payment?.method === 'cod' ? (payment.status || 'pending') : (payment.razorpayPaymentId ? 'paid' : 'pending')
      },
      subtotal,
      discount: totalDiscount,
      shippingCost,
      tax,
      total,
      tracking,
      couponCode: couponCode || null,
      discountCode: discountCode || null,
      coinsRedeemed: coinsRedeemed || 0,
      // Order-level status: use allowed enum values. Use 'Processing' as default status and add a note for COD.
      status: 'Processing',
      statusHistory: [{
        status: 'Processing',
        date: new Date(),
        note: payment?.method === 'cod' ? 'Order placed - Cash on Delivery selected' : (payment.razorpayPaymentId ? 'Order placed and payment received' : 'Order placed')
      }]
    }, { transaction: t })

    await t.commit()
    // Expose invoiceNumber in the returned order payload (model may not have invoiceId column)
    try {
      if (order && invoiceNumber) {
        // Attach as a transient property on the instance so JSON responses include it
        order.dataValues = order.dataValues || {}
        order.dataValues.invoiceId = invoiceNumber
      }
    } catch (e) {
      console.error('Failed to attach invoiceId to order response:', e)
    }

    // Reduce stock quantities for ordered products and log inventory changes
    try {
      for (const item of cart.items) {
        const productId = item.product
        if (!productId) continue

        const product = await Product.findByPk(productId)
        if (product) {
          // Update variant-specific stock
          const quantityOrdered = item.quantity || 1
          let variantFound = false;
          let oldStock = 0;
          let newStock = 0;

          const normalizedColor = item.color === undefined || item.color === '' ? null : item.color;
          const normalizedSize = item.size === undefined || item.size === '' ? null : item.size;

          const inventory = Array.isArray(product.inventory) ? [...product.inventory] : [];

          for (const group of inventory) {
            const matchesColor = group.colorName === normalizedColor || (group.colorName === null && !normalizedColor);
            if (matchesColor && Array.isArray(group.sizes)) {
              for (const sizeObj of group.sizes) {
                if (sizeObj.size === normalizedSize) {
                  oldStock = parseInt(sizeObj.stock) || 0;
                  newStock = Math.max(0, oldStock - quantityOrdered);
                  sizeObj.stock = newStock;
                  variantFound = true;
                  break;
                }
              }
            }
            if (variantFound) break;
          }

          product.inventory = inventory;

          // Decrement global stockCount and update inStock flag
          const currentStockCount = parseInt(product.stockCount) || 0;
          product.stockCount = Math.max(0, currentStockCount - quantityOrdered);

          let hasAnyStock = false;
          for (const group of inventory) {
            if (Array.isArray(group.sizes)) {
              for (const sizeObj of group.sizes) {
                if (parseInt(sizeObj.stock) > 0) {
                  hasAnyStock = true;
                  break;
                }
              }
            }
            if (hasAnyStock) break;
          }
          product.inStock = hasAnyStock;

          await product.save()

          // Create inventory log entry for the sale
          await InventoryLog.create({
            productId: product.id,
            quantity: quantityOrdered,
            type: 'out',
            reason: `Sale - Order ${order.orderId} (Size: ${normalizedSize}, Color: ${normalizedColor})`,
            createdBy: null // System-generated
          })

          console.log(`Stock reduced for product ${product.id} (Size: ${normalizedSize}, Color: ${normalizedColor}): ${oldStock} -> ${newStock} (Order: ${order.orderId})`)
        }
      }
    } catch (stockError) {
      // Log error but don't fail the order - stock can be adjusted manually if needed
      console.error('Error reducing stock for order:', stockError)
    }

    // Record coupon usage if coupon was used
    if (couponCode) {
      const coupon = await Coupon.findOne({
        where: { code: couponCode.toUpperCase() }
      })

      if (coupon) {
        // Create coupon usage record
        await CouponUsage.create({
          couponId: coupon.id,
          userId: req.user.id,
          orderId: order.orderId
        })

        // Increment coupon used count
        coupon.used = (coupon.used || 0) + 1
        await coupon.save()
      }
    }

    // Record discount usage if discount was used
    if (discountCode) {
      const discount = await Discount.findOne({
        where: { code: discountCode.toUpperCase() }
      })

      if (discount) {
        // Increment discount used count
        discount.used = (discount.used || 0) + 1
        await discount.save()
      }
    }

    // Clear cart only if we used the persisted cart from DB
    if (usedCart && cart && typeof cart.save === 'function') {
      try {
        cart.items = []
        await cart.save()
      } catch (clearErr) {
        console.error('Failed to clear cart after order:', clearErr)
      }
    }

    // Award coins based on purchase amount (only if payment is successful)
    // For online payments we check razorpayPaymentId; for COD we award only when payment.status is 'collected'
    if ((payment.razorpayPaymentId || (payment.method === 'cod' && payment.status === 'collected')) && total > 0) {
      try {
        const coinsToAward = getCoinsForOrderTotal(total)
        if (coinsToAward > 0) {
          const user = await User.findByPk(req.user.id)
          if (user) {
            const newBalance = (user.coins || 0) + coinsToAward
            user.coins = newBalance
            await user.save()

            await CoinTransaction.create({
              userId: user.id,
              type: 'earned',
              amount: coinsToAward,
              balanceAfter: newBalance,
              description: `Earned from order ${order.orderId}`,
              orderId: order.orderId,
              metadata: { orderTotal: total }
            })
          }
        }
      } catch (coinError) {
        console.error('Error awarding coins:', coinError)
      }
    }

    // Handle coin redemption if coins were used
    if (req.body.coinsRedeemed && req.body.coinsRedeemed > 0) {
      try {
        const user = await User.findByPk(req.user.id)
        if (user && user.coins >= req.body.coinsRedeemed) {
          // Coins are already redeemed via coin redemption endpoint before order creation
          // This is just a safety check/log
          console.log(`Coins redeemed for order ${order.orderId}: ${req.body.coinsRedeemed}`)
        }
      } catch (coinError) {
        console.error('Error processing coin redemption:', coinError)
      }
    }

    // Auto-generate invoice PDF for successful payments and save path to order
    if (payment.razorpayPaymentId) {
      try {
        const invoiceUser = await User.findByPk(req.user.id)
        const invoiceUserInfo = {
          name: invoiceUser?.name || shippingAddress?.name,
          email: invoiceUser?.email || shippingAddress?.email,
          mobile: invoiceUser?.mobile || shippingAddress?.mobile
        }

        const invoicePath = await generateInvoicePDF(order, invoiceUserInfo, invoiceNumber)
        if (invoicePath) {
          order.invoicePath = invoicePath
          await order.save()
          console.log('Invoice generated and saved to order:', invoicePath)
        }
      } catch (invErr) {
        console.error('Invoice generation error (non-fatal):', invErr)
      }
    }

    // Send order confirmation email (non-blocking) and include result in response for diagnostics
    let emailResult = null
    let adminEmailResult = null
    let pushNotificationResult = null
    try {
      const user = await User.findByPk(req.user.id)
      if (user && (user.email || shippingAddress?.email)) {
        // Debug: Log order items before sending email
        console.log('Sending order confirmation email for order:', order.orderId)
        console.log('Order items:', JSON.stringify(order.items, null, 2))

        emailResult = await sendOrderConfirmationEmail(order, { ...user.toJSON(), email: user.email || shippingAddress?.email })
        console.log('Order confirmation email result:', emailResult)
      } else {
        console.log('No email address available for order confirmation; skipping email.')
      }

      // Also send notification to admin
      adminEmailResult = await sendAdminOrderNotification(order, { ...user.toJSON(), email: user.email || shippingAddress?.email })
      console.log('Admin order notification result:', adminEmailResult)

      // Send push notification to subscribed admins
      try {
        const itemCount = order.items?.length || 0
        const totalAmount = parseFloat(order.total || 0).toFixed(2)

        pushNotificationResult = await sendPushNotificationToAdmins({
          title: 'New Order Received!',
          body: `Order ${order.orderId} placed by ${user?.name || 'Customer'} - ₹${totalAmount} (${itemCount} item${itemCount !== 1 ? 's' : ''})`,
          icon: '/Logo.png',
          badge: '/favicon-32x32.png',
          tag: 'new-order',
          data: {
            orderId: order.orderId,
            url: '/admin/orders',
            orderDetails: {
              customer: user?.name || 'Customer',
              amount: totalAmount,
              items: itemCount
            }
          },
          actions: [
            {
              action: 'view-order',
              title: 'View Order'
            },
            {
              action: 'mark-processing',
              title: 'Mark as Processing'
            }
          ]
        })
        console.log('Push notification result:', pushNotificationResult)
      } catch (pushError) {
        console.error('Error sending push notification:', pushError)
        pushNotificationResult = { success: false, message: pushError.message }
      }
    } catch (emailError) {
      // Don't fail order creation if email fails
      console.error('Error sending order confirmation email:', emailError)
      emailResult = { success: false, message: emailError.message || String(emailError) }
    }

    res.status(201).json({ order, emailResult, adminEmailResult, pushNotificationResult })
  } catch (error) {
    console.error('Create order error:', error)
    res.status(500).json({ message: error.message || 'Server error' })
  }
})

// @route   GET /api/orders
// @desc    Get user orders
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']]
    })

    res.json(orders)
  } catch (error) {
    console.error('Get orders error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/orders/:id
// @desc    Get single order
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findOne({
      where: {
        [Op.or]: [
          { id: req.params.id },
          { orderId: req.params.id },
          { tracking: req.params.id }
        ],
        userId: req.user.id
      }
    })

    if (!order) {
      return res.status(404).json({ message: 'Order not found' })
    }

    res.json(order)
  } catch (error) {
    console.error('Get order error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/orders/:id/invoice
// @desc    Download invoice PDF
// @access  Private
router.get('/:id/invoice', protect, async (req, res) => {
  try {
    const order = await Order.findOne({
      where: {
        [Op.or]: [
          { id: req.params.id },
          { orderId: req.params.id },
          { tracking: req.params.id }
        ],
        userId: req.user.id
      },
      include: [{
        model: User,
        as: 'user',
        attributes: ['name', 'email', 'mobile']
      }]
    })

    if (!order) {
      return res.status(404).json({ message: 'Order not found' })
    }

    // Generate invoice PDF
    const user = order.user || req.user
    const invoicePath = await generateInvoicePDF(order, user)

    // Send PDF file
    const filepath = path.join(__dirname, '..', invoicePath)
    if (!fs.existsSync(filepath)) {
      return res.status(500).json({ message: 'Invoice generation failed' })
    }

    // Derive display invoice id for filename (AF-INV-... if order uses AF-ORD-...)
    let displayInvoiceId = order.orderId && order.orderId.startsWith('AF-ORD-') ? order.orderId.replace('AF-ORD-', 'AF-INV-') : (order.invoiceId || order.orderId || 'invoice')
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${displayInvoiceId}.pdf"`)
    res.sendFile(path.resolve(filepath))
  } catch (error) {
    console.error('Download invoice error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   POST /api/orders/:id/send-invoice
// @desc    Send invoice to customer via email (PDF attachment)
// @access  Private
router.post('/:id/send-invoice', protect, async (req, res) => {
  try {
    const order = await Order.findOne({
      where: {
        [Op.or]: [
          { id: req.params.id },
          { orderId: req.params.id },
          { tracking: req.params.id }
        ],
        userId: req.user.id
      },
      include: [{
        model: User,
        as: 'user',
        attributes: ['name', 'email', 'mobile']
      }]
    })

    if (!order) {
      return res.status(404).json({ message: 'Order not found' })
    }

    const user = order.user || req.user
    const hasEmail = user.email || order.shippingAddress?.email

    if (!hasEmail) {
      return res.status(400).json({ message: 'Email address is required to send the invoice.' })
    }

    // Generate invoice PDF
    const invoicePath = await generateInvoicePDF(order, user)
    // Prepare display invoice id for email content / filename
    const displayInvoiceIdEmail = order.orderId && order.orderId.startsWith('AF-ORD-') ? order.orderId.replace('AF-ORD-', 'AF-INV-') : (order.invoiceId || order.orderId || 'invoice')
    const backendUrl = process.env.BACKEND_URL || process.env.API_URL || 'https://api.arudhrafashions.com'
    const invoiceUrl = `${backendUrl}${invoicePath}`

    const results = {
      emailSent: false,
      message: ''
    }

    const emailResult = await sendEmailWithPDF({
      to: hasEmail,
      subject: `Invoice ${displayInvoiceIdEmail} for Order ${order.orderId} - Arudhra Fashions`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Invoice ${displayInvoiceIdEmail} for Order ${order.orderId}</h2>
          <p>Dear ${user.name || 'Customer'},</p>
          <p>Please find attached your invoice <strong>${displayInvoiceIdEmail}</strong> for order <strong>${order.orderId}</strong>.</p>
          <p><strong>Order Total:</strong> ₹${parseFloat(order.total || 0).toFixed(2)}</p>
          <p>Thank you for shopping with Arudhra Fashions!</p>
        </div>
      `,
      pdfPath: invoicePath,
      pdfName: `invoice-${displayInvoiceIdEmail}.pdf`
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

export default router
