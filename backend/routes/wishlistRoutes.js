import express from 'express'
import { Op } from 'sequelize'
import User from '../models/User.js'
import Product from '../models/Product.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

// @route   GET /api/wishlist
// @desc    Get user wishlist
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id)
    
    // Ensure wishlist is always an array
    let wishlist = Array.isArray(user?.wishlist) ? user.wishlist : []
    
    console.log('GET wishlist - items count:', wishlist.length)
    console.log('GET wishlist - items:', JSON.stringify(wishlist, null, 2))
    
    if (!user || !wishlist || wishlist.length === 0) {
      return res.json([])
    }

    const wishlistProducts = await Product.findAll({
      where: { id: { [Op.in]: wishlist } }
    })
    
    res.json(wishlistProducts)
  } catch (error) {
    console.error('Get wishlist error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   POST /api/wishlist
// @desc    Add product to wishlist
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
    
    // Get current wishlist - ensure it's an array
    let wishlist = Array.isArray(user.wishlist) ? [...user.wishlist] : []
    
    console.log('Current wishlist before update:', JSON.stringify(wishlist, null, 2))
    console.log('Adding product to wishlist:', productId)
    
    // Check if already in wishlist
    if (wishlist.includes(productId)) {
      return res.status(400).json({ message: 'Product already in wishlist' })
    }

    wishlist.push(productId)
    
    console.log('Wishlist array before save:', JSON.stringify(wishlist, null, 2))

    // Use raw query to update ARRAY field - more reliable
    // For PostgreSQL arrays, we need to format it as an array literal
    const arrayLiteral = `{${wishlist.map(id => `"${id}"`).join(',')}}`
    const updateResult = await User.sequelize.query(
      `UPDATE users SET wishlist = :wishlist::uuid[], "updatedAt" = NOW() WHERE id = :userId RETURNING *`,
      {
        replacements: {
          wishlist: arrayLiteral,
          userId: user.id
        },
        type: User.sequelize.QueryTypes.SELECT
      }
    )
    
    console.log('Update result:', JSON.stringify(updateResult, null, 2))
    
    // Reload user to get the latest data
    await user.reload()
    
    console.log('User after reload - wishlist count:', user.wishlist?.length || 0)
    console.log('User after reload - wishlist:', JSON.stringify(user.wishlist, null, 2))

    const wishlistProducts = await Product.findAll({
      where: { id: { [Op.in]: user.wishlist || [] } }
    })
    
    res.json(wishlistProducts)
  } catch (error) {
    console.error('Add to wishlist error:', error)
    console.error('Error stack:', error.stack)
    res.status(500).json({ message: 'Server error', error: error.message })
  }
})

// @route   DELETE /api/wishlist/:productId
// @desc    Remove product from wishlist
// @access  Private
router.delete('/:productId', protect, async (req, res) => {
  try {
    const { productId } = req.params

    const user = await User.findByPk(req.user.id)
    
    // Get current wishlist - ensure it's an array
    let wishlist = Array.isArray(user?.wishlist) ? [...user.wishlist] : []
    
    console.log('Current wishlist before removal:', JSON.stringify(wishlist, null, 2))
    console.log('Removing product from wishlist:', productId)
    
    if (!user || !wishlist || wishlist.length === 0) {
      return res.status(404).json({ message: 'Wishlist not found or empty' })
    }

    wishlist = wishlist.filter(id => id !== productId)
    
    console.log('Wishlist array after removal:', JSON.stringify(wishlist, null, 2))

    // Use raw query to update ARRAY field - more reliable
    // For PostgreSQL arrays, we need to format it as an array literal
    const arrayLiteral = `{${wishlist.map(id => `"${id}"`).join(',')}}`
    const updateResult = await User.sequelize.query(
      `UPDATE users SET wishlist = :wishlist::uuid[], "updatedAt" = NOW() WHERE id = :userId RETURNING *`,
      {
        replacements: {
          wishlist: arrayLiteral,
          userId: user.id
        },
        type: User.sequelize.QueryTypes.SELECT
      }
    )
    
    console.log('Update result:', JSON.stringify(updateResult, null, 2))
    
    // Reload user to get the latest data
    await user.reload()
    
    console.log('User after reload - wishlist count:', user.wishlist?.length || 0)

    const wishlistProducts = await Product.findAll({
      where: { id: { [Op.in]: user.wishlist || [] } }
    })
    
    res.json(wishlistProducts)
  } catch (error) {
    console.error('Remove from wishlist error:', error)
    console.error('Error stack:', error.stack)
    res.status(500).json({ message: 'Server error', error: error.message })
  }
})

// @route   GET /api/wishlist/check/:productId
// @desc    Check if product is in wishlist
// @access  Private
router.get('/check/:productId', protect, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id)
    // Ensure wishlist is always an array
    const wishlist = Array.isArray(user?.wishlist) ? user.wishlist : []
    const isWishlisted = wishlist.includes(req.params.productId)
    res.json({ isWishlisted })
  } catch (error) {
    console.error('Check wishlist error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

export default router
