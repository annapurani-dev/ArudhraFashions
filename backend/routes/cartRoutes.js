import express from 'express'
import Cart from '../models/Cart.js'
import Product from '../models/Product.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

// @route   GET /api/cart
// @desc    Get user cart
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    let cart = await Cart.findOne({ where: { userId: req.user.id } })

    if (!cart) {
      cart = await Cart.create({ userId: req.user.id, items: [] })
    }

    // Ensure items is always an array
    if (!Array.isArray(cart.items)) {
      cart.items = []
    }

    console.log('GET cart - items count:', cart.items?.length || 0)
    console.log('GET cart - items:', JSON.stringify(cart.items, null, 2))

    res.json(cart)
  } catch (error) {
    console.error('Get cart error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   POST /api/cart
// @desc    Add item to cart
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { productId, quantity = 1, size, color } = req.body
    const normalizeOption = (value) => value === undefined || value === null || value === '' ? null : value
    const normalizedSize = normalizeOption(size)
    const normalizedColor = normalizeOption(color)

    if (!productId) {
      return res.status(400).json({ message: 'Product ID is required' })
    }

    const product = await Product.findByPk(productId)
    if (!product || !product.isActive) {
      return res.status(404).json({ message: 'Product not found' })
    }

    let cart = await Cart.findOne({ where: { userId: req.user.id } })

    if (!cart) {
      cart = await Cart.create({ userId: req.user.id, items: [] })
    }

    // Get current items array - ensure it's an array
    let items = Array.isArray(cart.items) ? [...cart.items] : []

    // Check if item already exists in cart to calculate total requested quantity
    const existingItemIndex = items.findIndex(item => {
      const itemSize = normalizeOption(item.size)
      const itemColor = normalizeOption(item.color)

      return (
        item.product === productId &&
        itemSize === normalizedSize &&
        itemColor === normalizedColor
      )
    })

    const currentQtyInCart = existingItemIndex >= 0 ? items[existingItemIndex].quantity : 0;
    const requestedTotalQty = currentQtyInCart + quantity;

    // Validate variant-specific stock if inventory exists
    const inventory = Array.isArray(product.inventory) ? product.inventory : [];

    if (inventory.length > 0) {
      let variantStock = 0;
      // Find matching color group
      const colorGroup = inventory.find(group =>
        (group.colorName || '') === (normalizedColor || '')
      );

      if (colorGroup && Array.isArray(colorGroup.sizes)) {
        // Find matching size within color group
        const sizeVariant = colorGroup.sizes.find(s => (s.size || '') === (normalizedSize || ''));
        if (sizeVariant) {
          variantStock = parseInt(sizeVariant.stock) || 0;
        }
      }

      if (variantStock < requestedTotalQty) {
        return res.status(400).json({
          message: `Sorry, only ${variantStock} units of this specific variant are available. You already have ${currentQtyInCart} in your cart.`
        })
      }
    } else {
      // Fallback for products without variant inventory
      if (!product.inStock || (product.stockCount !== null && product.stockCount < requestedTotalQty)) {
        return res.status(400).json({
          message: `Sorry, this item is out of stock or insufficient quantity available.`
        })
      }
    }

    if (existingItemIndex >= 0) {
      // Update quantity
      items[existingItemIndex].quantity += quantity
      console.log('Updated existing item quantity')
    } else {
      // Add new item
      const newItem = {
        product: productId,
        name: product.name,
        image: product.images && product.images.length > 0 ? product.images[0] : '',
        price: parseFloat(product.price),
        quantity,
        size: normalizedSize,
        color: normalizedColor
      }
      items.push(newItem)
      console.log('Added new item:', JSON.stringify(newItem, null, 2))
    }

    console.log('Items array before save:', JSON.stringify(items, null, 2))

    // Use raw query to update JSONB field - more reliable for JSONB
    const updateResult = await Cart.sequelize.query(
      `UPDATE carts SET items = :items::jsonb, "updatedAt" = NOW() WHERE id = :cartId RETURNING *`,
      {
        replacements: {
          items: JSON.stringify(items),
          cartId: cart.id
        },
        type: Cart.sequelize.QueryTypes.SELECT
      }
    )

    console.log('Update result:', JSON.stringify(updateResult, null, 2))

    // Reload to get the latest data
    await cart.reload()

    console.log('Cart after reload - items count:', cart.items?.length || 0)
    console.log('Cart after reload - items:', JSON.stringify(cart.items, null, 2))

    res.json(cart)
  } catch (error) {
    console.error('Add to cart error:', error)
    console.error('Error stack:', error.stack)
    res.status(500).json({ message: 'Server error', error: error.message })
  }
})

// @route   PUT /api/cart/:itemId
// @desc    Update cart item quantity
// @access  Private
router.put('/:itemId', protect, async (req, res) => {
  try {
    const { quantity } = req.body

    if (!quantity || quantity < 1) {
      return res.status(400).json({ message: 'Quantity must be at least 1' })
    }

    const cart = await Cart.findOne({ where: { userId: req.user.id } })
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' })
    }

    const items = cart.items || []
    const itemIndex = items.findIndex(item => item.product === req.params.itemId)

    if (itemIndex === -1) {
      return res.status(404).json({ message: 'Item not found in cart' })
    }

    // Check stock availability before updating
    const product = await Product.findByPk(req.params.itemId)
    if (product) {
      let variantStock = 0;
      const inventory = Array.isArray(product.inventory) ? product.inventory : [];

      const cartItem = items[itemIndex];
      const normalizedColor = cartItem.color === undefined || cartItem.color === '' ? null : cartItem.color;
      const normalizedSize = cartItem.size === undefined || cartItem.size === '' ? null : cartItem.size;

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

      if (!product.inStock || variantStock < quantity) {
        return res.status(400).json({
          message: `Sorry, this specific variant of "${product.name}" is currently out of stock.`
        })
      }
    }

    items[itemIndex].quantity = quantity
    // Use raw query to update JSONB field
    await Cart.sequelize.query(
      `UPDATE carts SET items = :items::jsonb, "updatedAt" = NOW() WHERE id = :cartId`,
      {
        replacements: {
          items: JSON.stringify(items),
          cartId: cart.id
        },
        type: Cart.sequelize.QueryTypes.UPDATE
      }
    )

    // Reload to get the latest data
    await cart.reload()

    res.json(cart)
  } catch (error) {
    console.error('Update cart error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   DELETE /api/cart/:itemId
// @desc    Remove item from cart
// @access  Private
router.delete('/:itemId', protect, async (req, res) => {
  try {
    const cart = await Cart.findOne({ where: { userId: req.user.id } })
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' })
    }

    const items = (cart.items || []).filter(item => item.product !== req.params.itemId)
    // Use raw query to update JSONB field
    await Cart.sequelize.query(
      `UPDATE carts SET items = :items::jsonb, "updatedAt" = NOW() WHERE id = :cartId`,
      {
        replacements: {
          items: JSON.stringify(items),
          cartId: cart.id
        },
        type: Cart.sequelize.QueryTypes.UPDATE
      }
    )

    // Reload to get the latest data
    await cart.reload()

    res.json(cart)
  } catch (error) {
    console.error('Remove from cart error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   DELETE /api/cart
// @desc    Clear cart
// @access  Private
router.delete('/', protect, async (req, res) => {
  try {
    const cart = await Cart.findOne({ where: { userId: req.user.id } })
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' })
    }

    // Use raw query to update JSONB field
    await Cart.sequelize.query(
      `UPDATE carts SET items = '[]'::jsonb, "updatedAt" = NOW() WHERE id = :cartId`,
      {
        replacements: {
          cartId: cart.id
        },
        type: Cart.sequelize.QueryTypes.UPDATE
      }
    )

    // Reload to get the latest data
    await cart.reload()

    res.json({ message: 'Cart cleared' })
  } catch (error) {
    console.error('Clear cart error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

export default router
