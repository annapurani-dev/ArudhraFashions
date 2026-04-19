import express from 'express'
import Image from '../models/Image.js'
import { adminProtect } from '../middleware/adminAuth.js'

const router = express.Router()

// @route GET /api/images/:id
// @desc  Serve image binary stored in DB
// @access Public
router.get('/:id', async (req, res) => {
  try {
    const img = await Image.findByPk(req.params.id)
    if (!img) {
      return res.status(404).json({ message: 'Image not found' })
    }

    const data = img.data
    const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data)

    res.setHeader('Content-Type', img.mimeType || 'application/octet-stream')
    // Cache for CDN / browser
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
    res.send(buffer)
  } catch (error) {
    console.error('Serve image error:', error)
    res.status(500).json({ message: 'Failed to serve image' })
  }
})

// @route DELETE /api/images/:id
// @desc  Delete image from DB (admin)
// @access Admin
router.delete('/:id', adminProtect, async (req, res) => {
  try {
    const img = await Image.findByPk(req.params.id)
    if (!img) return res.status(404).json({ message: 'Image not found' })
    await img.destroy()
    res.json({ success: true, message: 'Image deleted' })
  } catch (error) {
    console.error('Delete image error:', error)
    res.status(500).json({ message: 'Failed to delete image' })
  }
})

export default router

