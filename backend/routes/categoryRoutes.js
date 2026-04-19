import express from 'express'
import { Op } from 'sequelize'
import Category from '../models/Category.js'
import Subcategory from '../models/Subcategory.js'
import Product from '../models/Product.js'
import { adminProtect } from '../middleware/adminAuth.js'

const router = express.Router()
// Simple UUID v4-ish validator to avoid DB errors on malformed ids
const isValidUuid = (id) => {
  if (!id || typeof id !== 'string') return false
  // Accept standard UUID formats (with or without dashes)
  const uuidRegex = /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}

// @route   GET /api/categories
// @desc    Get all active categories (public)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const categories = await Category.findAll({
      where: { isActive: true },
      include: [{
        association: 'subcategories',
        where: { isActive: true },
        required: false
      }],
      order: [['position', 'ASC'], ['createdAt', 'DESC']]
    })

    res.json(categories)
  } catch (error) {
    console.error('Get categories error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/categories/all
// @desc    Get all categories (admin - includes inactive)
// @access  Admin
router.get('/all', adminProtect, async (req, res) => {
  try {
    const categories = await Category.findAll({
      include: [{
        association: 'subcategories',
        where: {},
        required: false
      }],
      order: [['position', 'ASC'], ['createdAt', 'DESC']]
    })

    res.json(categories)
  } catch (error) {
    console.error('Get admin categories error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/categories/:categoryId/subcategories
// @desc    Get subcategories for a category
// @access  Public
router.get('/:categoryId/subcategories', async (req, res) => {
  try {
    const subcategories = await Subcategory.findAll({
      where: { 
        categoryId: req.params.categoryId,
        isActive: true 
      },
      order: [['position', 'ASC'], ['createdAt', 'DESC']]
    })

    res.json(subcategories)
  } catch (error) {
    console.error('Get subcategories error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

router.post('/create', adminProtect, async (req, res) => {
  try {
    const { name, description, image, position, customFilters } = req.body

    if (!name) {
      return res.status(400).json({ message: 'Category name is required' })
    }

    const slug = name.toLowerCase().replace(/\s+/g, '-')

    const category = await Category.create({
      name,
      slug,
      description,
      image,
      customFilters: customFilters || [],
      position: position || 0,
      isActive: true
    })

    res.status(201).json(category)
  } catch (error) {
    console.error('Create category error:', error)
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'Category already exists' })
    }
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   PUT /api/categories/:id
// @desc    Update category
// @access  Admin
router.put('/update/:id', adminProtect, async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id, {
      include: [{
        association: 'subcategories',
        required: false
      }]
    })
    if (!category) {
      return res.status(404).json({ message: 'Category not found' })
    }

    const updateData = { ...req.body }
    if (updateData.name) {
      updateData.slug = updateData.name.toLowerCase().replace(/\s+/g, '-')
    }

    await category.update(updateData)
    await category.reload({
      include: [{
        association: 'subcategories',
        required: false
      }]
    })

    res.json(category)
  } catch (error) {
    console.error('Update category error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   DELETE /api/categories/:id
// @desc    Delete category
// @access  Admin
router.delete('/delete/:id', adminProtect, async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id)
    if (!category) {
      return res.status(404).json({ message: 'Category not found' })
    }

    // Check if category has subcategories
    const subcategories = await Subcategory.count({
      where: { categoryId: category.id }
    })

    if (subcategories > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete category with subcategories. Please delete subcategories first.' 
      })
    }

    await category.destroy()
    res.json({ message: 'Category deleted' })
  } catch (error) {
    console.error('Delete category error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   POST /api/categories/:id/subcategories
// @desc    Add subcategory
// @access  Admin
router.post('/subcategory/:categoryId', adminProtect, async (req, res) => {
  try {
    const { categoryId } = req.params
    const { name, description, position } = req.body

    if (!name) {
      return res.status(400).json({ message: 'Subcategory name is required' })
    }

    const category = await Category.findByPk(categoryId)
    if (!category) {
      return res.status(404).json({ message: 'Category not found' })
    }

    const slug = name.toLowerCase().replace(/\s+/g, '-')

    const subcategory = await Subcategory.create({
      categoryId,
      name,
      slug,
      description,
      position: position || 0,
      isActive: true
    })

    res.status(201).json(subcategory)
  } catch (error) {
    console.error('Create subcategory error:', error)
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'Subcategory already exists in this category' })
    }
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   PUT /api/categories/:id/subcategories/:subId
// @desc    Update subcategory
// @access  Admin
router.put('/subcategory/:subId', adminProtect, async (req, res) => {
  try {
    console.log(`[CategoryRoutes] Update subcategory requested by admin=${req.admin?.email || req.admin?.id} subId=${req.params.subId} body=${JSON.stringify(req.body)}`)
    if (!isValidUuid(req.params.subId)) {
      return res.status(400).json({ message: 'Invalid subcategory id' })
    }
    const subcategory = await Subcategory.findByPk(req.params.subId, {
      include: [{
        association: 'category',
        required: false
      }]
    })
    if (!subcategory) {
      return res.status(404).json({ message: 'Subcategory not found' })
    }

    const updateData = { ...req.body }
    if (updateData.name) {
      updateData.slug = updateData.name.toLowerCase().replace(/\s+/g, '-')
    }

    await subcategory.update(updateData)
    await subcategory.reload({
      include: [{
        association: 'category',
        required: false
      }]
    })

    res.json(subcategory)
  } catch (error) {
    console.error('Update subcategory error:', error)
    // Return more detailed error during debugging so frontend can show it.
    // NOTE: remove stack in production.
    res.status(500).json({ message: error.message || 'Server error', stack: error.stack })
  }
})

// @route   DELETE /api/categories/:id/subcategories/:subId
// @desc    Delete subcategory
// @access  Admin
router.delete('/subcategory/:subId', adminProtect, async (req, res) => {
  try {
    console.log(`[CategoryRoutes] Delete subcategory requested by admin=${req.admin?.email || req.admin?.id} subId=${req.params.subId}`)
    if (!isValidUuid(req.params.subId)) {
      return res.status(400).json({ message: 'Invalid subcategory id' })
    }
    const subcategory = await Subcategory.findByPk(req.params.subId)
    if (!subcategory) {
      return res.status(404).json({ message: 'Subcategory not found' })
    }
    // Prevent deletion if products reference this subcategory
    const productCount = await Product.count({ where: { subcategoryId: subcategory.id } })
    console.log(`[CategoryRoutes] subcategory=${subcategory.id} productCount=${productCount}`)
    const force = req.query.force === 'true'
    if (productCount > 0 && !force) {
      return res.status(400).json({ message: 'Cannot delete subcategory with associated products. Reassign or delete those products first.', productCount })
    }

    if (productCount > 0 && force) {
      // Reassign products to an "Uncategorized" subcategory within the same category (create if missing)
      const sequelize = Subcategory.sequelize
      await sequelize.transaction(async (t) => {
        const [fallback, created] = await Subcategory.findOrCreate({
          where: {
            categoryId: subcategory.categoryId,
            slug: 'uncategorized'
          },
          defaults: {
            categoryId: subcategory.categoryId,
            name: 'Uncategorized',
            slug: 'uncategorized',
            description: 'Fallback subcategory',
            position: 0,
            isActive: true
          },
          transaction: t
        })

        await Product.update(
          { subcategoryId: fallback.id },
          { where: { subcategoryId: subcategory.id }, transaction: t }
        )

        await subcategory.destroy({ transaction: t })
      })

      return res.json({ message: 'Subcategory deleted and products reassigned to Uncategorized' })
    }

    // No products -> safe to delete
    await subcategory.destroy()
    res.json({ message: 'Subcategory deleted' })
  } catch (error) {
    console.error('Delete subcategory error:', error)
    // Return detailed error for debugging.
    res.status(500).json({ message: error.message || 'Server error', stack: error.stack })
  }
})

export default router

