import dotenv from 'dotenv'
import Admin from '../models/Admin.js'
import connectDB from '../config/db.js'

dotenv.config()

const seedAdmin = async () => {
  try {
    await connectDB()
    
    // Check if admin already exists
  const existingAdmin = await Admin.findOne({ where: { email: 'support@arudhrafashions.com' } })
    
    if (existingAdmin) {
      console.log('Admin already exists')
      process.exit(0)
    }
    
    // Create admin
    const admin = await Admin.create({
      email: 'support@arudhrafashions.com',
      password: 'admin123',
      name: 'Admin User',
      role: 'Super Admin'
    })
    
    console.log('Admin created successfully!')
    console.log('Email:', admin.email)
    console.log('Password: admin123')
    process.exit(0)
  } catch (error) {
    console.error('Error seeding admin:', error)
    process.exit(1)
  }
}

seedAdmin()
