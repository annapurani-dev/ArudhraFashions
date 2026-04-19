import express from 'express'
import { Op } from 'sequelize'
import Product from '../models/Product.js'
import Category from '../models/Category.js'
import Subcategory from '../models/Subcategory.js'
import { optionalAuth } from '../middleware/auth.js'

const router = express.Router()

// @route   GET /api/products
// @desc    Get all products with filters
// @access  Public
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      category,
      subcategory,
      minPrice,
      maxPrice,
      sizes,
      colors,
      onSale,
      featured,
      new: newProducts,
      search,
      page = 1,
      limit = 20
    } = req.query

    // Build filter object
    const where = { isActive: true }

    // Handle category filter (by slug or name)
    if (category) {
      const categoryLower = category.toLowerCase()
      const categoryRecord = await Category.findOne({
        where: { 
          [Op.or]: [
            { slug: categoryLower },
            { name: { [Op.iLike]: `%${category}%` } }
          ],
          isActive: true 
        }
      })
      if (categoryRecord) {
        where.categoryId = categoryRecord.id
      } else {
        // Return empty if category not found
        console.log(`Category not found: ${category}`)
        return res.json({
          products: [],
          page: Number(page),
          pages: 0,
          total: 0
        })
      }
    }

    // Handle subcategory filter (by slug or name)
    if (subcategory) {
      const subcategoryLower = subcategory.toLowerCase()
      const subcategoryRecord = await Subcategory.findOne({
        where: { 
          [Op.or]: [
            { slug: subcategoryLower },
            { name: { [Op.iLike]: `%${subcategory}%` } }
          ],
          isActive: true 
        }
      })
      if (subcategoryRecord) {
        where.subcategoryId = subcategoryRecord.id
      } else {
        // Return empty if subcategory not found
        console.log(`Subcategory not found: ${subcategory}`)
        return res.json({
          products: [],
          page: Number(page),
          pages: 0,
          total: 0
        })
      }
    }

    if (minPrice || maxPrice) {
      where.price = {}
      if (minPrice) where.price[Op.gte] = Number(minPrice)
      if (maxPrice) where.price[Op.lte] = Number(maxPrice)
    }

    if (sizes) {
      const sizeArray = Array.isArray(sizes) ? sizes : [sizes]
      where.sizes = { [Op.contains]: sizeArray }
    }

    if (colors) {
      const colorArray = Array.isArray(colors) ? colors : [colors]
      // For JSONB array, check if colors array contains any of the specified colors
      const colorConditions = colorArray.map(color => ({
        colors: {
          [Op.contains]: [{ name: color }]
        }
      }))
      
      if (colorConditions.length === 1) {
        where.colors = colorConditions[0].colors
      } else {
        // Multiple colors - use OR to find products with any of these colors
        const existingOr = where[Op.or]
        if (existingOr) {
          // If Op.or already exists, we need to combine with AND
          where[Op.and] = [
            { [Op.or]: existingOr },
            { [Op.or]: colorConditions }
          ]
          delete where[Op.or]
        } else {
          where[Op.or] = colorConditions
        }
      }
    }

    // Material filter (string field) - support single or multiple materials
    if (req.query.material) {
      const material = req.query.material
      const materialArray = Array.isArray(material) ? material : [material]
      const materialConditions = materialArray.map(m => ({
        material: { [Op.iLike]: `%${m}%` }
      }))

      if (materialConditions.length === 1) {
        where.material = materialConditions[0].material
      } else {
        const existingOr = where[Op.or]
        if (existingOr) {
          where[Op.and] = [
            { [Op.or]: existingOr },
            { [Op.or]: materialConditions }
          ]
          delete where[Op.or]
        } else {
          where[Op.or] = materialConditions
        }
      }
    }

    if (onSale === 'true' || onSale === true) {
      where.onSale = true
    }

    if (featured === 'true' || featured === true) {
      // Featured products - can be based on rating, sales, or a featured flag
      // For now, using high rating as featured OR featured flag
      // Check if Op.or already exists (from colors filter)
      if (where[Op.or]) {
        // Combine with existing Op.or using Op.and
        const existingOr = where[Op.or]
        where[Op.and] = [
          { [Op.or]: existingOr },
          { [Op.or]: [
            { rating: { [Op.gte]: 4.0 } },
            { featured: true }
          ]}
        ]
        delete where[Op.or]
      } else {
        where[Op.or] = [
          { rating: { [Op.gte]: 4.0 } },
          { featured: true }
        ]
      }
    }

    if (newProducts === 'true' || newProducts === true) {
      where.new = true
    }

    if (search) {
      const searchConditions = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ]
      
      // If Op.or or Op.and already exists, combine properly
      if (where[Op.or] && !where[Op.and]) {
        // Colors filter created Op.or, combine with AND
        where[Op.and] = [
          { [Op.or]: where[Op.or] },
          { [Op.or]: searchConditions }
        ]
        delete where[Op.or]
      } else if (where[Op.and]) {
        // Already have Op.and, add search to it
        where[Op.and].push({ [Op.or]: searchConditions })
      } else {
        where[Op.or] = searchConditions
      }
    }

    const offset = (page - 1) * limit

    const { count, rows: products } = await Product.findAndCountAll({
      where,
      include: [
        {
          association: 'category',
          required: false
        },
        {
          association: 'subcategory',
          required: false
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
      offset: Number(offset)
    })

    console.log(`Products API: Found ${count} products with filters:`, {
      category,
      subcategory,
      isActive: where.isActive,
      categoryId: where.categoryId,
      subcategoryId: where.subcategoryId,
      onSale: where.onSale,
      featured: where[Op.or] || where.rating,
      new: where.new,
      search: search
    })
    
    // Log first few products for debugging including price
    if (products.length > 0) {
      console.log('Sample products with price data:', products.slice(0, 3).map(p => ({
        id: p.id,
        name: p.name,
        price: p.price,
        priceType: typeof p.price,
        originalPrice: p.originalPrice,
        originalPriceType: typeof p.originalPrice,
        isActive: p.isActive,
        categoryId: p.categoryId,
        subcategoryId: p.subcategoryId
      })))
      // Log raw first product to see all fields
      const firstProduct = products[0]
      console.log('First product raw data:', {
        id: firstProduct.id,
        name: firstProduct.name,
        price: firstProduct.price,
        originalPrice: firstProduct.originalPrice,
        dataValues: firstProduct.dataValues
      })
    }

    // Ensure price is properly serialized (DECIMAL fields from PostgreSQL can be strings)
    const serializedProducts = products.map(product => {
      const productData = product.toJSON ? product.toJSON() : product
      // Ensure price is a number
      if (productData.price !== null && productData.price !== undefined) {
        productData.price = parseFloat(productData.price)
      }
      if (productData.originalPrice !== null && productData.originalPrice !== undefined) {
        productData.originalPrice = parseFloat(productData.originalPrice)
      }
      return productData
    })

    res.json({
      products: serializedProducts,
      page: Number(page),
      pages: Math.ceil(count / limit),
      total: count
    })
  } catch (error) {
    console.error('Get products error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/products/:id
// @desc    Get single product
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [
        {
          association: 'category',
          required: false
        },
        {
          association: 'subcategory',
          required: false
        }
      ]
    })

    if (!product || !product.isActive) {
      return res.status(404).json({ message: 'Product not found' })
    }

    res.json(product)
  } catch (error) {
    console.error('Get product error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/products/:id/related
// @desc    Get related products (exactly 3 random products grouped by category/subcategory)
// @access  Public
router.get('/:id/related', optionalAuth, async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [
        {
          association: 'category',
          required: false
        },
        {
          association: 'subcategory',
          required: false
        }
      ]
    })

    if (!product) {
      return res.status(404).json({ message: 'Product not found' })
    }

    let relatedProducts = []

    // Strategy 1: Try to get products from same category AND subcategory (preferred grouping)
    if (product.subcategoryId) {
      const sameSubcategoryProducts = await Product.findAll({
        where: {
          categoryId: product.categoryId,
          subcategoryId: product.subcategoryId,
          id: { [Op.ne]: product.id },
          isActive: true
        },
        include: [
          {
            association: 'category',
            required: false
          },
          {
            association: 'subcategory',
            required: false
          }
        ],
        order: [['createdAt', 'DESC']] // Order by date first for consistency
      })

      // Shuffle and take up to 3
      const shuffled = sameSubcategoryProducts.sort(() => Math.random() - 0.5)
      relatedProducts = shuffled.slice(0, 3)
    }

    // Strategy 2: If we don't have 3 products, fill with products from same category (different subcategory)
    if (relatedProducts.length < 3 && product.categoryId) {
      const alreadySelectedIds = [product.id, ...relatedProducts.map(p => p.id)]
      const sameCategoryProducts = await Product.findAll({
        where: {
          categoryId: product.categoryId,
          id: { [Op.notIn]: alreadySelectedIds },
          isActive: true
        },
        include: [
          {
            association: 'category',
            required: false
          },
          {
            association: 'subcategory',
            required: false
          }
        ],
        order: [['createdAt', 'DESC']]
      })

      // Shuffle and take remaining slots
      const shuffled = sameCategoryProducts.sort(() => Math.random() - 0.5)
      const needed = 3 - relatedProducts.length
      relatedProducts = [...relatedProducts, ...shuffled.slice(0, needed)]
    }

    // Strategy 3: If still not enough, fill with any active products (fallback)
    if (relatedProducts.length < 3) {
      const alreadySelectedIds = [product.id, ...relatedProducts.map(p => p.id)]
      const anyProducts = await Product.findAll({
        where: {
          id: { [Op.notIn]: alreadySelectedIds },
          isActive: true
        },
        include: [
          {
            association: 'category',
            required: false
          },
          {
            association: 'subcategory',
            required: false
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: 10 // Get more to shuffle from
      })

      // Shuffle and take remaining slots
      const shuffled = anyProducts.sort(() => Math.random() - 0.5)
      const needed = 3 - relatedProducts.length
      relatedProducts = [...relatedProducts, ...shuffled.slice(0, needed)]
    }

    // Ensure we return exactly 3 (or fewer if not enough products exist)
    const finalProducts = relatedProducts.slice(0, 3)

    // Serialize prices
    const serializedProducts = finalProducts.map(product => {
      const productData = product.toJSON ? product.toJSON() : product
      if (productData.price !== null && productData.price !== undefined) {
        productData.price = parseFloat(productData.price)
      }
      if (productData.originalPrice !== null && productData.originalPrice !== undefined) {
        productData.originalPrice = parseFloat(productData.originalPrice)
      }
      return productData
    })

    res.json(serializedProducts)
  } catch (error) {
    console.error('Get related products error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

export default router
