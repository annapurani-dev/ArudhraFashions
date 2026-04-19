import express from 'express'
import { Op } from 'sequelize'
import NewArrival from '../models/NewArrival.js'
import { adminProtect } from '../middleware/adminAuth.js'
import uploadMemory from '../middleware/uploadMemory.js'
import Image from '../models/Image.js'

const router = express.Router()

// @route   GET /api/new-arrivals
// @desc    Get visible new arrivals (public)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const arrivals = await NewArrival.findAll({
      where: {
        visible: true
      },
      order: [['position', 'ASC'], ['createdAt', 'DESC']]
    })

    res.json(arrivals)
  } catch (error) {
    console.error('Get new arrivals error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/admin/new-arrivals
// @desc    Get all new arrivals (admin)
// @access  Admin
router.get('/all', adminProtect, async (req, res) => {
  try {
    const arrivals = await NewArrival.findAll({
      order: [['position', 'ASC'], ['createdAt', 'DESC']]
    })

    res.json(arrivals)
  } catch (error) {
    console.error('Get admin new arrivals error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   POST /api/admin/new-arrivals
// @desc    Create new arrival
// @access  Admin
router.post('/create', adminProtect, uploadMemory.single('image'), async (req, res) => {
  try {
    const { title, description, price, originalPrice, link, position } = req.body
    
    if (!title || !price) {
      return res.status(400).json({ message: 'Title and price are required' })
    }

    // Get image path from upload or from body (if URL provided)
    let image = req.body.image
    if (req.file) {
      // Save file buffer to DB and reference by API path
      const img = await Image.create({
        filename: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        data: req.file.buffer
      })
      image = `/api/images/${img.id}`
    }

    if (!image) {
      return res.status(400).json({ message: 'Image is required' })
    }

    // Get max position to add at end if not specified
    let finalPosition = position
    if (!finalPosition) {
      const maxPosition = await NewArrival.max('position')
      finalPosition = maxPosition !== null ? maxPosition + 1 : 0
    }

    const arrival = await NewArrival.create({
      image,
      title,
      description: description || null,
      price: parseFloat(price),
      originalPrice: originalPrice ? parseFloat(originalPrice) : null,
      link: link || null,
      position: finalPosition,
      visible: true
    })

    res.status(201).json(arrival)
  } catch (error) {
    console.error('Create new arrival error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   PUT /api/admin/new-arrivals/:id
// @desc    Update new arrival
// @access  Admin
router.put('/update/:id', adminProtect, uploadMemory.single('image'), async (req, res) => {
  try {
    const arrival = await NewArrival.findByPk(req.params.id)
    if (!arrival) {
      return res.status(404).json({ message: 'New arrival not found' })
    }

    const { title, description, price, originalPrice, link, position } = req.body

    // Update image if new one uploaded
    if (req.file) {
      const img = await Image.create({
        filename: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        data: req.file.buffer
      })
      arrival.image = `/api/images/${img.id}`
    } else if (req.body.image) {
      arrival.image = req.body.image
    }

    if (title) arrival.title = title
    if (description !== undefined) arrival.description = description
    if (price) arrival.price = parseFloat(price)
    if (originalPrice !== undefined) arrival.originalPrice = originalPrice ? parseFloat(originalPrice) : null
    if (link !== undefined) arrival.link = link
    if (position !== undefined) arrival.position = parseInt(position)

    await arrival.save()
    await arrival.reload()

    res.json(arrival)
  } catch (error) {
    console.error('Update new arrival error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   DELETE /api/admin/new-arrivals/:id
// @desc    Delete new arrival
// @access  Admin
router.delete('/delete/:id', adminProtect, async (req, res) => {
  try {
    const arrival = await NewArrival.findByPk(req.params.id)
    if (!arrival) {
      return res.status(404).json({ message: 'New arrival not found' })
    }

    await arrival.destroy()
    res.json({ message: 'New arrival deleted' })
  } catch (error) {
    console.error('Delete new arrival error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   PUT /api/admin/new-arrivals/:id/position
// @desc    Update new arrival position
// @access  Admin
router.put('/position/:id', adminProtect, async (req, res) => {
  try {
    const { position } = req.body
    const arrival = await NewArrival.findByPk(req.params.id)
    if (!arrival) {
      return res.status(404).json({ message: 'New arrival not found' })
    }

    arrival.position = position
    await arrival.save()

    res.json(arrival)
  } catch (error) {
    console.error('Update new arrival position error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   PUT /api/admin/new-arrivals/:id/visibility
// @desc    Toggle new arrival visibility
// @access  Admin
router.put('/visibility/:id', adminProtect, async (req, res) => {
  try {
    const arrival = await NewArrival.findByPk(req.params.id)
    if (!arrival) {
      return res.status(404).json({ message: 'New arrival not found' })
    }

    arrival.visible = !arrival.visible
    await arrival.save()

    res.json(arrival)
  } catch (error) {
    console.error('Toggle new arrival visibility error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

export default router
