import express from 'express'
import Testimonial from '../models/Testimonial.js'
import { adminProtect } from '../middleware/adminAuth.js'

const router = express.Router()

// @route   GET /api/testimonials
// @desc    Get visible testimonials (public)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const testimonials = await Testimonial.findAll({
      where: {
        visible: true
      },
      order: [['position', 'ASC'], ['createdAt', 'DESC']]
    })

    res.json(testimonials)
  } catch (error) {
    console.error('Get testimonials error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/admin/testimonials
// @desc    Get all testimonials (admin)
// @access  Admin
router.get('/all', adminProtect, async (req, res) => {
  try {
    const testimonials = await Testimonial.findAll({
      order: [['position', 'ASC'], ['createdAt', 'DESC']]
    })

    res.json(testimonials)
  } catch (error) {
    console.error('Get admin testimonials error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   POST /api/admin/testimonials
// @desc    Create testimonial
// @access  Admin
router.post('/create', adminProtect, async (req, res) => {
  try {
    const { name, content, rating, position } = req.body
    
    if (!name || !content) {
      return res.status(400).json({ message: 'Name and content are required' })
    }

    // Get max position to add at end if not specified
    let finalPosition = position
    if (!finalPosition && finalPosition !== 0) {
      const maxPosition = await Testimonial.max('position')
      finalPosition = maxPosition !== null ? maxPosition + 1 : 0
    }

    const testimonial = await Testimonial.create({
      name,
      content,
      rating: rating ? parseInt(rating) : null,
      position: finalPosition,
      visible: true
    })

    res.status(201).json(testimonial)
  } catch (error) {
    console.error('Create testimonial error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   PUT /api/admin/testimonials/:id
// @desc    Update testimonial
// @access  Admin
router.put('/update/:id', adminProtect, async (req, res) => {
  try {
    const testimonial = await Testimonial.findByPk(req.params.id)
    if (!testimonial) {
      return res.status(404).json({ message: 'Testimonial not found' })
    }

    const { name, content, rating, position } = req.body

    if (name) testimonial.name = name
    if (content !== undefined) testimonial.content = content
    if (rating !== undefined) testimonial.rating = rating ? parseInt(rating) : null
    if (position !== undefined) testimonial.position = parseInt(position)

    await testimonial.save()
    await testimonial.reload()

    res.json(testimonial)
  } catch (error) {
    console.error('Update testimonial error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   DELETE /api/admin/testimonials/:id
// @desc    Delete testimonial
// @access  Admin
router.delete('/delete/:id', adminProtect, async (req, res) => {
  try {
    const testimonial = await Testimonial.findByPk(req.params.id)
    if (!testimonial) {
      return res.status(404).json({ message: 'Testimonial not found' })
    }

    await testimonial.destroy()
    res.json({ message: 'Testimonial deleted' })
  } catch (error) {
    console.error('Delete testimonial error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   PUT /api/admin/testimonials/:id/position
// @desc    Update testimonial position
// @access  Admin
router.put('/position/:id', adminProtect, async (req, res) => {
  try {
    const { position } = req.body
    const testimonial = await Testimonial.findByPk(req.params.id)
    if (!testimonial) {
      return res.status(404).json({ message: 'Testimonial not found' })
    }

    testimonial.position = position
    await testimonial.save()

    res.json(testimonial)
  } catch (error) {
    console.error('Update testimonial position error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   PUT /api/admin/testimonials/:id/visibility
// @desc    Toggle testimonial visibility
// @access  Admin
router.put('/visibility/:id', adminProtect, async (req, res) => {
  try {
    const testimonial = await Testimonial.findByPk(req.params.id)
    if (!testimonial) {
      return res.status(404).json({ message: 'Testimonial not found' })
    }

    testimonial.visible = !testimonial.visible
    await testimonial.save()

    res.json(testimonial)
  } catch (error) {
    console.error('Toggle testimonial visibility error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

export default router
