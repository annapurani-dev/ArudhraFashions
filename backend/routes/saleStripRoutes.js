import express from 'express'
import { Op } from 'sequelize'
import SaleStrip from '../models/SaleStrip.js'
import { adminProtect } from '../middleware/adminAuth.js'

const router = express.Router()

// @route   GET /api/sale-strips
// @desc    Get active sale strips (public) - returns all active strips
// @access  Public
router.get('/', async (req, res) => {
  try {
    const now = new Date()
    const saleStrips = await SaleStrip.findAll({
      where: {
        visible: true,
        startDate: {
          [Op.lte]: now
        },
        endDate: {
          [Op.gte]: now
        }
      },
      order: [['createdAt', 'DESC']]
    })

    res.json(saleStrips)
  } catch (error) {
    console.error('Get sale strips error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/admin/sale-strips
// @desc    Get all sale strips (admin)
// @access  Admin
router.get('/all', adminProtect, async (req, res) => {
  try {
    const saleStrips = await SaleStrip.findAll({
      order: [['createdAt', 'DESC']]
    })

    res.json(saleStrips)
  } catch (error) {
    console.error('Get admin sale strips error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   POST /api/admin/sale-strips
// @desc    Create sale strip
// @access  Admin
router.post('/create', adminProtect, async (req, res) => {
  try {
    const { title, description, discount, startDate, endDate, backgroundColor, textColor } = req.body
    
    if (!title || !startDate || !endDate) {
      return res.status(400).json({ message: 'Title, start date, and end date are required' })
    }

    const start = new Date(startDate)
    const end = new Date(endDate)

    if (end <= start) {
      return res.status(400).json({ message: 'End date must be after start date' })
    }

    const saleStrip = await SaleStrip.create({
      title,
      description: description || null,
      discount: discount || null,
      startDate: start,
      endDate: end,
      backgroundColor: backgroundColor || '#ff0000',
      textColor: textColor || '#ffffff',
      visible: true
    })

    res.status(201).json(saleStrip)
  } catch (error) {
    console.error('Create sale strip error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   PUT /api/admin/sale-strips/:id
// @desc    Update sale strip
// @access  Admin
router.put('/update/:id', adminProtect, async (req, res) => {
  try {
    const saleStrip = await SaleStrip.findByPk(req.params.id)
    if (!saleStrip) {
      return res.status(404).json({ message: 'Sale strip not found' })
    }

    const { title, description, discount, startDate, endDate, backgroundColor, textColor } = req.body

    if (title) saleStrip.title = title
    if (description !== undefined) saleStrip.description = description
    if (discount !== undefined) saleStrip.discount = discount
    if (backgroundColor) saleStrip.backgroundColor = backgroundColor
    if (textColor) saleStrip.textColor = textColor

    if (startDate) {
      const start = new Date(startDate)
      saleStrip.startDate = start
    }

    if (endDate) {
      const end = new Date(endDate)
      saleStrip.endDate = end
    }

    // Validate dates if both are being updated
    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      if (end <= start) {
        return res.status(400).json({ message: 'End date must be after start date' })
      }
    } else if (endDate && saleStrip.startDate) {
      const end = new Date(endDate)
      if (end <= saleStrip.startDate) {
        return res.status(400).json({ message: 'End date must be after start date' })
      }
    } else if (startDate && saleStrip.endDate) {
      const start = new Date(startDate)
      if (saleStrip.endDate <= start) {
        return res.status(400).json({ message: 'End date must be after start date' })
      }
    }

    await saleStrip.save()
    await saleStrip.reload()

    res.json(saleStrip)
  } catch (error) {
    console.error('Update sale strip error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   DELETE /api/admin/sale-strips/:id
// @desc    Delete sale strip
// @access  Admin
router.delete('/delete/:id', adminProtect, async (req, res) => {
  try {
    const saleStrip = await SaleStrip.findByPk(req.params.id)
    if (!saleStrip) {
      return res.status(404).json({ message: 'Sale strip not found' })
    }

    await saleStrip.destroy()
    res.json({ message: 'Sale strip deleted' })
  } catch (error) {
    console.error('Delete sale strip error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   PUT /api/admin/sale-strips/:id/visibility
// @desc    Toggle sale strip visibility
// @access  Admin
router.put('/visibility/:id', adminProtect, async (req, res) => {
  try {
    const saleStrip = await SaleStrip.findByPk(req.params.id)
    if (!saleStrip) {
      return res.status(404).json({ message: 'Sale strip not found' })
    }

    saleStrip.visible = !saleStrip.visible
    await saleStrip.save()

    res.json(saleStrip)
  } catch (error) {
    console.error('Toggle sale strip visibility error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

export default router
