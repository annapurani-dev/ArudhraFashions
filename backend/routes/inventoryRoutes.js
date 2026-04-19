import express from 'express'
import { Op } from 'sequelize'
import Product from '../models/Product.js'
import InventoryLog from '../models/InventoryLog.js'
import { adminProtect } from '../middleware/adminAuth.js'

const router = express.Router()

// @route   GET /api/inventory
// @desc    Get inventory status
// @access  Admin
router.get('/all', adminProtect, async (req, res) => {
  try {
    const { search, status, page = 1, limit = 20 } = req.query
    const where = { isActive: true }

    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } }
      ]
    }

    // Apply status filter in WHERE clause for better performance
    if (status) {
      if (status === 'in_stock') {
        where.stockCount = { [Op.gt]: 20 }
      } else if (status === 'low_stock') {
        where[Op.and] = [
          { stockCount: { [Op.gt]: 0 } },
          { stockCount: { [Op.lte]: 3 } }
        ]
      } else if (status === 'out_of_stock') {
        where.stockCount = 0
      }
    }

    const offset = (page - 1) * limit
    const { count, rows: products } = await Product.findAndCountAll({
      where,
      attributes: ['id', 'name', 'stockCount', 'inStock', 'updatedAt'],
      include: [
        {
          association: 'category',
          required: false,
          attributes: ['id', 'name']
        },
        {
          association: 'subcategory',
          required: false,
          attributes: ['id', 'name']
        }
      ],
      order: [['name', 'ASC']],
      limit: Number(limit),
      offset: Number(offset)
    })

    // Add inventory status
    const inventory = products.map(product => {
      let status = 'in-stock'
      if (product.stockCount === 0) {
        status = 'out-of-stock'
      } else if (product.stockCount <= 3) { // Low stock threshold
        status = 'low-stock'
      }

      return {
        id: product.id,
        productName: product.name,
        name: product.name, // Keep for backward compatibility
        sku: product.id.substring(0, 8).toUpperCase(), // Generate SKU from product ID
        stockCount: product.stockCount,
        stock: product.stockCount, // Keep for backward compatibility
        category: `${product.category?.name || 'N/A'} - ${product.subcategory?.name || 'N/A'}`,
        lowStockThreshold: 3, // Can be made configurable
        status,
        updatedAt: product.updatedAt
      }
    })

    res.json({
      inventory,
      page: Number(page),
      pages: Math.ceil(count / limit),
      total: count
    })
  } catch (error) {
    console.error('Get inventory error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   PUT /api/inventory/:productId
// @desc    Update stock
// @access  Admin
router.put('/update/:productId', adminProtect, async (req, res) => {
  try {
    const { productId } = req.params
    const { stockCount, type, reason } = req.body

    const product = await Product.findByPk(productId)
    if (!product) {
      return res.status(404).json({ message: 'Product not found' })
    }

    const oldStock = product.stockCount
    let newStock = stockCount

    // If type is provided, adjust stock
    if (type) {
      if (type === 'in' || type === 'restock') {
        newStock = oldStock + (stockCount || 0)
      } else if (type === 'out' || type === 'sale') {
        newStock = oldStock - (stockCount || 0)
      } else if (type === 'adjustment' || type === 'return') {
        if (type === 'adjustment') {
          newStock = stockCount
        } else if (type === 'return') {
          newStock = oldStock + (stockCount || 0)
        }
      }
    }

    if (newStock < 0) {
      return res.status(400).json({ message: 'Stock cannot be negative' })
    }

    product.stockCount = newStock
    product.inStock = newStock > 0
    await product.save()

    // Log inventory change
    if (type) {
      // Map frontend types to backend log types
      let logType = type
      if (type === 'restock') logType = 'in'
      if (type === 'sale') logType = 'out'
      if (type === 'return') logType = 'in'
      
      await InventoryLog.create({
        productId,
        quantity: Math.abs(newStock - oldStock),
        type: logType,
        reason: reason || `Stock ${type}`,
        createdBy: req.admin?.id
      })
    }

    res.json(product)
  } catch (error) {
    console.error('Update inventory error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/inventory/low-stock
// @desc    Get low stock products
// @access  Admin
router.get('/low-stock', adminProtect, async (req, res) => {
  try {
    const { threshold = 3 } = req.query

    const products = await Product.findAll({
      where: {
        isActive: true,
        stockCount: {
          [Op.lte]: Number(threshold)
        }
      },
      include: [
        {
          association: 'category',
          required: false,
          attributes: ['id', 'name']
        },
        {
          association: 'subcategory',
          required: false,
          attributes: ['id', 'name']
        }
      ],
      order: [['stockCount', 'ASC']]
    })

    const lowStock = products.map(product => ({
      id: product.id,
      productName: product.name,
      name: product.name,
      sku: product.id.substring(0, 8).toUpperCase(),
      stockCount: product.stockCount,
      stock: product.stockCount,
      category: `${product.category?.name || 'N/A'} - ${product.subcategory?.name || 'N/A'}`,
      threshold: Number(threshold),
      status: product.stockCount === 0 ? 'out-of-stock' : 'low-stock',
      updatedAt: product.updatedAt
    }))

    res.json(lowStock)
  } catch (error) {
    console.error('Get low stock error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/inventory/out-of-stock
// @desc    Get out of stock products
// @access  Admin
router.get('/out-of-stock', adminProtect, async (req, res) => {
  try {
    const products = await Product.findAll({
      where: {
        isActive: true,
        stockCount: 0
      },
      include: [
        {
          association: 'category',
          required: false,
          attributes: ['id', 'name']
        },
        {
          association: 'subcategory',
          required: false,
          attributes: ['id', 'name']
        }
      ],
      order: [['name', 'ASC']]
    })

    const outOfStock = products.map(product => ({
      id: product.id,
      productName: product.name,
      name: product.name,
      sku: product.id.substring(0, 8).toUpperCase(),
      stockCount: 0,
      stock: 0,
      category: `${product.category?.name || 'N/A'} - ${product.subcategory?.name || 'N/A'}`,
      status: 'out-of-stock',
      updatedAt: product.updatedAt
    }))

    res.json(outOfStock)
  } catch (error) {
    console.error('Get out of stock error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

export default router

