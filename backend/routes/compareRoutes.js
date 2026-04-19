import express from 'express'
import { Op } from 'sequelize'
import User from '../models/User.js'
import Product from '../models/Product.js'
import { protect, optionalAuth } from '../middleware/auth.js'

const router = express.Router()

// @route   GET /api/compare
// @desc    Get user compare list
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id)
    
    // Ensure compare is always an array
    let compare = Array.isArray(user?.compare) ? user.compare : []
    
    if (!user || !compare || compare.length === 0) {
      return res.json([])
    }

    // Limit to 4 products max
    const compareIds = compare.slice(0, 4)
    
    const compareProducts = await Product.findAll({
      where: { id: { [Op.in]: compareIds } }
    })
    
    res.json(compareProducts)
  } catch (error) {
    console.error('Get compare error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   POST /api/compare
// @desc    Add product to compare list
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { productId } = req.body

    if (!productId) {
      return res.status(400).json({ message: 'Product ID is required' })
    }

    const product = await Product.findByPk(productId)
    if (!product || !product.isActive) {
      return res.status(404).json({ message: 'Product not found' })
    }

    const user = await User.findByPk(req.user.id)
    
    // Get current compare list - ensure it's an array
    let compare = Array.isArray(user.compare) ? [...user.compare] : []
    
    // Check if already in compare
    if (compare.includes(productId)) {
      return res.status(400).json({ message: 'Product already in compare list' })
    }

    // Limit to 4 products max
    if (compare.length >= 4) {
      return res.status(400).json({ message: 'You can compare up to 4 products at a time' })
    }

    compare.push(productId)
    
    // Use raw query to update ARRAY field - more reliable
    const arrayLiteral = `{${compare.map(id => `"${id}"`).join(',')}}`
    await User.sequelize.query(
      `UPDATE users SET compare = :compare::uuid[], "updatedAt" = NOW() WHERE id = :userId`,
      {
        replacements: {
          compare: arrayLiteral,
          userId: user.id
        },
        type: User.sequelize.QueryTypes.UPDATE
      }
    )
    
    // Reload user to get the latest data
    await user.reload()

    const compareProducts = await Product.findAll({
      where: { id: { [Op.in]: user.compare || [] } }
    })
    
    res.json(compareProducts)
  } catch (error) {
    console.error('Add to compare error:', error)
    res.status(500).json({ message: 'Server error', error: error.message })
  }
})

// @route   DELETE /api/compare/:productId
// @desc    Remove product from compare list
// @access  Private
router.delete('/:productId', protect, async (req, res) => {
  try {
    const { productId } = req.params

    const user = await User.findByPk(req.user.id)
    
    // Get current compare list - ensure it's an array
    let compare = Array.isArray(user?.compare) ? [...user.compare] : []
    
    if (!user || !compare || compare.length === 0) {
      return res.status(404).json({ message: 'Compare list not found or empty' })
    }

    compare = compare.filter(id => id !== productId)
    
    // Use raw query to update ARRAY field
    const arrayLiteral = compare.length > 0 ? `{${compare.map(id => `"${id}"`).join(',')}}` : '{}'
    await User.sequelize.query(
      `UPDATE users SET compare = :compare::uuid[], "updatedAt" = NOW() WHERE id = :userId`,
      {
        replacements: {
          compare: arrayLiteral,
          userId: user.id
        },
        type: User.sequelize.QueryTypes.UPDATE
      }
    )
    
    // Reload user to get the latest data
    await user.reload()

    const compareProducts = await Product.findAll({
      where: { id: { [Op.in]: user.compare || [] } }
    })
    
    res.json(compareProducts)
  } catch (error) {
    console.error('Remove from compare error:', error)
    res.status(500).json({ message: 'Server error', error: error.message })
  }
})

// @route   GET /api/compare/check/:productId
// @desc    Check if product is in compare list
// @access  Private
router.get('/check/:productId', protect, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id)
    // Ensure compare is always an array
    const compare = Array.isArray(user?.compare) ? user.compare : []
    const isInCompare = compare.includes(req.params.productId)
    res.json({ isInCompare })
  } catch (error) {
    console.error('Check compare error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/compare/count
// @desc    Get compare list count
// @access  Private
router.get('/count', protect, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id)
    const compare = Array.isArray(user?.compare) ? user.compare : []
    res.json({ count: compare.length })
  } catch (error) {
    console.error('Get compare count error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

export default router
