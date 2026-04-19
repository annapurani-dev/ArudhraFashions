import nodemailer from 'nodemailer'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { generateInvoicePDF } from '../utils/invoiceGenerator.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/**
 * Email Service for sending emails
 * Configure using environment variables:
 * - EMAIL_HOST: SMTP host (e.g., smtp.gmail.com)
 * - EMAIL_PORT: SMTP port (e.g., 587)
 * - EMAIL_USER: Email address for sending
 * - EMAIL_PASS: Email password or app password
 * - EMAIL_FROM: From email address (defaults to EMAIL_USER)
 */

// Create transporter based on environment variables
const createTransporter = () => {
  // If no email config, return null (service disabled)
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('Email service not configured. Set EMAIL_HOST, EMAIL_USER, and EMAIL_PASS environment variables.')
    return null
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  })
}

const transporter = createTransporter()
const fromEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER || 'support@arudhrafashions.com'

/**
 * Send email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML body
 * @param {string} options.text - Plain text body (optional)
 * @param {Array} options.attachments - Array of attachment objects (optional)
 * @returns {Promise<Object>} - Result object with success status
 */
export const sendEmail = async ({ to, subject, html, text, attachments = [] }) => {
  try {
    console.log(`[Email Service] Attempting to send email to: ${to}`)
    console.log(`[Email Service] Subject: ${subject}`)
    console.log(`[Email Service] Transporter configured: ${!!transporter}`)
    
    // If transporter is not configured, log and return mock success
    if (!transporter) {
      console.log(`[Email Service - Mock] Would send email to: ${to}`)
      console.log(`[Email Service - Mock] Subject: ${subject}`)
      if (attachments.length > 0) {
        console.log(`[Email Service - Mock] Attachments: ${attachments.length}`)
      }
      return {
        success: true,
        message: 'Email service not configured (mock mode)',
        messageId: 'mock-' + Date.now()
      }
    }

    const mailOptions = {
      from: fromEmail,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML tags for text version
      attachments
    }

    const info = await transporter.sendMail(mailOptions)
    
    console.log(`Email sent successfully to ${to}:`, info.messageId)
    return {
      success: true,
      message: 'Email sent successfully',
      messageId: info.messageId
    }
  } catch (error) {
    console.error('Email sending error:', error)
    return {
      success: false,
      message: error.message || 'Failed to send email',
      error: error.toString()
    }
  }
}

/**
 * Send email with PDF attachment
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML body
 * @param {string} options.text - Plain text body (optional)
 * @param {string} options.pdfPath - Path to PDF file (relative to backend root)
 * @param {string} options.pdfName - Name for PDF attachment (optional)
 * @returns {Promise<Object>} - Result object with success status
 */
export const sendEmailWithPDF = async ({ to, subject, html, text, pdfPath, pdfName }) => {
  try {
    // Resolve PDF path
    const fullPdfPath = path.join(__dirname, '..', pdfPath)
    
    // Check if PDF exists
    if (!fs.existsSync(fullPdfPath)) {
      throw new Error(`PDF file not found: ${fullPdfPath}`)
    }

    const attachments = [{
      filename: pdfName || path.basename(pdfPath),
      path: fullPdfPath,
      contentType: 'application/pdf'
    }]

    return await sendEmail({ to, subject, html, text, attachments })
  } catch (error) {
    console.error('Error sending email with PDF:', error)
    return {
      success: false,
      message: error.message || 'Failed to send email with PDF',
      error: error.toString()
    }
  }
}

/**
 * Send order confirmation email
 * @param {Object} order - Order object
 * @param {Object} user - User object with email
 * @returns {Promise<Object>} - Result object
 */
export const sendOrderConfirmationEmail = async (order, user) => {
  console.log('sendOrderConfirmationEmail called with order:', order.orderId)
  console.log('Order items in email service:', JSON.stringify(order.items, null, 2))
  
  const email = user.email || order.shippingAddress?.email
  if (!email) {
    console.log('No email address found for order:', order.orderId)
    return { success: false, message: 'No email address found' }
  }

  const subject = `Order Confirmation - ${order.orderId}`
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Thank you for your order!</h2>
      <p>Dear ${user.name || 'Customer'},</p>
      <p>Your order <strong>${order.orderId}</strong> has been confirmed.</p>
      <p><strong>Order Total:</strong> ₹${parseFloat(order.total || 0).toFixed(2)}</p>
      <p>We'll send you another email when your order ships.</p>
      <p>Thank you for shopping with Arudhra Fashions!</p>
    </div>
  `
  // Ensure invoice PDF is attached using the same generator UI.
  try {
    let invoicePath = null
    // Prefer an existing invoicePath on the order if the file exists
    if (order.invoicePath) {
      const fullPath = path.join(__dirname, '..', order.invoicePath)
      if (fs.existsSync(fullPath)) {
        invoicePath = order.invoicePath
      }
    }

    // If no existing invoice PDF, generate one now (uses the same invoice generator UI)
    if (!invoicePath) {
      try {
        console.log('Generating invoice PDF for email attachment...')
        const invoiceUserInfo = {
          name: user?.name || order.shippingAddress?.name,
          email: user?.email || order.shippingAddress?.email,
          mobile: user?.mobile || order.shippingAddress?.mobile
        }
        const generated = await generateInvoicePDF(order, invoiceUserInfo, order.invoiceId || null)
        if (generated) {
          invoicePath = generated
          console.log('Invoice PDF generated successfully:', invoicePath)
        } else {
          console.log('Invoice generation returned null/undefined')
        }
      } catch (genErr) {
        console.error('Failed to generate invoice PDF for email attachment:', genErr)
        console.error('Error stack:', genErr.stack)
      }
    }

    if (invoicePath) {
      return await sendEmailWithPDF({
        to: email,
        subject,
        html,
        pdfPath: invoicePath,
        pdfName: `invoice-${order.orderId}.pdf`
      })
    }
  } catch (err) {
    console.error('Failed to attach invoice to order confirmation email:', err)
  }

  // Fallback: send without attachment
  return await sendEmail({ to: email, subject, html })
}

/**
 * Send password reset email
 * @param {string} email - User email
 * @param {string} resetToken - Reset token
 * @param {string} userName - User name (optional)
 * @returns {Promise<Object>} - Result object
 */
export const sendPasswordResetEmail = async (email, resetToken, userName = 'Customer') => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
  const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`

  const subject = 'Reset Your Password - Arudhra Fashions'
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Password Reset Request</h2>
      <p>Dear ${userName},</p>
      <p>You requested to reset your password. Click the link below to reset it:</p>
      <p><a href="${resetLink}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a></p>
      <p>Or copy and paste this link into your browser:</p>
      <p style="word-break: break-all;">${resetLink}</p>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
    </div>
  `

  return await sendEmail({ to: email, subject, html })
}

/**
 * Send admin notification for new order
 * @param {Object} order - Order object
 * @param {Object} user - User object
 * @returns {Promise<Object>} - Result object
 */
export const sendAdminOrderNotification = async (order, user) => {
  const adminEmail = 'fashion.arudhra@gmail.com'
  
  const subject = `New Order Received - ${order.orderId}`
  
  // Build items HTML
  const itemsHtml = order.items?.map(item => `
    <tr>
      <td style="padding: 8px; border: 1px solid #ddd;">${item.name || 'Product'}</td>
      <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">₹${parseFloat(item.price || 0).toFixed(2)}</td>
      <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">₹${(parseFloat(item.price || 0) * item.quantity).toFixed(2)}</td>
    </tr>
  `).join('') || '<tr><td colspan="4" style="padding: 8px; text-align: center;">No items</td></tr>'
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #c45c26;">New Order Received!</h2>
      <p>A new order has been placed on Arudhra Fashions.</p>
      
      <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 15px 0;">
        <h3 style="margin-top: 0; color: #333;">Order Details</h3>
        <p><strong>Order ID:</strong> ${order.orderId}</p>
        <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
        <p><strong>Payment Method:</strong> ${order.paymentMethod?.toUpperCase() || 'N/A'}</p>
        <p><strong>Payment Status:</strong> ${order.paymentStatus?.toUpperCase() || 'N/A'}</p>
      </div>
      
      <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 15px 0;">
        <h3 style="margin-top: 0; color: #333;">Customer Details</h3>
        <p><strong>Name:</strong> ${user?.name || order.shippingAddress?.name || 'N/A'}</p>
        <p><strong>Email:</strong> ${user?.email || order.shippingAddress?.email || 'N/A'}</p>
        <p><strong>Mobile:</strong> ${user?.mobile || order.shippingAddress?.mobile || 'N/A'}</p>
      </div>
      
      <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 15px 0;">
        <h3 style="margin-top: 0; color: #333;">Shipping Address</h3>
        <p>${order.shippingAddress?.name || ''}<br>
        ${order.shippingAddress?.address || ''}<br>
        ${order.shippingAddress?.city || ''}, ${order.shippingAddress?.state || ''} ${order.shippingAddress?.pincode || ''}<br>
        ${order.shippingAddress?.country || 'India'}</p>
      </div>
      
      <h3 style="color: #333;">Order Items</h3>
      <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
        <thead>
          <tr style="background: #c45c26; color: white;">
            <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Product</th>
            <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Qty</th>
            <th style="padding: 10px; border: 1px solid #ddd; text-align: right;">Price</th>
            <th style="padding: 10px; border: 1px solid #ddd; text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
        <tfoot>
          <tr style="background: #f5f5f5; font-weight: bold;">
            <td colspan="3" style="padding: 10px; border: 1px solid #ddd; text-align: right;">Subtotal:</td>
            <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">₹${parseFloat(order.subtotal || 0).toFixed(2)}</td>
          </tr>
          <tr style="background: #f5f5f5;">
            <td colspan="3" style="padding: 10px; border: 1px solid #ddd; text-align: right;">Shipping:</td>
            <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">₹${parseFloat(order.shippingCost || 0).toFixed(2)}</td>
          </tr>
          <tr style="background: #f5f5f5;">
            <td colspan="3" style="padding: 10px; border: 1px solid #ddd; text-align: right;">Tax:</td>
            <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">₹${parseFloat(order.tax || 0).toFixed(2)}</td>
          </tr>
          ${order.discount > 0 ? `
          <tr style="background: #f5f5f5;">
            <td colspan="3" style="padding: 10px; border: 1px solid #ddd; text-align: right;">Discount:</td>
            <td style="padding: 10px; border: 1px solid #ddd; text-align: right; color: green;">-₹${parseFloat(order.discount || 0).toFixed(2)}</td>
          </tr>
          ` : ''}
          <tr style="background: #c45c26; color: white; font-weight: bold;">
            <td colspan="3" style="padding: 10px; border: 1px solid #ddd; text-align: right;">Total:</td>
            <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">₹${parseFloat(order.total || 0).toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>
      
      <p style="margin-top: 20px; font-size: 12px; color: #666;">
        This is an automated notification from Arudhra Fashions.<br>
        Please process this order at your earliest convenience.
      </p>
    </div>
  `
  
  return await sendEmail({ to: adminEmail, subject, html })
}

export default {
  sendEmail,
  sendEmailWithPDF,
  sendOrderConfirmationEmail,
  sendPasswordResetEmail,
  sendAdminOrderNotification
}
