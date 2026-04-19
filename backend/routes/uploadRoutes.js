import express from 'express'
import uploadMemory from '../middleware/uploadMemory.js'
import multer from 'multer'
import { adminProtect } from '../middleware/adminAuth.js'
import path from 'path'
import { fileURLToPath } from 'url'
import Image from '../models/Image.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const router = express.Router()

// @route   POST /api/admin/upload/images
// @desc    Upload product images (store in DB)
// @access  Admin
router.post('/images', adminProtect, (req, res, next) => {
  uploadMemory.array('images', 10)(req, res, (err) => {
    if (err) {
      console.error('Multer error:', err)
      // Handle multer errors
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ message: 'File size too large. Maximum size is 10MB.' })
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({ message: 'Too many files. Maximum is 10 files.' })
        }
        return res.status(400).json({ message: err.message || 'File upload error' })
      }
      // Handle other errors (like fileFilter errors)
      return res.status(400).json({ message: err.message || 'File upload error' })
    }
    // No error, continue to handler
    next()
  })
}, async (req, res) => {
  try {
    console.log('Upload handler - req.files:', req.files)
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' })
    }

    // Base URL used for returned image URLs
    const protocol = req.protocol || 'http'
    const host = req.get('host')
    const requestBase = `${protocol}://${host}`
    const baseUrl = process.env.BACKEND_URL || process.env.API_URL || requestBase || 'https://api.arudhrafashions.com'

    const createdImages = []
    for (const file of req.files) {
      // Save to DB
      const img = await Image.create({
        filename: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        data: file.buffer
      })
      createdImages.push(img)
    }

    const imageUrls = createdImages.map(img => `${baseUrl}/api/images/${img.id}`)

    console.log('Generated image URLs:', imageUrls)

    res.json({
      success: true,
      images: imageUrls,
      message: `${createdImages.length} image(s) uploaded successfully`
    })
  } catch (error) {
    console.error('Image upload processing error:', error)
    res.status(500).json({ message: 'Failed to upload images', error: error.message })
  }
})

// @route   DELETE /api/admin/upload/images/:id
// @desc    Delete uploaded image (from DB)
// @access  Admin
router.delete('/images/:id', adminProtect, async (req, res) => {
  try {
    const image = await Image.findByPk(req.params.id)
    if (!image) {
      return res.status(404).json({ message: 'Image not found' })
    }
    await image.destroy()
    res.json({ success: true, message: 'Image deleted successfully' })
  } catch (error) {
    console.error('Image delete error:', error)
    res.status(500).json({ message: 'Failed to delete image' })
  }
})

export default router

