import express from 'express'
import EmailTemplate from '../models/EmailTemplate.js'
import { adminProtect } from '../middleware/adminAuth.js'

const router = express.Router()

// @route   GET /api/email-templates
// @desc    Get all email templates
// @access  Admin
router.get('/all', adminProtect, async (req, res) => {
  try {
    const { type } = req.query
    const where = {}

    if (type) {
      where.type = type
    }

    where.channel = 'email'

    const templates = await EmailTemplate.findAll({
      where,
      order: [['channel', 'ASC'], ['type', 'ASC'], ['name', 'ASC']]
    })

    res.json(templates)
  } catch (error) {
    console.error('Get email templates error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/email-templates/:id
// @desc    Get email template
// @access  Admin
router.get('/:id', adminProtect, async (req, res) => {
  try {
    const template = await EmailTemplate.findByPk(req.params.id)
    if (!template) {
      return res.status(404).json({ message: 'Template not found' })
    }

    res.json(template)
  } catch (error) {
    console.error('Get email template error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   POST /api/email-templates
// @desc    Create email template
// @access  Admin
router.post('/create', adminProtect, async (req, res) => {
  try {
    const { name, type, subject, body, variables } = req.body

    if (!name || !type || !body) {
      return res.status(400).json({ message: 'Name, type, and body are required' })
    }

    if (!subject) {
      return res.status(400).json({ message: 'Subject is required for email templates' })
    }

    const template = await EmailTemplate.create({
      name,
      type,
      channel: 'email',
      subject,
      body,
      variables: variables || []
    })

    res.status(201).json(template)
  } catch (error) {
    console.error('Create email template error:', error)
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'Template name already exists' })
    }
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   PUT /api/email-templates/:id
// @desc    Update email template
// @access  Admin
router.put('/update/:id', adminProtect, async (req, res) => {
  try {
    const template = await EmailTemplate.findByPk(req.params.id)
    if (!template) {
      return res.status(404).json({ message: 'Template not found' })
    }

    if (req.body.subject !== undefined) template.subject = req.body.subject
    if (req.body.body) template.body = req.body.body
    if (req.body.variables) template.variables = req.body.variables
    template.lastModified = new Date()

    await template.save()
    await template.reload()

    res.json(template)
  } catch (error) {
    console.error('Update email template error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

export default router

