import dotenv from 'dotenv'
import Product from '../models/Product.js'
import Category from '../models/Category.js'
import Subcategory from '../models/Subcategory.js'
import User from '../models/User.js'
import connectDB from '../config/db.js'

dotenv.config()

const products = [
  // Women - Dresses
  {
    name: 'Elegant Summer Dress',
    categoryName: 'Women',
    subcategoryName: 'Dresses',
    price: 2499.00,
    originalPrice: 3499.00,
    onSale: true,
    description: 'A beautiful summer dress perfect for any occasion.',
    fullDescription: 'This elegant summer dress is crafted from premium 100% cotton fabric, ensuring breathability and comfort throughout the day.',
    images: [
      'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&h=800&fit=crop',
      'https://images.unsplash.com/photo-1566479179817-1c6d2c05b93e?w=600&h=800&fit=crop'
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: [
      { name: 'Burgundy', value: '#800020' },
      { name: 'Gold', value: '#D4AF37' }
    ],
    inStock: true,
    stockCount: 15,
    rating: 4.5,
    reviews: 24,
    brand: 'Arudhra Fashions',
    material: '100% Premium Cotton',
    care: 'Machine Wash Cold, Tumble Dry Low'
  },
  {
    name: 'Floral Print Maxi Dress',
    categoryName: 'Women',
    subcategoryName: 'Dresses',
    price: 2199.00,
    description: 'Beautiful floral print maxi dress for summer.',
    images: ['https://images.unsplash.com/photo-1566479179817-1c6d2c05b93e?w=600&h=800&fit=crop'],
    sizes: ['S', 'M', 'L', 'XL'],
    colors: [{ name: 'Pink', value: '#FFB6C1' }],
    inStock: true,
    stockCount: 10,
    rating: 4.6,
    reviews: 15
  },
  // Women - Tops
  {
    name: 'Classic White Shirt',
    categoryName: 'Women',
    subcategoryName: 'Tops',
    price: 1299.00,
    description: 'Timeless classic white shirt.',
    images: ['https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&h=800&fit=crop'],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: [{ name: 'White', value: '#FFFFFF' }],
    inStock: true,
    stockCount: 20,
    rating: 4.8,
    reviews: 18
  },
  // Teen - Dresses
  {
    name: 'Trendy Teen Dress',
    categoryName: 'Teen',
    subcategoryName: 'Dresses',
    price: 1699.00,
    description: 'Trendy dress perfect for teens.',
    images: ['https://images.unsplash.com/photo-1566479179817-1c6d2c05b93e?w=600&h=800&fit=crop'],
    sizes: ['XS', 'S', 'M', 'L'],
    colors: [{ name: 'Blue', value: '#4169E1' }],
    inStock: true,
    stockCount: 12,
    rating: 4.5,
    reviews: 20
  },
  // Girls - Dresses
  {
    name: 'Princess Dress',
    categoryName: 'Girls',
    subcategoryName: 'Dresses',
    price: 1399.00,
    originalPrice: 1999.00,
    onSale: true,
    description: 'Beautiful princess dress for little girls.',
    images: ['https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&h=800&fit=crop'],
    sizes: ['XS', 'S', 'M'],
    colors: [{ name: 'Pink', value: '#FFB6C1' }],
    inStock: true,
    stockCount: 8,
    rating: 4.8,
    reviews: 22
  }
]

const seedData = async () => {
  try {
    await connectDB()
    
    // Load categories and subcategories
    const categories = await Category.findAll()
    const subcategories = await Subcategory.findAll()
    
    // Create mapping for quick lookup
    const categoryMap = {}
    categories.forEach(cat => {
      categoryMap[cat.name] = cat.id
    })
    
    const subcategoryMap = {}
    subcategories.forEach(subcat => {
      const key = `${subcat.categoryId}-${subcat.name}`
      subcategoryMap[key] = subcat.id
    })
    
    // Map products to use categoryId and subcategoryId
    const productsWithIds = await Promise.all(products.map(async (product) => {
      const categoryId = categoryMap[product.categoryName]
      if (!categoryId) {
        throw new Error(`Category not found: ${product.categoryName}`)
      }
      
      const subcategoryId = subcategoryMap[`${categoryId}-${product.subcategoryName}`]
      if (!subcategoryId) {
        throw new Error(`Subcategory not found: ${product.subcategoryName} under ${product.categoryName}`)
      }
      
      // Remove categoryName and subcategoryName, add IDs
      const { categoryName, subcategoryName, ...rest } = product
      return {
        ...rest,
        categoryId,
        subcategoryId
      }
    }))
    
    // Clear existing products (delete all records)
    const deletedCount = await Product.destroy({ where: {} })
    if (deletedCount > 0) {
      console.log(`Cleared ${deletedCount} existing products`)
    }
    
    // Insert products
    const createdProducts = await Product.bulkCreate(productsWithIds)
    console.log(`✅ Inserted ${createdProducts.length} products`)
    
    // Create test users
    const testUser1 = await User.findOne({ where: { mobile: '9876543210' } })
    if (!testUser1) {
      await User.create({
        mobile: '9876543210',
        password: 'password123',
        name: 'Test User',
        email: 'test@example.com'
      })
      console.log('✅ Created test user: 9876543210 / password123')
    } else {
      console.log('ℹ️  Test user already exists: 9876543210')
    }

    const testUser2 = await User.findOne({ where: { mobile: '1234567890' } })
    if (!testUser2) {
      await User.create({
        mobile: '1234567890',
        password: 'user1234',
        name: 'Demo User',
        email: 'demo@example.com'
      })
      console.log('✅ Created demo user: 1234567890 / user1234')
    } else {
      console.log('ℹ️  Demo user already exists: 1234567890')
    }
    
    console.log('Data seeded successfully!')
    process.exit(0)
  } catch (error) {
    console.error('Error seeding data:', error)
    process.exit(1)
  }
}

seedData()
