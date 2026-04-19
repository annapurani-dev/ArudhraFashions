import express from 'express'
import { Op } from 'sequelize'
import crypto from 'crypto'
import User from '../models/User.js'
import Product from '../models/Product.js'
import { generateToken } from '../utils/generateToken.js'
import { protect } from '../middleware/auth.js'
import { sendPasswordResetEmail } from '../services/emailService.js'

const router = express.Router()

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { mobile, password, name, email } = req.body
    const trimmedMobile = mobile?.trim() || ''
    const trimmedEmail = email?.trim() || ''

    if (!trimmedMobile || !trimmedEmail) {
      return res.status(400).json({ message: 'Please provide both mobile number and email address' })
    }

    if (!password || !name) {
      return res.status(400).json({ message: 'Please provide password and name' })
    }

    if (trimmedMobile.length !== 10 || !/^[0-9]+$/.test(trimmedMobile)) {
      return res.status(400).json({ message: 'Please enter a valid 10-digit mobile number' })
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      return res.status(400).json({ message: 'Please enter a valid email address' })
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' })
    }

    const userExistsByMobile = await User.findOne({ where: { mobile: trimmedMobile } })
    if (userExistsByMobile) {
      return res.status(400).json({ message: 'Mobile number already registered' })
    }

    const userExistsByEmail = await User.findOne({ where: { email: trimmedEmail } })
    if (userExistsByEmail) {
      return res.status(400).json({ message: 'Email address already registered' })
    }

    const user = await User.create({
      mobile: trimmedMobile,
      password,
      name,
      email: trimmedEmail
    })

    if (user) {
      const token = generateToken(user.id)
      res.status(201).json({
        _id: user.id,
        id: user.id,
        mobile: user.mobile,
        name: user.name,
        email: user.email,
        token
      })
    } else {
      res.status(400).json({ message: 'Invalid user data' })
    }
  } catch (error) {
    console.error('Register error:', error)
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'Mobile number or email already registered' })
    }
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { mobile, email, password } = req.body

    if ((!mobile || mobile.trim() === '') && (!email || email.trim() === '')) {
      return res.status(400).json({ message: 'Please provide mobile number or email address' })
    }

    if (!password) {
      return res.status(400).json({ message: 'Please provide password' })
    }

    // Find user by mobile or email
    let user = null
    if (mobile) {
      user = await User.findOne({ where: { mobile } })
    } else if (email) {
      user = await User.findOne({ where: { email } })
    }

    if (user && (await user.matchPassword(password))) {
      const token = generateToken(user.id)
      res.json({
        _id: user.id,
        id: user.id,
        mobile: user.mobile,
        name: user.name,
        email: user.email,
        token
      })
    } else {
      res.status(401).json({ message: 'Invalid credentials' })
    }
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   POST /api/auth/forgot-password
// @desc    Send password reset instructions
// @access  Public
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body
    const trimmedEmail = email?.trim() || ''

    if (!trimmedEmail) {
      return res.status(400).json({ message: 'Please provide an email address' })
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      return res.status(400).json({ message: 'Please provide a valid email address.' })
    }

    const user = await User.findOne({ where: { email: trimmedEmail } })

    if (!user) {
      return res.status(404).json({ 
        message: 'No account found with that email address.'
      })
    }

    const resetToken = crypto.randomBytes(32).toString('hex')
    const hashedResetToken = crypto.createHash('sha256').update(resetToken).digest('hex')
    const resetTokenExpires = Date.now() + 60 * 60 * 1000 // 1 hour

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
    const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`
    
    user.passwordResetToken = hashedResetToken
    user.passwordResetExpires = new Date(resetTokenExpires)
    await user.save()

    await sendPasswordResetEmail(user.email, resetToken, user.name)

    if (process.env.NODE_ENV === 'development') {
      console.log(`Password reset requested for email: ${trimmedEmail}`)
      console.log(`Reset token (for development): ${resetToken}`)
      console.log(`Reset link: ${resetLink}`)
    }

    res.json({ 
      message: 'Password reset instructions have been sent to your email address',
      ...(process.env.NODE_ENV === 'development' && { 
        resetToken,
        resetLink
      })
    })
  } catch (error) {
    console.error('Forgot password error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   POST /api/auth/reset-password
// @desc    Reset password using token
// @access  Public
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body

    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token and new password are required' })
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' })
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex')
    const user = await User.findOne({
      where: {
        passwordResetToken: hashedToken,
        passwordResetExpires: {
          [Op.gt]: new Date()
        }
      }
    })

    if (!user) {
      return res.status(400).json({ message: 'Reset token is invalid or has expired' })
    }

    user.password = newPassword
    user.passwordResetToken = null
    user.passwordResetExpires = null
    await user.save()

    res.json({ message: 'Password reset successful' })
  } catch (error) {
    console.error('Reset password error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [
        {
          association: 'orders',
          required: false
        }
      ]
    })

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    const userData = user.toJSON()

    // Get wishlist products
    if (userData.wishlist && userData.wishlist.length > 0) {
      const wishlistProducts = await Product.findAll({
        where: { id: { [Op.in]: userData.wishlist } }
      })
      userData.wishlist = wishlistProducts
    }

    res.json(userData)
  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, email } = req.body

    const user = await User.findByPk(req.user.id)

    if (user) {
      if (name) user.name = name
      if (email) user.email = email
      const updatedUser = await user.save()
      res.json(updatedUser.toJSON())
    } else {
      res.status(404).json({ message: 'User not found' })
    }
  } catch (error) {
    console.error('Update profile error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   PUT /api/auth/change-password
// @desc    Change password (requires current password)
// @access  Private
router.put('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Please provide both current and new password' })
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' })
    }

    const user = await User.findByPk(req.user.id)

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Verify current password
    const isMatch = await user.matchPassword(currentPassword)
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' })
    }

    // Update password
    user.password = newPassword
    await user.save()

    res.json({ message: 'Password changed successfully' })
  } catch (error) {
    console.error('Change password error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/auth/preferences
// @desc    Get user preferences
// @access  Private
router.get('/preferences', protect, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }
    
    const preferences = user.preferences || {
      emailNotifications: true,
      smsNotifications: false,
      newsletter: false
    }
    
    res.json(preferences)
  } catch (error) {
    console.error('Get preferences error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   PUT /api/auth/preferences
// @desc    Update user preferences
// @access  Private
router.put('/preferences', protect, async (req, res) => {
  try {
    const { emailNotifications, smsNotifications, newsletter } = req.body
    
    const user = await User.findByPk(req.user.id)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }
    
    const currentPreferences = user.preferences || {
      emailNotifications: true,
      smsNotifications: false,
      newsletter: false
    }
    
    const updatedPreferences = {
      ...currentPreferences,
      ...(emailNotifications !== undefined && { emailNotifications }),
      ...(smsNotifications !== undefined && { smsNotifications }),
      ...(newsletter !== undefined && { newsletter })
    }
    
    await user.update(
      { preferences: updatedPreferences },
      { fields: ['preferences'] }
    )
    
    res.json(updatedPreferences)
  } catch (error) {
    console.error('Update preferences error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

export default router
