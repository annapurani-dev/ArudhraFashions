/**
 * Fixed coin rules - mirrored from backend
 * Allotment: coins earned based on order total
 * Redemption: discount % based on coins redeemed (max 1500 coins)
 */

export const ALLOTMENT_TIERS = [
  { minAmount: 0, maxAmount: 1000, coins: 10 },
  { minAmount: 1001, maxAmount: 1999, coins: 30 },
  { minAmount: 2000, maxAmount: 3999, coins: 50 },
  { minAmount: 4000, maxAmount: 5999, coins: 150 },
  { minAmount: 6000, maxAmount: 7999, coins: 200 },
  { minAmount: 8000, maxAmount: Infinity, coins: 350 }
]

export const REDEMPTION_TIERS = [
  { minCoins: 500, discountPercent: 10 },
  { minCoins: 1000, discountPercent: 15 },
  { minCoins: 1500, discountPercent: 20 }
]

export const MAX_REDEMPTION_COINS = 1500

export function getNextTierInfo(orderTotal) {
  const total = parseFloat(orderTotal) || 0
  for (let i = 0; i < ALLOTMENT_TIERS.length; i++) {
    const tier = ALLOTMENT_TIERS[i]
    if (total < tier.minAmount) {
      return {
        coins: tier.coins,
        amountNeeded: Math.max(0, tier.minAmount - total)
      }
    }
  }
  // Already at highest tier
  return null
}

export function getCoinsForOrderTotal(orderTotal) {
  const total = parseFloat(orderTotal) || 0
  for (const tier of ALLOTMENT_TIERS) {
    if (total >= tier.minAmount && total <= tier.maxAmount) {
      return tier.coins
    }
  }
  return 0
}

export function getRedemptionDiscount(coinsToRedeem, subtotal) {
  const coins = parseInt(coinsToRedeem, 10) || 0
  const total = parseFloat(subtotal) || 0

  if (coins <= 0 || total <= 0 || coins > MAX_REDEMPTION_COINS) {
    return { discountPercent: 0, discountAmount: 0 }
  }

  let discountPercent = 0
  for (const tier of REDEMPTION_TIERS) {
    if (coins >= tier.minCoins) {
      discountPercent = tier.discountPercent
    }
  }

  const discountAmount = (total * discountPercent) / 100
  return { discountPercent, discountAmount: Math.round(discountAmount * 100) / 100 }
}
