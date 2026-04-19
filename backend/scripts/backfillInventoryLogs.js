import dotenv from 'dotenv'
import { sequelize } from '../config/db.js'
import Product from '../models/Product.js'
import InventoryLog from '../models/InventoryLog.js'

dotenv.config()

const backfillInventoryLogs = async () => {
  try {
    await sequelize.authenticate()
    console.log('PostgreSQL Connected successfully')
    
    // Get all products
    console.log('Fetching all products...')
    const products = await Product.findAll({
      attributes: ['id', 'name', 'stockCount', 'createdAt']
    })
    
    console.log(`Found ${products.length} products`)
    
    if (products.length === 0) {
      console.log('No products found. Nothing to backfill.')
      process.exit(0)
    }
    
    let created = 0
    let skipped = 0
    let errors = 0
    
    // Check which products already have inventory logs
    console.log('Checking existing inventory logs...')
    const existingLogs = await InventoryLog.findAll({
      attributes: ['productId'],
      group: ['productId']
    })
    const productsWithLogs = new Set(existingLogs.map(log => log.productId))
    
    console.log(`Found ${productsWithLogs.size} products with existing inventory logs`)
    
    // Create inventory log for each product that doesn't have one
    for (const product of products) {
      try {
        // Skip if product already has an inventory log
        if (productsWithLogs.has(product.id)) {
          skipped++
          continue
        }
        
        // Create initial inventory log entry
        await InventoryLog.create({
          productId: product.id,
          quantity: product.stockCount || 0,
          type: product.stockCount > 0 ? 'in' : 'adjustment',
          reason: product.stockCount > 0 
            ? 'Initial stock - Backfilled from existing product' 
            : 'Backfilled from existing product (zero stock)',
          createdBy: null // No admin ID for backfilled entries
        })
        
        created++
        if (created % 10 === 0) {
          console.log(`  Processed ${created} products...`)
        }
      } catch (error) {
        errors++
        console.error(`  Error creating log for product ${product.id} (${product.name}):`, error.message)
      }
    }
    
    console.log('\n✅ Backfill completed!')
    console.log(`   Created: ${created} inventory log entries`)
    console.log(`   Skipped: ${skipped} products (already have logs)`)
    console.log(`   Errors: ${errors}`)
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Backfill error:', error)
    process.exit(1)
  }
}

backfillInventoryLogs()
