import express from 'express'
import Admin from '../models/Admin.js'
import { generateToken } from '../utils/generateToken.js'
import { adminProtect } from '../middleware/adminAuth.js'

const router = express.Router()

// @route   POST /api/admin/auth/login
// @desc    Admin login
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' })
    }

    // Check if JWT_SECRET is configured
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not configured in environment variables')
      return res.status(500).json({ 
        message: 'Server configuration error: JWT_SECRET is missing. Please check your .env file.' 
      })
    }

    const admin = await Admin.findOne({ where: { email, isActive: true } })

    if (!admin) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    const isPasswordValid = await admin.matchPassword(password)
    
    if (isPasswordValid) {
      // Update last login
      admin.lastLogin = new Date()
      await admin.save()

      const token = generateToken(admin.id)
      res.json({
        _id: admin.id,
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        token
      })
    } else {
      res.status(401).json({ message: 'Invalid email or password' })
    }
  } catch (error) {
    console.error('Admin login error:', error)
    
    // Provide more detailed error messages
    let errorMessage = 'Server error'
    
    if (error.name === 'SequelizeConnectionError' || error.name === 'SequelizeConnectionRefusedError') {
      errorMessage = 'Database connection failed. Please check your database configuration and ensure PostgreSQL is running.'
    } else if (error.name === 'SequelizeDatabaseError') {
      errorMessage = 'Database error. Please check your database connection and table structure.'
    } else if (error.message) {
      errorMessage = error.message
    }
    
    res.status(500).json({ 
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})

// @route   GET /api/admin/auth/me
// @desc    Get current admin
// @access  Admin
router.get('/me', adminProtect, async (req, res) => {
  try {
    const admin = await Admin.findByPk(req.admin.id)
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' })
    }
    res.json(admin.toJSON())
  } catch (error) {
    console.error('Get admin error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

export default router
