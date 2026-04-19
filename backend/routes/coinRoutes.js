import express from 'express'
import { protect } from '../middleware/auth.js'
import User from '../models/User.js'
import CoinTransaction from '../models/CoinTransaction.js'
import { getRedemptionDiscount, MAX_REDEMPTION_COINS, ALLOTMENT_TIERS, REDEMPTION_TIERS } from '../utils/coinRules.js'

const router = express.Router()

const getRulesForFrontend = () => ({
  allotment: ALLOTMENT_TIERS,
  redemption: REDEMPTION_TIERS,
  maxRedemptionCoins: MAX_REDEMPTION_COINS
})

// @route   GET /api/coins/balance
// @desc    Get user coin balance
// @access  Private
router.get('/balance', protect, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    const rules = getRulesForFrontend()

    res.json({
      balance: user.coins || 0,
      rules
    })
  } catch (error) {
    console.error('Get coin balance error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/coins/transactions
// @desc    Get user coin transaction history
// @access  Private
router.get('/transactions', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 20
    const offset = (page - 1) * limit

    const transactions = await CoinTransaction.findAndCountAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
      limit,
      offset
    })

    res.json({
      transactions: transactions.rows,
      total: transactions.count,
      page,
      totalPages: Math.ceil(transactions.count / limit)
    })
  } catch (error) {
    console.error('Get coin transactions error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   POST /api/coins/calculate-discount
// @desc    Calculate discount for coin redemption
// @access  Private
router.post('/calculate-discount', protect, async (req, res) => {
  try {
    const { coinsToRedeem, subtotal } = req.body

    if (!coinsToRedeem || coinsToRedeem <= 0) {
      return res.status(400).json({ message: 'Invalid coins to redeem' })
    }

    if (!subtotal || subtotal <= 0) {
      return res.status(400).json({ message: 'Invalid subtotal' })
    }

    const user = await User.findByPk(req.user.id)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    if (user.coins < coinsToRedeem) {
      return res.status(400).json({ message: 'Insufficient coins' })
    }

    if (coinsToRedeem > MAX_REDEMPTION_COINS) {
      return res.status(400).json({ message: `Cannot redeem more than ${MAX_REDEMPTION_COINS} coins` })
    }

    const { discountPercent, discountAmount } = getRedemptionDiscount(coinsToRedeem, subtotal)

    res.json({
      coinsToRedeem,
      discountAmount,
      discountPercent
    })
  } catch (error) {
    console.error('Calculate discount error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   POST /api/coins/redeem
// @desc    Redeem coins for discount (called during checkout)
// @access  Private
router.post('/redeem', protect, async (req, res) => {
  try {
    const { coinsToRedeem, orderId } = req.body

    if (!coinsToRedeem || coinsToRedeem <= 0) {
      return res.status(400).json({ message: 'Invalid coins to redeem' })
    }

    const user = await User.findByPk(req.user.id)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    if (user.coins < coinsToRedeem) {
      return res.status(400).json({ message: 'Insufficient coins' })
    }

    if (coinsToRedeem > MAX_REDEMPTION_COINS) {
      return res.status(400).json({ message: `Cannot redeem more than ${MAX_REDEMPTION_COINS} coins` })
    }

    // Deduct coins
    const newBalance = user.coins - coinsToRedeem
    user.coins = newBalance
    await user.save()

    // Create transaction record
    await CoinTransaction.create({
      userId: user.id,
      type: 'spent',
      amount: coinsToRedeem,
      balanceAfter: newBalance,
      description: orderId ? `Redeemed for order ${orderId}` : 'Redeemed for discount',
      orderId: orderId || null,
      metadata: {
        redemption: true
      }
    })

    res.json({
      success: true,
      coinsRedeemed: coinsToRedeem,
      newBalance
    })
  } catch (error) {
    console.error('Redeem coins error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

export default router
