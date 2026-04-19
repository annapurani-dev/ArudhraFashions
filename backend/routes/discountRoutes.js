import express from 'express'
import { Op } from 'sequelize'
import Discount from '../models/Discount.js'
import { adminProtect } from '../middleware/adminAuth.js'
import { optionalAuth } from '../middleware/auth.js'

const router = express.Router()

// @route   GET /api/discounts
// @desc    Get all discounts (admin)
// @access  Admin
router.get('/all', adminProtect, async (req, res) => {
  try {
    const { search, status, page = 1, limit = 20 } = req.query
    const where = {}

    if (search) {
      where[Op.or] = [
        { code: { [Op.iLike]: `%${search}%` } },
        { name: { [Op.iLike]: `%${search}%` } }
      ]
    }

    if (status) {
      where.status = status
    }

    const offset = (page - 1) * limit
    const { count, rows: discounts } = await Discount.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
      offset: Number(offset)
    })

    res.json({
      discounts,
      page: Number(page),
      pages: Math.ceil(count / limit),
      total: count
    })
  } catch (error) {
    console.error('Get admin discounts error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   POST /api/discounts
// @desc    Create discount
// @access  Admin
router.post('/create', adminProtect, async (req, res) => {
  try {
    const discount = await Discount.create({
      ...req.body,
      code: req.body.code.toUpperCase()
    })
    res.status(201).json(discount)
  } catch (error) {
    console.error('Create discount error:', error)
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'Discount code already exists' })
    }
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   PUT /api/discounts/:id
// @desc    Update discount
// @access  Admin
router.put('/update/:id', adminProtect, async (req, res) => {
  try {
    const discount = await Discount.findByPk(req.params.id)
    if (!discount) {
      return res.status(404).json({ message: 'Discount not found' })
    }

    const updateData = { ...req.body }
    if (updateData.code) {
      updateData.code = updateData.code.toUpperCase()
    }

    await discount.update(updateData)
    await discount.reload()

    res.json(discount)
  } catch (error) {
    console.error('Update discount error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   DELETE /api/discounts/:id
// @desc    Delete discount
// @access  Admin
router.delete('/delete/:id', adminProtect, async (req, res) => {
  try {
    const discount = await Discount.findByPk(req.params.id)
    if (!discount) {
      return res.status(404).json({ message: 'Discount not found' })
    }

    await discount.destroy()
    res.json({ message: 'Discount deleted' })
  } catch (error) {
    console.error('Delete discount error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   PUT /api/discounts/:id/status
// @desc    Toggle discount status
// @access  Admin
router.put('/status/:id', adminProtect, async (req, res) => {
  try {
    const discount = await Discount.findByPk(req.params.id)
    if (!discount) {
      return res.status(404).json({ message: 'Discount not found' })
    }

    discount.status = discount.status === 'active' ? 'inactive' : 'active'
    await discount.save()

    res.json(discount)
  } catch (error) {
    console.error('Toggle discount status error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/discounts/available
// @desc    Get all available discounts for checkout (public)
// @access  Public
router.get('/available', optionalAuth, async (req, res) => {
  try {
    const { orderTotal } = req.query
    const now = new Date()
    
    // Get all active discounts
    const discounts = await Discount.findAll({
      where: {
        status: 'active'
      },
      order: [['createdAt', 'DESC']]
    })
    
    // Filter discounts based on date validity, order total, and usage limit
    const availableDiscounts = discounts
      .filter(discount => {
        // Check date validity
        if (discount.startDate) {
          const startDate = new Date(discount.startDate)
          const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
          const nowDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          
          if (startDateOnly > nowDateOnly) {
            return false
          }
        }
        
        if (discount.endDate) {
          const endDate = new Date(discount.endDate)
          const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())
          const nowDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          
          if (endDateOnly < nowDateOnly) {
            return false
          }
        }
        
        // Check global usage limit
        if (discount.usageLimit && discount.used >= discount.usageLimit) {
          return false
        }
        
        // Check minimum order if orderTotal is provided
        if (orderTotal && discount.minOrder && parseFloat(orderTotal) < parseFloat(discount.minOrder)) {
          return false
        }
        
        return true
      })
      .map(discount => ({
        id: discount.id,
        code: discount.code,
        name: discount.name,
        instruction: discount.instruction,
        type: discount.type,
        value: discount.value,
        maxDiscount: discount.maxDiscount,
        minOrder: discount.minOrder,
        endDate: discount.endDate
      }))
    
    res.json({ discounts: availableDiscounts })
  } catch (error) {
    console.error('Get available discounts error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/discounts/validate/:code
// @desc    Validate discount code
// @access  Public
router.get('/validate/:code', optionalAuth, async (req, res) => {
  try {
    const { code } = req.params
    const { orderTotal, cartItems } = req.query
    
    const discount = await Discount.findOne({
      where: {
        code: code.toUpperCase(),
        status: 'active'
      }
    })
    
    if (!discount) {
      return res.status(404).json({ message: 'Invalid discount code' })
    }
    
    const now = new Date()
    if (discount.startDate > now || discount.endDate < now) {
      return res.status(400).json({ message: 'Discount has expired' })
    }
    
    // Check global usage limit
    if (discount.usageLimit && discount.used >= discount.usageLimit) {
      return res.status(400).json({ message: 'Discount usage limit reached' })
    }
    
    // Check minimum order
    if (orderTotal && discount.minOrder && parseFloat(orderTotal) < parseFloat(discount.minOrder)) {
      const shortfall = parseFloat(discount.minOrder) - parseFloat(orderTotal)
      return res.status(400).json({ 
        message: `Discount "${discount.code}" requires a minimum purchase of ₹${discount.minOrder}. Your current order total is ₹${orderTotal}. Add ₹${shortfall.toFixed(2)} more to use this discount.` 
      })
    }
    
    // Parse cart items if provided for custom discount logic
    let parsedCartItems = []
    if (cartItems) {
      try {
        parsedCartItems = JSON.parse(cartItems)
      } catch (e) {
        console.error('Error parsing cart items:', e)
      }
    }
    
    // Calculate discount based on type
    let calculatedDiscount = 0
    let discountDetails = {
      type: discount.type,
      instruction: discount.instruction
    }
    
    if (discount.type === 'percentage') {
      calculatedDiscount = (parseFloat(orderTotal || 0) * parseFloat(discount.value)) / 100
      if (discount.maxDiscount && calculatedDiscount > parseFloat(discount.maxDiscount)) {
        calculatedDiscount = parseFloat(discount.maxDiscount)
      }
    } else if (discount.type === 'fixed') {
      calculatedDiscount = parseFloat(discount.value)
      if (calculatedDiscount > parseFloat(orderTotal || 0)) {
        calculatedDiscount = parseFloat(orderTotal || 0)
      }
    } else if (discount.type === 'custom' && discount.instruction) {
      // Parse instruction and calculate discount
      calculatedDiscount = parseDiscountInstruction(discount.instruction, parsedCartItems, parseFloat(orderTotal || 0))
      discountDetails.calculatedDiscount = calculatedDiscount
    }
    
    res.json({
      valid: true,
      discount: {
        id: discount.id,
        code: discount.code,
        name: discount.name,
        instruction: discount.instruction,
        type: discount.type,
        value: parseFloat(discount.value),
        calculatedDiscount: calculatedDiscount,
        maxDiscount: discount.maxDiscount ? parseFloat(discount.maxDiscount) : null,
        minOrder: discount.minOrder ? parseFloat(discount.minOrder) : null,
        details: discountDetails
      }
    })
  } catch (error) {
    console.error('Validate discount error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Helper function to parse discount instructions
function parseDiscountInstruction(instruction, cartItems, orderTotal) {
  if (!instruction || !cartItems || cartItems.length === 0) {
    return 0
  }
  
  const instructionLower = instruction.toLowerCase()
  
  // Buy X Get Y Free pattern
  const buyXGetYMatch = instructionLower.match(/buy\s+(\d+)\s+get\s+(\d+)\s+free/i)
  if (buyXGetYMatch) {
    const buyCount = parseInt(buyXGetYMatch[1])
    const freeCount = parseInt(buyXGetYMatch[2])
    const minItems = buyCount + freeCount
    
    // Check if cart has minimum items
    const totalQuantity = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0)
    if (totalQuantity < minItems) {
      return 0
    }
    
    // Sort items by price (lowest first) and mark free items
    const sortedItems = [...cartItems].sort((a, b) => {
      const priceA = parseFloat(a.product?.price || a.price || 0)
      const priceB = parseFloat(b.product?.price || b.price || 0)
      return priceA - priceB
    })
    
    // Calculate total discount (free items' prices)
    let discount = 0
    let itemsToMakeFree = freeCount
    let remainingQuantity = totalQuantity
    
    for (const item of sortedItems) {
      if (itemsToMakeFree <= 0) break
      
      const itemPrice = parseFloat(item.product?.price || item.price || 0)
      const itemQuantity = item.quantity || 1
      const freeFromThisItem = Math.min(itemsToMakeFree, itemQuantity)
      
      discount += itemPrice * freeFromThisItem
      itemsToMakeFree -= freeFromThisItem
    }
    
    return discount
  }
  
  // Percentage off pattern
  const percentMatch = instructionLower.match(/(\d+(?:\.\d+)?)\s*%\s*(?:off|discount)/i)
  if (percentMatch) {
    const percent = parseFloat(percentMatch[1])
    return (orderTotal * percent) / 100
  }
  
  // Fixed amount off pattern
  const fixedMatch = instructionLower.match(/₹?\s*(\d+(?:\.\d+)?)\s*(?:off|discount)/i)
  if (fixedMatch) {
    const amount = parseFloat(fixedMatch[1])
    return Math.min(amount, orderTotal)
  }
  
  // Default: return 0 if instruction doesn't match known patterns
  return 0
}

export default router

