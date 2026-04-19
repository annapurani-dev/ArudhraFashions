/**
 * One-time setup for a new database: create all tables and seed the admin user.
 * Run from backend directory: node scripts/setupDatabase.js
 * Uses .env for DB connection. Ensure SYNC_DB=true and NODE_ENV=development for table creation.
 */
import dotenv from 'dotenv'

dotenv.config()

// Ensure sync runs (create tables) when this script is used
process.env.NODE_ENV = process.env.NODE_ENV || 'development'
process.env.SYNC_DB = 'true'

import connectDB from '../config/db.js'
// Load all models so Sequelize sync creates every table
import '../models/index.js'
import Admin from '../models/Admin.js'

const setupDatabase = async () => {
  try {
    console.log('Connecting to database and creating tables...')
    await connectDB()

    console.log('Seeding admin user...')
    const existingAdmin = await Admin.findOne({ where: { email: 'support@arudhrafashions.com' } })

    if (existingAdmin) {
      console.log('Admin already exists. Setup complete.')
      process.exit(0)
      return
    }

    await Admin.create({
      email: 'support@arudhrafashions.com',
      password: 'admin123',
      name: 'Admin User',
      role: 'Super Admin'
    })

    console.log('Admin created successfully!')
    console.log('Email: support@arudhrafashions.com')
    console.log('Password: admin123')
    console.log('Setup complete.')
    process.exit(0)
  } catch (error) {
    console.error('Setup failed:', error)
    process.exit(1)
  }
}

setupDatabase()
