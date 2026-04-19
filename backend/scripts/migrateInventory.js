import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { Sequelize } from 'sequelize'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: join(__dirname, '../.env') })

// Create temporary raw connection without loading models, to avoid schema mismatch errors if any remain
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'postgres',
    port: process.env.DB_PORT || 5432,
    dialectOptions: {
      ssl: process.env.DB_SSL === 'true' ? {
        require: true,
        rejectUnauthorized: false
      } : false
    },
    logging: console.log
  }
)

async function migrateInventory() {
  try {
    await sequelize.authenticate()
    console.log('Connected to database...')

    // 1. Add JSONB column if it doesn't exist yet
    console.log('Adding inventory column...')
    await sequelize.query(`
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS inventory JSONB DEFAULT '[]'::jsonb;
    `)

    // 2. Wrap existing stock counts into the proper nested array format
    // Notice: we format it into the generic "Scenario 3 - No color, no size" syntax so it parses safely immediately
    console.log('Migrating stock counts to inventory array...')
    await sequelize.query(`
      UPDATE products 
      SET inventory = jsonb_build_array(
        jsonb_build_object(
          'colorName', null,
          'sizes', jsonb_build_array(
            jsonb_build_object(
              'size', null,
              'stock', COALESCE("stockCount", 0)
            )
          )
        )
      )
      WHERE inventory = '[]'::jsonb OR inventory IS NULL;
    `)

    // 3. Drop legacy column
    console.log('Dropping legacy stockCount column...')
    await sequelize.query(`
      ALTER TABLE products DROP COLUMN IF EXISTS "stockCount";
    `)

    console.log('✅ Inventory migration completed successfully!')
  } catch (err) {
    console.error('❌ Migration failed:', err)
  } finally {
    await sequelize.close()
    process.exit(0)
  }
}

migrateInventory()
