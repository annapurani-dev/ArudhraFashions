import express from 'express'
import { Op } from 'sequelize'
import Banner from '../models/Banner.js'
import { adminProtect } from '../middleware/adminAuth.js'

const router = express.Router()

// @route   GET /api/banners
// @desc    Get active banners (public)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const now = new Date()
    const banners = await Banner.findAll({
      where: {
        visible: true,
        [Op.and]: [
          {
            [Op.or]: [
              { startDate: null },
              { startDate: { [Op.lte]: now } }
            ]
          },
          {
            [Op.or]: [
              { endDate: null },
              { endDate: { [Op.gte]: now } }
            ]
          }
        ]
      },
      order: [['position', 'ASC']]
    })

    res.json(banners)
  } catch (error) {
    console.error('Get banners error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/admin/banners
// @desc    Get all banners (admin)
// @access  Admin
router.get('/all', adminProtect, async (req, res) => {
  try {
    const banners = await Banner.findAll({
      order: [['position', 'ASC'], ['createdAt', 'DESC']]
    })

    res.json(banners)
  } catch (error) {
    console.error('Get admin banners error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   POST /api/admin/banners
// @desc    Create banner
// @access  Admin
router.post('/create', adminProtect, async (req, res) => {
  try {
    const banner = await Banner.create(req.body)
    res.status(201).json(banner)
  } catch (error) {
    console.error('Create banner error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   PUT /api/admin/banners/:id
// @desc    Update banner
// @access  Admin
router.put('/update/:id', adminProtect, async (req, res) => {
  try {
    const banner = await Banner.findByPk(req.params.id)
    if (!banner) {
      return res.status(404).json({ message: 'Banner not found' })
    }

    await banner.update(req.body)
    await banner.reload()

    res.json(banner)
  } catch (error) {
    console.error('Update banner error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   DELETE /api/admin/banners/:id
// @desc    Delete banner
// @access  Admin
router.delete('/delete/:id', adminProtect, async (req, res) => {
  try {
    const banner = await Banner.findByPk(req.params.id)
    if (!banner) {
      return res.status(404).json({ message: 'Banner not found' })
    }

    await banner.destroy()
    res.json({ message: 'Banner deleted' })
  } catch (error) {
    console.error('Delete banner error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   PUT /api/admin/banners/:id/position
// @desc    Update banner position
// @access  Admin
router.put('/position/:id', adminProtect, async (req, res) => {
  try {
    const { position } = req.body
    const banner = await Banner.findByPk(req.params.id)
    if (!banner) {
      return res.status(404).json({ message: 'Banner not found' })
    }

    banner.position = position
    await banner.save()

    res.json(banner)
  } catch (error) {
    console.error('Update banner position error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   PUT /api/admin/banners/:id/visibility
// @desc    Toggle banner visibility
// @access  Admin
router.put('/visibility/:id', adminProtect, async (req, res) => {
  try {
    const banner = await Banner.findByPk(req.params.id)
    if (!banner) {
      return res.status(404).json({ message: 'Banner not found' })
    }

    banner.visible = !banner.visible
    await banner.save()

    res.json(banner)
  } catch (error) {
    console.error('Toggle banner visibility error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

export default router

