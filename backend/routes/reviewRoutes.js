import express from 'express'
import Review from '../models/Review.js'
import Product from '../models/Product.js'
import User from '../models/User.js'
import { protect, optionalAuth } from '../middleware/auth.js'

const router = express.Router()

// @route   GET /api/products/:productId/reviews
// @desc    Get product reviews
// @access  Public
router.get('/:productId/reviews', optionalAuth, async (req, res) => {
  try {
    const reviews = await Review.findAll({
      where: { productId: req.params.productId },
      include: [{
        association: 'user',
        attributes: ['name', 'mobile']
      }],
      order: [['createdAt', 'DESC']],
      limit: 50
    })

    res.json(reviews)
  } catch (error) {
    console.error('Get reviews error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   POST /api/products/:productId/reviews
// @desc    Add product review
// @access  Private
router.post('/:productId/reviews', protect, async (req, res) => {
  try {
    const { rating, comment } = req.body

    if (!rating || !comment) {
      return res.status(400).json({ message: 'Rating and comment are required' })
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' })
    }

    const product = await Product.findByPk(req.params.productId)
    if (!product) {
      return res.status(404).json({ message: 'Product not found' })
    }

    // Check if user already reviewed this product
    const existingReview = await Review.findOne({
      where: {
        userId: req.user.id,
        productId: req.params.productId
      }
    })

    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this product' })
    }

    const user = await User.findByPk(req.user.id)
    
    const review = await Review.create({
      productId: req.params.productId,
      userId: req.user.id,
      userName: user.name,
      rating,
      comment
    })

    // Update product rating
    const allReviews = await Review.findAll({
      where: { productId: req.params.productId }
    })
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
    
    product.rating = Math.round(avgRating * 10) / 10
    product.reviews = allReviews.length
    await product.save()

    const reviewWithUser = await Review.findByPk(review.id, {
      include: [{
        association: 'user',
        attributes: ['name', 'mobile']
      }]
    })

    res.status(201).json(reviewWithUser)
  } catch (error) {
    console.error('Add review error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   PUT /api/products/:productId/reviews/:reviewId
// @desc    Update product review
// @access  Private
router.put('/:productId/reviews/:reviewId', protect, async (req, res) => {
  try {
    const { rating, comment } = req.body

    if (!rating || !comment) {
      return res.status(400).json({ message: 'Rating and comment are required' })
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' })
    }

    const review = await Review.findByPk(req.params.reviewId)
    if (!review) {
      return res.status(404).json({ message: 'Review not found' })
    }

    // Check if review belongs to the product
    if (review.productId !== req.params.productId) {
      return res.status(400).json({ message: 'Review does not belong to this product' })
    }

    // Check if user owns the review
    if (review.userId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this review' })
    }

    // Update review
    review.rating = rating
    review.comment = comment
    await review.save()

    // Update product rating
    const allReviews = await Review.findAll({
      where: { productId: req.params.productId }
    })
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
    
    const product = await Product.findByPk(req.params.productId)
    product.rating = Math.round(avgRating * 10) / 10
    product.reviews = allReviews.length
    await product.save()

    const reviewWithUser = await Review.findByPk(review.id, {
      include: [{
        association: 'user',
        attributes: ['name', 'mobile']
      }]
    })

    res.json(reviewWithUser)
  } catch (error) {
    console.error('Update review error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   DELETE /api/products/:productId/reviews/:reviewId
// @desc    Delete product review
// @access  Private
router.delete('/:productId/reviews/:reviewId', protect, async (req, res) => {
  try {
    const review = await Review.findByPk(req.params.reviewId)
    if (!review) {
      return res.status(404).json({ message: 'Review not found' })
    }

    // Check if review belongs to the product
    if (review.productId !== req.params.productId) {
      return res.status(400).json({ message: 'Review does not belong to this product' })
    }

    // Check if user owns the review
    if (review.userId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this review' })
    }

    const productId = review.productId
    await review.destroy()

    // Update product rating
    const allReviews = await Review.findAll({
      where: { productId }
    })
    
    const product = await Product.findByPk(productId)
    if (allReviews.length > 0) {
      const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
      product.rating = Math.round(avgRating * 10) / 10
    } else {
      product.rating = 0
    }
    product.reviews = allReviews.length
    await product.save()

    res.json({ message: 'Review deleted successfully' })
  } catch (error) {
    console.error('Delete review error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

export default router
