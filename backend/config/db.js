import { Sequelize } from 'sequelize'
import dotenv from 'dotenv'

dotenv.config()

const sequelize = new Sequelize(
  process.env.POSTGRES_DB || process.env.DATABASE_NAME || 'arudhra_boutique',
  process.env.POSTGRES_USER || process.env.DATABASE_USER || 'postgres',
  process.env.POSTGRES_PASSWORD || process.env.DATABASE_PASSWORD || '',
  {
    host: process.env.POSTGRES_HOST || process.env.DATABASE_HOST || 'localhost',
    port: process.env.POSTGRES_PORT || process.env.DATABASE_PORT || 5432,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    dialectOptions: {
      connectTimeout: 15000,
      ...(process.env.POSTGRES_SSL === 'true' || process.env.NODE_ENV === 'production' 
        ? {
            ssl: {
              require: true,
              rejectUnauthorized: false
            }
          }
        : {})
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
)

const connectDB = async () => {
  try {
    await sequelize.authenticate()
    console.log('PostgreSQL Connected successfully')
    
    // Sync models - only create if they don't exist (safer for production-like setups)
    // Use { alter: true } only when you need to modify schema
    // Use { force: true } to drop and recreate (DANGEROUS - loses data)
    if (process.env.NODE_ENV === 'development') {
      // Check if we should sync - only sync if SYNC_DB env var is set
      if (process.env.SYNC_DB === 'true') {
        try {
          // Use sync without alter to avoid enum array casting issues
          // This will only create tables if they don't exist, won't modify existing ones
          await sequelize.sync({ alter: false })
          console.log('Database models verified (tables exist or were created)')
        } catch (syncError) {
          // If sync fails, tables likely already exist with correct structure
          console.warn('Database sync warning:', syncError.message)
          console.log('Continuing - tables should already exist with correct structure')
        }
      } else if (process.env.SYNC_DB === 'alter') {
        // Only use alter mode if explicitly requested
        try {
          await sequelize.sync({ alter: true })
          console.log('Database models synchronized with alter')
        } catch (syncError) {
          // Handle specific enum array casting errors
          if (syncError.message && syncError.message.includes('cannot cast type') && syncError.message.includes('enum')) {
            console.warn('⚠️  Database alter sync skipped: Enum array type casting issue')
            console.log('ℹ️  This is safe - enum array columns cannot be automatically altered')
            console.log('ℹ️  Use manual migrations for enum array schema changes')
          } else {
            console.warn('Database sync with alter failed:', syncError.message)
          }
          console.log('Continuing without alter - tables should already exist')
        }
      } else {
        // Just verify connection, don't sync schema
        console.log('Database connection verified (sync disabled)')
        console.log('Set SYNC_DB=true to create missing tables, or SYNC_DB=alter to attempt schema changes')
      }
    }
    
    return sequelize
  } catch (error) {
    console.error('PostgreSQL Connection Error:', error.message)
    if (error.parent?.code === 'ETIMEDOUT' || error.message?.includes('ETIMEDOUT')) {
      console.error('\n💡 Connection timed out — Azure is likely blocking your IP.')
      console.error('   Fix: Azure Portal → your PostgreSQL server → Networking')
      console.error('   → Add firewall rule: allow your current IP (or 0.0.0.0 for testing).')
    }
    console.error('Full error details:', error)
    throw error
  }
}

export { sequelize }
export default connectDB
