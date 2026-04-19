import PDFDocument from 'pdfkit'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Brand color palette
const colors = {
  primary: '#C89E7E',        // Medium warm brown/caramel
  primaryDark: '#7A5051',   // Deep reddish-brown/plum
  primaryLight: '#CAB19B',   // Light warm beige/tan
  secondary: '#AB8A8A',     // Muted dusty rose/mauve
  background: '#FAF8F5',     // Very light cream/beige
  textPrimary: '#3A1F23',   // Very dark espresso/chocolate brown
  textSecondary: '#7A5051', // Deep reddish-brown/plum
  white: '#FFFFFF'
}

// Helper function to convert hex to RGB
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null
}

/**
 * Generate invoice PDF for an order
 * @param {Object} order - Order object with all details
 * @param {Object} user - User object with name, email, mobile
 * @returns {Promise<string>} - Path to generated PDF file
 */
export async function generateInvoicePDF(order, user, invoiceNumber = null) {
  return new Promise((resolve, reject) => {
    try {
      // Create invoices directory if it doesn't exist
      const invoicesDir = path.join(__dirname, '..', 'uploads', 'invoices')
      if (!fs.existsSync(invoicesDir)) {
        fs.mkdirSync(invoicesDir, { recursive: true })
      }

      // Ensure order and invoice identifiers exist.
      // Generate an order ID if missing (AF-ORD-<timestamp-suffix>)
      if (!order.orderId) {
        order.orderId = `AF-ORD-${Date.now().toString().slice(-8)}`
      }

      // Use provided invoiceNumber if passed; otherwise derive/generate invoiceId.
      if (invoiceNumber && typeof invoiceNumber === 'string') {
        order.invoiceId = invoiceNumber
      } else {
        if (!order.invoiceId) {
          if (order.orderId && typeof order.orderId === 'string' && order.orderId.startsWith('AF-ORD-')) {
            order.invoiceId = order.orderId.replace('AF-ORD-', 'AF-INV-')
          } else if (order.orderId) {
            order.invoiceId = order.orderId
          } else {
            order.invoiceId = `AF-INV-${Date.now().toString().slice(-8)}`
          }
        }
      }

      // Generate filename using invoiceId to clearly associate file with invoice
      const filename = `invoice-${order.invoiceId}-${Date.now()}.pdf`
      const filepath = path.join(invoicesDir, filename)

      // Create PDF document with proper margins
      const doc = new PDFDocument({ 
        size: 'A4', 
        margin: 0,
        layout: 'portrait'
      })

      // Pipe PDF to file
      const stream = fs.createWriteStream(filepath)
      doc.pipe(stream)

      // Page dimensions
      const pageWidth = 595.28 // A4 width in points (210mm)
      const pageHeight = 841.89 // A4 height in points (297mm)
      const margin = 40
      const contentWidth = pageWidth - (margin * 2)

      // Logo path - prefer the same file the frontend uses in Footer (`/Logo.png?v=3`), then check common locations
      const footerLogoRef = '/Logo.png?v=3'
      const footerLogoBasename = footerLogoRef.split('?')[0].replace(/^\//, '') // -> "Logo.png"
      const footerLogoPath = path.join(__dirname, '..', '..', 'frontend', 'public', footerLogoBasename)
      const logoCandidates = [
        // Prefer backend uploads first
        path.join(__dirname, 'uploads', 'Logo.png'),
        path.join(__dirname, 'uploads', 'logo.png'),
        path.join(__dirname, '..', 'uploads', 'Logo.png'),
        path.join(__dirname, '..', 'uploads', 'logo.png'),
        path.join(__dirname, '..', 'uploads', 'products', 'Logo.png'),
        // Then project root and frontend public as fallback
        path.join(__dirname, '..', '..', 'Logo.png'),
        footerLogoPath,
        path.join(__dirname, '..', '..', 'frontend', 'public', 'logo.png')
      ]
      let logoPath = null
      for (const p of logoCandidates) {
        if (fs.existsSync(p)) {
          logoPath = p
          break
        }
      }
      // fallback: try to find any file with "logo" in uploads/products (case-insensitive)
      if (!logoPath) {
        try {
          const uploadsDir = path.join(__dirname, '..', 'uploads', 'products')
          if (fs.existsSync(uploadsDir)) {
            const files = fs.readdirSync(uploadsDir)
            const found = files.find(f => f.toLowerCase().includes('logo'))
            if (found) logoPath = path.join(uploadsDir, found)
          }
        } catch (e) {
          // ignore
        }
      }

      // ========== HEADER SECTION ==========
      let currentY = margin

      // Logo path resolved earlier; we are not rendering a watermark in PDFs.
      if (logoPath) {
        console.log('Invoice generator: resolved logo path (not used as watermark):', logoPath)
      } else {
        console.warn('Invoice generator: logo not found in expected locations. Checked:', logoCandidates)
      }

      // Center area: between left margin and the right edge — title and subtitle will be centered here
      const centerAreaX = margin
      const centerAreaWidth = Math.max(150, contentWidth)

      // Title and subtitle — vertically aligned within the header area
      const titleY = margin + 8
      const titleText = 'Arudhra Fashions'
      doc.fontSize(32).font('Helvetica-Bold').fillColor(colors.primaryDark)
      const titleTextWidth = doc.widthOfString(titleText)
      const titlePosX = centerAreaX + Math.max(0, (centerAreaWidth - titleTextWidth) / 2)
      doc.text(titleText, titlePosX, titleY)

      // Subtitle: force single-line centered directly below the title
      const subtitleText = 'Fashioning beauty for every journey, age and story'
      const subtitleFontSize = 12
      const subtitleY = titleY + 36
      doc.fontSize(subtitleFontSize).font('Times-Italic').fillColor(colors.primaryDark)
      const subtitleWidth = doc.widthOfString(subtitleText)
      const subtitlePosX = centerAreaX + Math.max(0, (centerAreaWidth - subtitleWidth) / 2)
      doc.text(subtitleText, subtitlePosX, subtitleY)

      // Hardcoded header logo at top-right
      const headerLogoSize = 80
      const headerLogoX = pageWidth - margin - headerLogoSize
      const headerLogoY = margin
      if (logoPath && fs.existsSync(logoPath)) {
        try {
          const headerLogoBuffer = fs.readFileSync(logoPath)
          doc.image(headerLogoBuffer, headerLogoX, headerLogoY, { fit: [headerLogoSize, headerLogoSize] })
        } catch (err) {
          try {
            doc.image(logoPath, headerLogoX, headerLogoY, { fit: [headerLogoSize, headerLogoSize] })
          } catch (err2) {
            console.error('Invoice generator: failed to draw header logo:', err2)
          }
        }
      }

      // Format date properly - check multiple possible date fields
      let invoiceDate = 'N/A'
      const dateValue = order.createdAt || order.orderDate || order.date || new Date()
      try {
        invoiceDate = new Date(dateValue).toLocaleDateString('en-IN', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })
      } catch (error) {
        console.error('Error formatting date:', error)
        invoiceDate = new Date().toLocaleDateString('en-IN', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })
      }

      // Decide which invoice identifier to display (derive from order fields)
      let displayInvoiceId = 'N/A'
      if (order.invoiceId) {
        displayInvoiceId = order.invoiceId
      } else if (order.orderId && typeof order.orderId === 'string' && order.orderId.startsWith('AF-ORD-')) {
        displayInvoiceId = order.orderId.replace('AF-ORD-', 'AF-INV-')
      } else if (order.orderId) {
        displayInvoiceId = order.orderId
      }

      // ========== CUSTOMER DETAILS SECTION ==========
      // Start customer section below header area
      currentY = subtitleY + 30
      
      // Info area: split into two columns (left = invoice meta, right = Bill To plain text)
      const infoY = currentY
      const infoHeight = 100
      const leftColX = margin
      const leftColWidth = Math.floor(contentWidth / 2) - 10
      const rightColX = margin + Math.floor(contentWidth / 2) + 10
      const rightColWidth = contentWidth - (leftColWidth + 20)

      // Left column: Date, Invoice No, Order No (use regular font, not bold)
      doc.fontSize(11).font('Helvetica').fillColor(colors.textPrimary)
        .text(`Date: ${invoiceDate}`, leftColX, infoY + 8, { width: leftColWidth, align: 'left' })
        .text(`Invoice No: ${displayInvoiceId}`, leftColX, infoY + 26, { width: leftColWidth, align: 'left' })
      if (order.orderId) {
        doc.text(`Order No: ${order.orderId}`, leftColX, infoY + 44, { width: leftColWidth, align: 'left' })
      }

      // Payment method and status (show COD or online and current payment status)
      try {
        const paymentMethodText = order.payment?.method === 'cod' ? 'Cash on Delivery' : (order.payment?.method || (order.payment?.razorpayPaymentId ? 'Online' : 'Online'))
        const paymentStatusText = order.payment?.status || 'N/A'
        doc.fontSize(11).font('Helvetica').fillColor(colors.textSecondary)
          .text(`Payment Method: ${paymentMethodText}`, leftColX, infoY + 62, { width: leftColWidth, align: 'left' })
          .text(`Payment Status: ${paymentStatusText}`, leftColX, infoY + 80, { width: leftColWidth, align: 'left' })
      } catch (e) {
        // Fail gracefully if payment fields are missing
      }

      // Right column: Bill To (plain text, no box)
      const customerName = user.name || order.shippingAddress?.name || 'Customer'
      const customerAddress = order.shippingAddress
      const customerMobile = user.mobile || order.shippingAddress?.mobile || ''
      const customerEmail = user.email || order.shippingAddress?.email || ''

      doc.fontSize(12).font('Helvetica-Bold').fillColor(colors.primaryDark)
        .text('Bill To:', rightColX, infoY + 8, { width: rightColWidth, align: 'left' })

      let rightTextY = infoY + 28
      doc.fontSize(11).font('Helvetica-Bold').fillColor(colors.textPrimary)
        .text(customerName, rightColX, rightTextY, { width: rightColWidth, align: 'left' })
      rightTextY += 18
      doc.fontSize(9).font('Helvetica').fillColor(colors.textSecondary)
      if (customerAddress) {
        if (customerAddress.address) {
          doc.text(customerAddress.address, rightColX, rightTextY, { width: rightColWidth, align: 'left' })
          rightTextY += 15
        }
        const cityStateZip = [
          customerAddress.city || '',
          customerAddress.state || '',
          customerAddress.zipCode || customerAddress.zip || ''
        ].filter(Boolean).join(', ')
        if (cityStateZip) {
          doc.text(cityStateZip, rightColX, rightTextY, { width: rightColWidth, align: 'left' })
          rightTextY += 15
        }
      }
      if (customerMobile) {
        doc.text(`Mobile: ${customerMobile}`, rightColX, rightTextY, { width: rightColWidth, align: 'left' })
        rightTextY += 15
      }
      if (customerEmail) {
        doc.text(`Email: ${customerEmail}`, rightColX, rightTextY, { width: rightColWidth, align: 'left' })
        rightTextY += 15
      }

      // Advance currentY past the info area
      currentY = infoY + infoHeight + 20

      // ========== ITEMS TABLE ==========
      const tableStartY = currentY + 10
      doc.y = tableStartY
      
      // Validate items array
      if (!order.items || !Array.isArray(order.items) || order.items.length === 0) {
        throw new Error('Order items are missing or invalid')
      }

      // Table Header with colored background - properly fitted
      const headerY = doc.y
      const headerRowHeight = 32
      const primaryLightRgb = hexToRgb(colors.primaryLight)
      const primaryDarkRgb = hexToRgb(colors.primaryDark)
      
      // Draw header background
      doc.rect(margin, headerY, contentWidth, headerRowHeight)
        .fillColor(`rgb(${primaryDarkRgb.r}, ${primaryDarkRgb.g}, ${primaryDarkRgb.b})`)
        .fill()
      
      // Column positions - properly calculated to fit within page width
      // Total available width: contentWidth = 515.28 (pageWidth - 2*margin)
      // Distribute columns properly to fit: ensure colTotal + colTotalWidth <= pageWidth - margin (555.28)
      const colItem = margin + 10
      const colItemWidth = 180
      const colSize = colItem + colItemWidth + 8
      const colSizeWidth = 42
      const colColor = colSize + colSizeWidth + 8
      const colColorWidth = 52
      const colQty = colColor + colColorWidth + 8
      const colQtyWidth = 32
      const colPrice = colQty + colQtyWidth + 8
      const colPriceWidth = 70
      const colTotal = colPrice + colPriceWidth + 8
      const colTotalWidth = 80
      
      // Verification: colTotal + colTotalWidth = 490 + 80 = 570, but should be <= 555.28
      // Need to adjust: reduce spacing or widths slightly
      // Recalculated: colTotal position = 40 + 10 + 180 + 8 + 42 + 8 + 52 + 8 + 32 + 8 + 70 + 8 = 466
      // colTotal + colTotalWidth = 466 + 80 = 546, which fits!
      
      doc.fontSize(11).font('Helvetica-Bold')
        .fillColor(colors.white)
        .text('Item', colItem, headerY + 10, { width: colItemWidth, align: 'left' })
        .text('Size', colSize, headerY + 10, { width: colSizeWidth, align: 'center' })
        .text('Color', colColor, headerY + 10, { width: colColorWidth, align: 'center' })
        .text('Qty', colQty, headerY + 10, { width: colQtyWidth, align: 'center' })
        .text('Price', colPrice, headerY + 10, { width: colPriceWidth, align: 'right' })
        .text('Total', colTotal, headerY + 10, { width: colTotalWidth, align: 'right' })
      
      doc.y = headerY + headerRowHeight + 12

      // Items rows with alternating background - no border lines
      let itemsY = doc.y
      doc.fontSize(10).font('Helvetica')
        .fillColor(colors.textPrimary)
      
      order.items.forEach((item, index) => {
        const itemName = item.name || item.product?.name || 'Product'
        const size = item.size || '-'
        const color = item.color || '-'
        const quantity = item.quantity || 1
        const price = parseFloat(item.price || 0)
        const total = price * quantity

        // Check if we need a new page
        if (itemsY > pageHeight - 250) {
          doc.addPage()
          itemsY = margin + 20
          // Redraw header on new page
          doc.rect(margin, itemsY - 10, contentWidth, headerRowHeight)
            .fillColor(`rgb(${primaryDarkRgb.r}, ${primaryDarkRgb.g}, ${primaryDarkRgb.b})`)
            .fill()
          doc.fontSize(11).font('Helvetica-Bold')
            .fillColor(colors.white)
            .text('Item', colItem, itemsY - 2, { width: colItemWidth, align: 'left' })
            .text('Size', colSize, itemsY - 2, { width: colSizeWidth, align: 'center' })
            .text('Color', colColor, itemsY - 2, { width: colColorWidth, align: 'center' })
            .text('Qty', colQty, itemsY - 2, { width: colQtyWidth, align: 'center' })
            .text('Price', colPrice, itemsY - 2, { width: colPriceWidth, align: 'right' })
            .text('Total', colTotal, itemsY - 2, { width: colTotalWidth, align: 'right' })
          itemsY += headerRowHeight + 12
        }

        // Calculate item name height first (needed for row height calculations)
        const itemNameHeight = doc.heightOfString(itemName, { width: colItemWidth })
        const rowHeight = Math.max(24, itemNameHeight + 12)

        // Alternate row background for better readability
        if (index % 2 === 0) {
          doc.rect(margin, itemsY - 3, contentWidth, rowHeight)
            .fillColor(colors.background)
            .fill()
        }

        // Item name and details - properly aligned with column widths
        doc.fillColor(colors.textPrimary)
          .fontSize(10)
          .font('Helvetica')
          .text(itemName, colItem, itemsY, { width: colItemWidth, align: 'left' })
          .text(size || '-', colSize, itemsY, { width: colSizeWidth, align: 'center' })
          .text(color || '-', colColor, itemsY, { width: colColorWidth, align: 'center' })
          .text(quantity.toString(), colQty, itemsY, { width: colQtyWidth, align: 'center' })
          // Use "Rs." instead of ₹ to avoid encoding issues
          .text(`Rs. ${price.toFixed(2)}`, colPrice, itemsY, { width: colPriceWidth, align: 'right' })
          .text(`Rs. ${total.toFixed(2)}`, colTotal, itemsY, { width: colTotalWidth, align: 'right' })

        itemsY += rowHeight
      })

      doc.y = itemsY + 20

      // ========== TOTALS SECTION ==========
      const subtotal = parseFloat(order.subtotal || 0)
      const shippingCost = parseFloat(order.shippingCost || 0)
      const tax = parseFloat(order.tax || 0)
      const grandTotal = parseFloat(order.total || 0)

      // Totals section - no background box, clean and elegant
      const totalsStartX = colTotal
      const totalsLabelWidth = 100
      const totalsValueWidth = colTotalWidth
      let totalsY = doc.y

      doc.fontSize(10).font('Helvetica')
        .fillColor(colors.textSecondary)
        .text('Subtotal:', totalsStartX - totalsLabelWidth - 10, totalsY, { width: totalsLabelWidth, align: 'right' })
        .fillColor(colors.textPrimary)
        .fontSize(10)
        .font('Helvetica')
        .text(`Rs. ${subtotal.toFixed(2)}`, totalsStartX, totalsY, { width: totalsValueWidth, align: 'right' })
        totalsY += 20

      if (shippingCost > 0) {
        doc.fillColor(colors.textSecondary)
          .fontSize(10)
          .font('Helvetica')
          .text('Shipping:', totalsStartX - totalsLabelWidth - 10, totalsY, { width: totalsLabelWidth, align: 'right' })
          .fillColor(colors.textPrimary)
          .fontSize(10)
          .font('Helvetica')
          .text(`Rs. ${shippingCost.toFixed(2)}`, totalsStartX, totalsY, { width: totalsValueWidth, align: 'right' })
        totalsY += 20
      }

      if (tax > 0) {
        doc.fillColor(colors.textSecondary)
          .fontSize(10)
          .font('Helvetica')
          .text('Tax (GST):', totalsStartX - totalsLabelWidth - 10, totalsY, { width: totalsLabelWidth, align: 'right' })
          .fillColor(colors.textPrimary)
          .fontSize(10)
          .font('Helvetica')
          .text(`Rs. ${tax.toFixed(2)}`, totalsStartX, totalsY, { width: totalsValueWidth, align: 'right' })
        totalsY += 20
      }

      // Grand Total - enhanced styling without background
      totalsY += 8
      
      doc.fontSize(13).font('Helvetica-Bold')
        .fillColor(colors.primaryDark)
        .text('Total:', totalsStartX - totalsLabelWidth - 10, totalsY, { width: totalsLabelWidth, align: 'right' })
        .fontSize(13)
        .font('Helvetica-Bold')
        .fillColor(colors.textPrimary)
        .text(`Rs. ${grandTotal.toFixed(2)}`, totalsStartX, totalsY, { width: totalsValueWidth, align: 'right' })
      
      doc.y = totalsY + 30

      // ========== FOOTER SECTION ==========
      const footerY = doc.y + 20

      // Thank You message (centered)
      doc.fontSize(18).font('Helvetica-Bold')
        .fillColor(colors.primaryDark)
        .text('Thank You for Shopping with Us!', margin, footerY, { 
          width: contentWidth, 
          align: 'center' 
        })

      // Ensure footerTextY exists (used for spacing)
      const footerTextY = footerY + 30
      // Brand name at bottom right with elegant styling (ensure single-line)
      const brandY = footerTextY + 25
      const brandText = 'Arudhra Fashions'
      doc.fontSize(15).font('Times-Italic')
        .fillColor(colors.primaryDark)
      // Place brand text right-aligned without wrapping
      const brandTextWidth = doc.widthOfString(brandText)
      const brandPosX = pageWidth - margin - brandTextWidth
      doc.text(brandText, brandPosX, brandY)

      // Support / queries contact info below brand name (right-aligned)
      const queriesY = brandY + 18
      doc.fontSize(10).font('Helvetica-Bold')
        .fillColor(colors.textPrimary)
        .text('For Queries', pageWidth - margin - 150, queriesY, {
          width: 150,
          align: 'right'
        })

      doc.fontSize(9).font('Helvetica')
        .fillColor(colors.textSecondary)
        .text('support@arudhrafashions.com', pageWidth - margin - 150, queriesY + 12, {
          width: 150,
          align: 'right'
        })

      doc.fontSize(9).font('Helvetica')
        .fillColor(colors.textSecondary)
        .text('+916384737391', pageWidth - margin - 150, queriesY + 26, {
          width: 150,
          align: 'right'
        })
      
      // Draw bottom-page note (transparent) on each page
      const drawBottomNote = () => {
        try {
          const bottomY = pageHeight - (margin / 2) - 6
          doc.save()
          doc.fontSize(8).font('Helvetica').fillColor(colors.textSecondary)
          doc.opacity(0.35)
          doc.text('This computer-generated document is valid without signature or company stamp.', margin, bottomY, {
            width: contentWidth,
            align: 'center'
          })
          doc.restore()
          doc.opacity(1)
        } catch (e) {
          console.error('Invoice generator: failed to draw bottom note:', e)
        }
      }
      // Draw on current page and future pages
      drawBottomNote()
      doc.on('pageAdded', drawBottomNote)

      // Finalize PDF
      doc.end()

      stream.on('finish', () => {
        // Return a project-relative path (no leading slash) so callers can reliably
        // build absolute paths with path.join(__dirname, '..', returnedPath)
        resolve(path.join('uploads', 'invoices', filename))
      })

      stream.on('error', (error) => {
        reject(error)
      })
    } catch (error) {
      reject(error)
    }
  })
}
