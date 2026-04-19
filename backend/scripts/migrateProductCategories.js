import dotenv from 'dotenv'
import { sequelize } from '../config/db.js'
import Category from '../models/Category.js'
import Subcategory from '../models/Subcategory.js'

dotenv.config()

const migrateProductCategories = async () => {
  try {
    await sequelize.authenticate()
    console.log('PostgreSQL Connected successfully')
    
    // Check if migration is needed
    const [results] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'products' 
      AND column_name IN ('category', 'subcategory', 'categoryId', 'subcategoryId')
    `)
    
    const columns = results.map(r => r.column_name)
    const hasOldColumns = columns.includes('category') || columns.includes('subcategory')
    const hasNewColumns = columns.includes('categoryId') && columns.includes('subcategoryId')
    
    if (!hasOldColumns && hasNewColumns) {
      console.log('✅ Migration already completed - products table has new structure')
      process.exit(0)
    }
    
    if (hasOldColumns && !hasNewColumns) {
      console.log('🔄 Starting migration: Converting ENUM columns to foreign keys...')
      
      // Step 1: Add new columns
      console.log('Step 1: Adding categoryId and subcategoryId columns...')
      await sequelize.query(`
        ALTER TABLE products 
        ADD COLUMN IF NOT EXISTS "categoryId" UUID,
        ADD COLUMN IF NOT EXISTS "subcategoryId" UUID
      `)
      
      // Step 2: Load categories and subcategories for mapping
      console.log('Step 2: Loading categories and subcategories...')
      const categories = await Category.findAll()
      const subcategories = await Subcategory.findAll()
      
      const categoryMap = {}
      categories.forEach(cat => {
        categoryMap[cat.name] = cat.id
      })
      
      const subcategoryMap = {}
      subcategories.forEach(subcat => {
        const key = `${subcat.categoryId}-${subcat.name}`
        subcategoryMap[key] = subcat.id
      })
      
      // Step 3: Migrate existing data (if any products exist with old structure)
      console.log('Step 3: Migrating existing product data...')
      const [products] = await sequelize.query(`
        SELECT id, category, subcategory 
        FROM products 
        WHERE category IS NOT NULL OR subcategory IS NOT NULL
      `)
      
      if (products.length > 0) {
        console.log(`Found ${products.length} products to migrate...`)
        for (const product of products) {
          const categoryId = categoryMap[product.category]
          const category = categories.find(c => c.id === categoryId)
          const subcategoryId = subcategoryMap[`${categoryId}-${product.subcategory}`]
          
          if (categoryId && subcategoryId) {
            await sequelize.query(`
              UPDATE products 
              SET "categoryId" = $1, "subcategoryId" = $2 
              WHERE id = $3
            `, {
              bind: [categoryId, subcategoryId, product.id]
            })
            console.log(`  Migrated: ${product.category} - ${product.subcategory}`)
          } else {
            console.warn(`  ⚠️  Could not migrate product ${product.id}: category or subcategory not found`)
          }
        }
      } else {
        console.log('No existing products to migrate')
      }
      
      // Step 4: Make columns NOT NULL
      console.log('Step 4: Making columns NOT NULL...')
      await sequelize.query(`
        ALTER TABLE products 
        ALTER COLUMN "categoryId" SET NOT NULL,
        ALTER COLUMN "subcategoryId" SET NOT NULL
      `)
      
      // Step 5: Add foreign key constraints
      console.log('Step 5: Adding foreign key constraints...')
      await sequelize.query(`
        ALTER TABLE products 
        ADD CONSTRAINT "products_categoryId_fkey" 
        FOREIGN KEY ("categoryId") REFERENCES categories(id) ON DELETE RESTRICT
      `).catch(err => {
        if (err.message.includes('already exists')) {
          console.log('  Foreign key constraint already exists')
        } else {
          throw err
        }
      })
      
      await sequelize.query(`
        ALTER TABLE products 
        ADD CONSTRAINT "products_subcategoryId_fkey" 
        FOREIGN KEY ("subcategoryId") REFERENCES subcategories(id) ON DELETE RESTRICT
      `).catch(err => {
        if (err.message.includes('already exists')) {
          console.log('  Foreign key constraint already exists')
        } else {
          throw err
        }
      })
      
      // Step 6: Drop old columns
      console.log('Step 6: Dropping old ENUM columns...')
      await sequelize.query(`
        ALTER TABLE products 
        DROP COLUMN IF EXISTS category,
        DROP COLUMN IF EXISTS subcategory
      `)
      
      console.log('✅ Migration completed successfully!')
    } else if (hasOldColumns && hasNewColumns) {
      // Both exist - just drop old columns
      console.log('🔄 Cleaning up: Removing old ENUM columns...')
      await sequelize.query(`
        ALTER TABLE products 
        DROP COLUMN IF EXISTS category,
        DROP COLUMN IF EXISTS subcategory
      `)
      console.log('✅ Cleanup completed!')
    }
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Migration error:', error)
    process.exit(1)
  }
}

migrateProductCategories()
