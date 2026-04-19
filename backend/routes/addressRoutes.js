import express from 'express'
import User from '../models/User.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

// @route   GET /api/addresses
// @desc    Get user addresses
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id)
    res.json(user.addresses || [])
  } catch (error) {
    console.error('Get addresses error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   POST /api/addresses
// @desc    Add new address
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { type, name, address, city, state, zip, zipCode, isDefault, otherDetail } = req.body

    // Support both zip and zipCode field names
    const zipValue = zip || zipCode

    if (!name || !address || !city || !state || !zipValue) {
      return res.status(400).json({ 
        message: 'Please provide all required fields',
        received: { name: !!name, address: !!address, city: !!city, state: !!state, zip: !!zipValue }
      })
    }

    const user = await User.findByPk(req.user.id)
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }
    
    // Create a new array instead of mutating the existing one
    const existingAddresses = Array.isArray(user.addresses) ? [...user.addresses] : []
    const newAddress = {
      id: `addr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: type || 'Home',
      name,
      address,
      city,
      state,
      zip: zipValue,
      isDefault: isDefault !== undefined ? isDefault : (existingAddresses.length === 0),
      ...(type === 'Other' && otherDetail && { otherDetail })
    }

    // If this is set as default, unset other defaults
    const updatedAddresses = existingAddresses.map(addr => ({
      ...addr,
      isDefault: newAddress.isDefault ? false : addr.isDefault
    }))
    
    // Add the new address
    updatedAddresses.push(newAddress)
    
    console.log('Updating addresses. Current count:', existingAddresses.length, 'New count:', updatedAddresses.length)
    
    // Use update method for JSONB fields to ensure Sequelize properly handles the change
    await user.update(
      { addresses: updatedAddresses },
      { fields: ['addresses'] }
    )

    // Reload user to get fresh data from database
    await user.reload()

    console.log('Address added successfully. User addresses count:', user.addresses?.length || 0)
    console.log('Addresses data:', JSON.stringify(user.addresses, null, 2))

    res.status(201).json(user.addresses || [])
  } catch (error) {
    console.error('Add address error:', error)
    console.error('Error details:', error.message, error.stack)
    res.status(500).json({ message: 'Server error', error: error.message })
  }
})

// @route   PUT /api/addresses/:id
// @desc    Update address
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const { type, name, address, city, state, zip, isDefault, otherDetail } = req.body
    const user = await User.findByPk(req.user.id)

    // Create a new array instead of mutating
    const existingAddresses = Array.isArray(user.addresses) ? [...user.addresses] : []
    const addressIndex = existingAddresses.findIndex(
      addr => addr.id === req.params.id
    )

    if (addressIndex === -1) {
      return res.status(404).json({ message: 'Address not found' })
    }

    // Create updated address object
    const updatedAddress = {
      ...existingAddresses[addressIndex],
      ...(type && { type }),
      ...(name && { name }),
      ...(address && { address }),
      ...(city && { city }),
      ...(state && { state }),
      ...(zip && { zip }),
      ...(isDefault !== undefined && { isDefault }),
      ...(type === 'Other' && otherDetail !== undefined ? { otherDetail } : type !== 'Other' ? { otherDetail: undefined } : {})
    }
    
    // Remove otherDetail if type is not Other
    if (updatedAddress.type !== 'Other' && updatedAddress.otherDetail) {
      delete updatedAddress.otherDetail
    }

    // Create new array with updated address
    const updatedAddresses = existingAddresses.map((addr, idx) => {
      if (idx === addressIndex) {
        return updatedAddress
      }
      // If setting as default, unset others
      if (isDefault && addr.isDefault) {
        return { ...addr, isDefault: false }
      }
      return addr
    })

    // Use update method for JSONB fields
    await user.update(
      { addresses: updatedAddresses },
      { fields: ['addresses'] }
    )
    
    // Reload user to get fresh data
    await user.reload()
    
    res.json(user.addresses || [])
  } catch (error) {
    console.error('Update address error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   DELETE /api/addresses/:id
// @desc    Delete address
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id)
    
    // Create a new array instead of mutating
    const existingAddresses = Array.isArray(user.addresses) ? [...user.addresses] : []
    const updatedAddresses = existingAddresses.filter(
      addr => addr.id !== req.params.id
    )
    
    console.log('Deleting address. Current count:', existingAddresses.length, 'New count:', updatedAddresses.length)
    
    // Use update method for JSONB fields
    await user.update(
      { addresses: updatedAddresses },
      { fields: ['addresses'] }
    )
    
    // Reload user to get fresh data
    await user.reload()
    
    res.json({ message: 'Address deleted', addresses: user.addresses || [] })
  } catch (error) {
    console.error('Delete address error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

export default router
