import express from 'express'
import Product from '../models/Product.js'
import { protect } from '../middleware/auth.js'
import crypto from 'crypto'

const router = express.Router()

// @route POST /api/checkout/initiate
// @desc  Validate product and prepare a lightweight checkout session (one-off buy now)
// @access Public (optional auth)
router.post('/initiate', async (req, res) => {
  try {
    const { productId, quantity = 1, size = null, color = null } = req.body || {}
    if (!productId) return res.status(400).json({ message: 'productId is required' })

    const product = await Product.findByPk(productId)
    if (!product) return res.status(404).json({ message: 'Product not found' })

    // Basic stock check
    const qty = parseInt(quantity, 10) || 1

    // Validate variant-specific stock
    let variantStock = 0;
    const inventory = Array.isArray(product.inventory) ? product.inventory : [];

    // Find matching color group
    const colorGroup = inventory.find(group =>
      group.colorName === color ||
      (group.colorName === null && !color)
    );

    if (colorGroup && Array.isArray(colorGroup.sizes)) {
      // Find matching size within color group
      const targetSizeName = size || null;
      const sizeVariant = colorGroup.sizes.find(s => s.size === targetSizeName);

      if (sizeVariant) {
        variantStock = parseInt(sizeVariant.stock) || 0;
      }
    }

    if (!product.inStock || variantStock < qty) {
      return res.status(400).json({
        message: `Sorry, this specific variant of "${product.name}" is currently out of stock.`
      })
    }

    // Build item payload (minimal product info needed by checkout)
    const item = {
      product: {
        _id: product.id,
        id: product.id,
        name: product.name,
        images: product.images || (product.image ? [product.image] : []),
        price: parseFloat(product.price || 0),
      },
      quantity: qty,
      size,
      color
    }

    const subtotal = parseFloat((item.product.price * item.quantity).toFixed(2))
    // Simple shipping rule: free above ₹2000 else ₹100
    const shipping = subtotal >= 2000 ? 0 : 100
    const tax = parseFloat((subtotal * 0.18).toFixed(2))
    const total = parseFloat((subtotal + shipping + tax).toFixed(2))

    const session = {
      id: crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex'),
      createdAt: new Date(),
      items: [item],
      subtotal,
      shipping,
      tax,
      total,
      note: 'One-off buy-now session (not persisted)'
    }

    return res.json({ session })
  } catch (err) {
    console.error('Checkout initiate error:', err)
    return res.status(500).json({ message: 'Server error' })
  }
})

export default router

