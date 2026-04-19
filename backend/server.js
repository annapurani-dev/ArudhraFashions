process.on('uncaughtException', err => {
  console.error('❌ Uncaught Exception:', err);
});

process.on('unhandledRejection', err => {
  console.error('❌ Unhandled Rejection:', err);
});

import express from 'express'
import dotenv from 'dotenv'
// Load environment variables as early as possible so imported modules can access them
dotenv.config()
import cors from 'cors'
import connectDB from './config/db.js'
import http from 'http'
import https from 'https'
import { URL } from 'url'

// Import models to set up associations
import './models/index.js'

// Import routes
import authRoutes from './routes/authRoutes.js'
import productRoutes from './routes/productRoutes.js'
import cartRoutes from './routes/cartRoutes.js'
import orderRoutes from './routes/orderRoutes.js'
import wishlistRoutes from './routes/wishlistRoutes.js'
import compareRoutes from './routes/compareRoutes.js'
import addressRoutes from './routes/addressRoutes.js'
import paymentRoutes from './routes/paymentRoutes.js'
import reviewRoutes from './routes/reviewRoutes.js'
import checkoutRoutes from './routes/checkoutRoutes.js'
import adminRoutes from './routes/adminRoutes.js'
import adminAuthRoutes from './routes/adminAuthRoutes.js'
// import bannerRoutes from './routes/bannerRoutes.js' // DISABLED: banner API temporarily disabled
import couponRoutes from './routes/couponRoutes.js'
import settingRoutes from './routes/settingRoutes.js'
import contactRoutes from './routes/contactRoutes.js'
import returnRoutes from './routes/returnRoutes.js'
import categoryRoutes from './routes/categoryRoutes.js'
import discountRoutes from './routes/discountRoutes.js'
import newsletterRoutes from './routes/newsletterRoutes.js'
import contentRoutes from './routes/contentRoutes.js'
import inventoryRoutes from './routes/inventoryRoutes.js'
import emailTemplateRoutes from './routes/emailTemplateRoutes.js'
import uploadRoutes from './routes/uploadRoutes.js'
import newArrivalRoutes from './routes/newArrivalRoutes.js'
import testimonialRoutes from './routes/testimonialRoutes.js'
import saleStripRoutes from './routes/saleStripRoutes.js'
import coinRoutes from './routes/coinRoutes.js'
import imageRoutes from './routes/imageRoutes.js'
import pushNotificationRoutes from './routes/pushNotificationRoutes.js'

// Load environment variables (already loaded at top)

const app = express()

// Middleware — CORS: allow frontend and admin origins
const allowedOrigins = [
  'https://arudhrafashions.com',
  'https://www.arudhrafashions.com',
  process.env.FRONTEND_URL,
  process.env.ADMIN_URL,
  'http://localhost:5173',
  'http://localhost:4173',
  'http://localhost:3000'
].filter(Boolean)

function isOriginAllowed(origin) {
  if (!origin) return true
  return allowedOrigins.includes(origin) || origin.endsWith('.arudhrafashions.com')
}

// 1) Set CORS on every response first (so errors still get headers)
app.use((req, res, next) => {
  const origin = req.headers.origin
  // Always set CORS for allowed origin; for OPTIONS preflight, echo back the request origin if allowed
  if (origin && isOriginAllowed(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Access-Control-Allow-Credentials', 'true')
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH')
    res.setHeader('Access-Control-Allow-Headers', req.headers['access-control-request-headers'] || 'Content-Type, Authorization, x-warmup-secret')
    res.setHeader('Access-Control-Max-Age', '600')
  }
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204)
  }
  next()
})

const corsOptions = {
  origin: (origin, callback) => callback(null, !origin || isOriginAllowed(origin)),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-warmup-secret'],
  preflightContinue: false
}
app.use(cors(corsOptions))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Mark API responses so we can verify requests reach the backend server
app.use('/api', (req, res, next) => {
  res.header('X-Served-By', 'arudhra-backend')
  next()
})

// Simple diagnostic endpoint to verify CORS and routing
app.options('/api/diagnostic', (req, res) => {
  // Respond to preflight explicitly
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*')
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization')
  res.header('Access-Control-Allow-Credentials', 'true')
  return res.sendStatus(200)
})
app.get('/api/diagnostic', (req, res) => {
  return res.json({
    ok: true,
    servedBy: 'arudhra-backend',
    originHeader: req.headers.origin || null
  })
})

// Serve static files (uploaded images)
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
app.use('/uploads', express.static(join(__dirname, 'uploads')))

// Public/Customer Routes
app.use('/api/auth', authRoutes)
app.use('/api/products', productRoutes)
app.use('/api/products', reviewRoutes) // Product reviews
app.use('/api/cart', cartRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/checkout', checkoutRoutes)
app.use('/api/wishlist', wishlistRoutes)
app.use('/api/compare', compareRoutes)
app.use('/api/addresses', addressRoutes)
app.use('/api/payment-methods', paymentRoutes)
// app.use('/api/banners', bannerRoutes) // DISABLED: banner API temporarily disabled
app.use('/api/coupons', couponRoutes)
app.use('/api/discounts', discountRoutes)
app.use('/api/settings', settingRoutes)
app.use('/api/contact', contactRoutes)
app.use('/api/returns', returnRoutes)
app.use('/api/newsletter', newsletterRoutes)
app.use('/api/content', contentRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/new-arrivals', newArrivalRoutes)
app.use('/api/testimonials', testimonialRoutes)
app.use('/api/sale-strips', saleStripRoutes)
app.use('/api/coins', coinRoutes)

// Admin Routes
app.use('/api/admin/auth', adminAuthRoutes)
app.use('/api/admin/upload', uploadRoutes)
app.use('/api/admin', adminRoutes)
// app.use('/api/admin/banners', bannerRoutes) // DISABLED: banner API temporarily disabled
app.use('/api/admin/coupons', couponRoutes)
app.use('/api/admin/settings', settingRoutes)
app.use('/api/admin/queries', contactRoutes)
app.use('/api/admin/returns', returnRoutes)
app.use('/api/admin/categories', categoryRoutes)
app.use('/api/admin/discounts', discountRoutes)
app.use('/api/admin/newsletter', newsletterRoutes)
app.use('/api/admin/content', contentRoutes)
app.use('/api/admin/new-arrivals', newArrivalRoutes)
app.use('/api/admin/testimonials', testimonialRoutes)
app.use('/api/admin/sale-strips', saleStripRoutes)
app.use('/api/admin/inventory', inventoryRoutes)
app.use('/api/admin/email-templates', emailTemplateRoutes)
app.use('/api/admin/push', pushNotificationRoutes)

// Serve images stored in DB
app.use('/api/images', imageRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Arudhra Fashions API is running' })
})

// Lightweight warmup endpoint to prevent cold starts.
// If WARMUP_SECRET is set, requests must include the header `x-warmup-secret`.
app.get('/_warmup', (req, res) => {
  const secret = process.env.WARMUP_SECRET
  if (secret) {
    const provided = req.headers['x-warmup-secret']
    if (!provided || provided !== secret) {
      return res.sendStatus(401)
    }
  }
  // Minimal response — do NOT touch DB or heavy services here.
  return res.json({ ok: true, warmedAt: new Date().toISOString() })
})

// Serve frontend static files (Vite build) so backend can serve the SPA in production
// NOTE: frontend is served separately (e.g. static site on arudhrafashions.com).
// Keep backend focused on API routes only so /api/* are handled here.

// Error handling middleware (ensure CORS on error responses)
app.use((err, req, res, next) => {
  console.error(err.stack)
  const origin = req.headers.origin
  if (origin && (allowedOrigins.includes(origin) || origin.endsWith('.arudhrafashions.com'))) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Access-Control-Allow-Credentials', 'true')
  }
  res.status(500).json({ message: 'Something went wrong!' })
})

// Connect to database and start server
const startServer = async () => {
  try {
    await connectDB()

    const PORT = process.env.PORT || 5001
    //const HOST = process.env.HOST || '0.0.0.0'

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    // Self-ping / keep-alive logic to reduce cold starts.
    // Enable by setting KEEP_ALIVE=true. Interval controlled by KEEP_ALIVE_INTERVAL_MS (ms).
    if (process.env.KEEP_ALIVE === 'true') {
      const intervalMs = parseInt(process.env.KEEP_ALIVE_INTERVAL_MS || '', 10) || 5 * 60 * 1000 // default 5 minutes
      const warmupUrl = process.env.KEEP_ALIVE_URL || `http://127.0.0.1:${PORT}/_warmup`
      const warmupSecret = process.env.WARMUP_SECRET

      const ping = (url) => {
        try {
          const u = new URL(url)
          const lib = u.protocol === 'https:' ? https : http
          const options = {
            method: 'GET',
            hostname: u.hostname,
            port: u.port,
            path: u.pathname + u.search,
            timeout: 5000,
            headers: {}
          }
          if (warmupSecret) options.headers['x-warmup-secret'] = warmupSecret

          const req = lib.request(options, (res) => {
            // consume data to finish the request
            res.on('data', () => { })
            res.on('end', () => {
              console.debug(`[keep-alive] pinged ${url} -> ${res.statusCode}`)
            })
          })
          req.on('error', (err) => {
            console.debug(`[keep-alive] ping error: ${err.message}`)
          })
          req.on('timeout', () => {
            req.destroy()
          })
          req.end()
        } catch (err) {
          console.debug('[keep-alive] ping failed', err.message)
        }
      }

      // Immediate ping, then periodic pings.
      setTimeout(() => ping(warmupUrl), 1000)
      setInterval(() => ping(warmupUrl), intervalMs)
      console.log(`[keep-alive] enabled — pinging ${warmupUrl} every ${intervalMs}ms`)
    }
  } catch (error) {
    console.error('Failed to start server:', error.message)
    process.exit(1)
  }
}

startServer()

