import express from 'express'
import ContentSetting from '../models/ContentSetting.js'
import { adminProtect } from '../middleware/adminAuth.js'

const router = express.Router()

// @route   GET /api/content/hero
// @desc    Get hero content (public)
// @access  Public
router.get('/hero', async (req, res) => {
  try {
    const settings = await ContentSetting.findAll({
      where: { section: 'hero' }
    })

    const heroContent = {}
    settings.forEach(setting => {
      heroContent[setting.key] = setting.value
    })

    res.json(heroContent)
  } catch (error) {
    console.error('Get hero content error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/content/featured-products
// @desc    Get featured product IDs (public)
// @access  Public
router.get('/featured-products', async (req, res) => {
  try {
    const setting = await ContentSetting.findOne({
      where: { section: 'featured', key: 'productIds' }
    })

    if (!setting || !setting.value) {
      return res.json({ productIds: [] })
    }

    const productIds = JSON.parse(setting.value)
    res.json({ productIds: Array.isArray(productIds) ? productIds : [] })
  } catch (error) {
    console.error('Get featured products error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/content
// @desc    Get all content settings (admin)
// @access  Admin
router.get('/all', adminProtect, async (req, res) => {
  try {
    const { section } = req.query
    const where = {}

    if (section) {
      where.section = section
    }

    const settings = await ContentSetting.findAll({
      where,
      order: [['section', 'ASC'], ['key', 'ASC']]
    })

    // Group by section
    const grouped = {}
    settings.forEach(setting => {
      if (!grouped[setting.section]) {
        grouped[setting.section] = {}
      }
      grouped[setting.section][setting.key] = setting.value
    })

    res.json(grouped)
  } catch (error) {
    console.error('Get admin content error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   PUT /api/content
// @desc    Update content settings (admin)
// @access  Admin
router.put('/update', adminProtect, async (req, res) => {
  try {
    const { section, content } = req.body

    if (!section || !content) {
      return res.status(400).json({ message: 'Section and content are required' })
    }

    // Update multiple settings
    const updates = await Promise.all(
      Object.keys(content).map(async (key) => {
        const [setting, created] = await ContentSetting.findOrCreate({
          where: { section, key },
          defaults: {
            section,
            key,
            value: String(content[key])
          }
        })

        if (!created) {
          setting.value = String(content[key])
          await setting.save()
        }

        return setting
      })
    )

    res.json({ message: 'Content updated', settings: updates })
  } catch (error) {
    console.error('Update content error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/admin/content/featured-products
// @desc    Get featured product IDs (admin)
// @access  Admin
router.get('/featured-products', adminProtect, async (req, res) => {
  try {
    const setting = await ContentSetting.findOne({
      where: { section: 'featured', key: 'productIds' }
    })

    if (!setting || !setting.value) {
      return res.json({ productIds: [] })
    }

    const productIds = JSON.parse(setting.value)
    res.json({ productIds: Array.isArray(productIds) ? productIds : [] })
  } catch (error) {
    console.error('Get featured products error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   PUT /api/admin/content/featured-products
// @desc    Update featured product IDs (admin)
// @access  Admin
router.put('/featured-products', adminProtect, async (req, res) => {
  try {
    const { productIds } = req.body

    if (!Array.isArray(productIds)) {
      return res.status(400).json({ message: 'productIds must be an array' })
    }

    const [setting, created] = await ContentSetting.findOrCreate({
      where: { section: 'featured', key: 'productIds' },
      defaults: {
        section: 'featured',
        key: 'productIds',
        value: JSON.stringify(productIds)
      }
    })

    if (!created) {
      setting.value = JSON.stringify(productIds)
      await setting.save()
    }

    res.json({ message: 'Featured products updated', productIds })
  } catch (error) {
    console.error('Update featured products error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

export default router

