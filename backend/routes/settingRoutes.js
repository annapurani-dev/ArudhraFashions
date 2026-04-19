import express from 'express'
import Setting from '../models/Setting.js'
import { adminProtect } from '../middleware/adminAuth.js'

const router = express.Router()

// @route   GET /api/settings
// @desc    Get public settings
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { category, key } = req.query
    const where = {}

    if (category) {
      where.category = category
    }

    if (key) {
      where.key = key
    }

    const settings = await Setting.findAll({ where })

    // Convert to key-value object
    const settingsObj = {}
    settings.forEach(setting => {
      let value = setting.value
      
      // Parse value based on type
      if (setting.type === 'number') {
        value = parseFloat(value)
      } else if (setting.type === 'boolean') {
        value = value === 'true' || value === '1'
      } else if (setting.type === 'json') {
        try {
          value = JSON.parse(value)
        } catch (e) {
          value = setting.value
        }
      }

      settingsObj[setting.key] = value
    })

    res.json(settingsObj)
  } catch (error) {
    console.error('Get settings error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/settings/:category
// @desc    Get settings by category
// @access  Public
router.get('/:category', async (req, res) => {
  try {
    const { category } = req.params
    
    // If category is 'all', return all settings without filtering
    const where = category === 'all' ? {} : { category }
    
    const settings = await Setting.findAll({
      where
    })

    const settingsObj = {}
    settings.forEach(setting => {
      let value = setting.value
      
      if (setting.type === 'number') {
        value = parseFloat(value)
      } else if (setting.type === 'boolean') {
        value = value === 'true' || value === '1'
      } else if (setting.type === 'json') {
        try {
          value = JSON.parse(value)
        } catch (e) {
          value = setting.value
        }
      }

      settingsObj[setting.key] = value
    })

    res.json(settingsObj)
  } catch (error) {
    console.error('Get settings by category error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/admin/settings/all
// @desc    Get all settings (admin)
// @access  Admin
router.get('/all', adminProtect, async (req, res) => {
  try {
    const { category } = req.query
    const where = {}

    // Only filter by category if it's provided and not 'all'
    if (category && category !== 'all') {
      where.category = category
    }

    const settings = await Setting.findAll({
      where,
      order: [['category', 'ASC'], ['key', 'ASC']]
    })

    res.json(settings)
  } catch (error) {
    console.error('Get admin settings error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   PUT /api/admin/settings
// @desc    Update settings (admin)
// @access  Admin
router.put('/update', adminProtect, async (req, res) => {
  try {
    const settings = req.body

    // Update multiple settings
    const updates = await Promise.all(
      Object.keys(settings).map(async (key) => {
        const [setting, created] = await Setting.findOrCreate({
          where: { key },
          defaults: {
            key,
            value: String(settings[key]),
            type: typeof settings[key] === 'number' ? 'number' : 
                  typeof settings[key] === 'boolean' ? 'boolean' :
                  typeof settings[key] === 'object' ? 'json' : 'string',
            category: 'general'
          }
        })

        if (!created) {
          setting.value = typeof settings[key] === 'object' 
            ? JSON.stringify(settings[key])
            : String(settings[key])
          setting.type = typeof settings[key] === 'number' ? 'number' : 
                        typeof settings[key] === 'boolean' ? 'boolean' :
                        typeof settings[key] === 'object' ? 'json' : 'string'
          await setting.save()
        }

        return setting
      })
    )

    res.json({ message: 'Settings updated', settings: updates })
  } catch (error) {
    console.error('Update settings error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   PUT /api/admin/settings/:key
// @desc    Update single setting (admin)
// @access  Admin
router.put('/update/:key', adminProtect, async (req, res) => {
  try {
    const { key } = req.params
    const { value, type, category, description } = req.body

    const [setting, created] = await Setting.findOrCreate({
      where: { key },
      defaults: {
        key,
        value: String(value),
        type: type || 'string',
        category: category || 'general',
        description: description || null
      }
    })

    if (!created) {
      setting.value = String(value)
      if (type) setting.type = type
      if (category) setting.category = category
      if (description !== undefined) setting.description = description
      await setting.save()
    }

    res.json(setting)
  } catch (error) {
    console.error('Update setting error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

export default router

