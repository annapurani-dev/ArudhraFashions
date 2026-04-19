import express from 'express'
import { Op } from 'sequelize'
import ContactQuery from '../models/ContactQuery.js'
import { adminProtect } from '../middleware/adminAuth.js'

const router = express.Router()

// @route   POST /api/contact
// @desc    Submit contact form
// @access  Public
router.post('/', async (req, res) => {
  try {
    const { name, email, mobile, subject, message } = req.body

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ message: 'All required fields must be filled' })
    }

    const query = await ContactQuery.create({
      name,
      email,
      mobile,
      subject,
      message,
      status: 'new'
    })

    res.status(201).json({ 
      message: 'Your query has been submitted successfully',
      queryId: query.id 
    })
  } catch (error) {
    console.error('Submit contact error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/admin/queries
// @desc    Get all contact queries (admin)
// @access  Admin
router.get('/all', adminProtect, async (req, res) => {
  try {
    const { search, status, page = 1, limit = 20 } = req.query
    const where = {}

    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { subject: { [Op.iLike]: `%${search}%` } }
      ]
    }

    if (status) {
      where.status = status
    }

    const offset = (page - 1) * limit
    const { count, rows: queries } = await ContactQuery.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
      offset: Number(offset)
    })

    res.json({
      queries,
      page: Number(page),
      pages: Math.ceil(count / limit),
      total: count
    })
  } catch (error) {
    console.error('Get admin queries error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/admin/queries/details/:id
// @desc    Get query details (admin)
// @access  Admin
router.get('/details/:id', adminProtect, async (req, res) => {
  try {
    const query = await ContactQuery.findByPk(req.params.id)
    if (!query) {
      return res.status(404).json({ message: 'Query not found' })
    }

    res.json(query)
  } catch (error) {
    console.error('Get query error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   PUT /api/admin/queries/:id/status
// @desc    Update query status (admin)
// @access  Admin
router.put('/status/:id', adminProtect, async (req, res) => {
  try {
    const { status } = req.body
    const validStatuses = ['new', 'in-progress', 'resolved']

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' })
    }

    const query = await ContactQuery.findByPk(req.params.id)
    if (!query) {
      return res.status(404).json({ message: 'Query not found' })
    }

    query.status = status
    if (status === 'resolved') {
      query.repliedAt = new Date()
    }
    await query.save()

    res.json(query)
  } catch (error) {
    console.error('Update query status error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   POST /api/admin/queries/:id/reply
// @desc    Reply to query (admin)
// @access  Admin
router.post('/reply/:id', adminProtect, async (req, res) => {
  try {
    const { reply } = req.body

    if (!reply) {
      return res.status(400).json({ message: 'Reply message is required' })
    }

    const query = await ContactQuery.findByPk(req.params.id)
    if (!query) {
      return res.status(404).json({ message: 'Query not found' })
    }

    query.reply = reply
    query.status = 'resolved'
    query.repliedAt = new Date()
    await query.save()

    res.json(query)
  } catch (error) {
    console.error('Reply to query error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

export default router

