/**
 * Fixed coin rules - no longer dynamic/admin-configurable.
 * Allotment: coins earned based on order total
 * Redemption: discount % based on coins redeemed (max 1500 coins)
 */

// Allotment tiers: order total range → coins
// Below/up to 1000 → 10, 1001-1999 → 30, 2000-3999 → 50, 4000-5999 → 150, 6000-7999 → 200, 8000+ → 350
export const ALLOTMENT_TIERS = [
  { minAmount: 0, maxAmount: 1000, coins: 10 },
  { minAmount: 1001, maxAmount: 1999, coins: 30 },
  { minAmount: 2000, maxAmount: 3999, coins: 50 },
  { minAmount: 4000, maxAmount: 5999, coins: 150 },
  { minAmount: 6000, maxAmount: 7999, coins: 200 },
  { minAmount: 8000, maxAmount: Infinity, coins: 350 }
]

// Redemption tiers: [minCoins, discountPercent] - use highest tier that coins qualify for
// 500 coins → 10%, 1000 coins → 15%, 1500 coins → 20%
export const REDEMPTION_TIERS = [
  { minCoins: 500, discountPercent: 10 },
  { minCoins: 1000, discountPercent: 15 },
  { minCoins: 1500, discountPercent: 20 }
]

export const MAX_REDEMPTION_COINS = 1500

/**
 * Get coins to award based on order total
 */
export function getCoinsForOrderTotal(orderTotal) {
  const total = parseFloat(orderTotal) || 0
  for (const tier of ALLOTMENT_TIERS) {
    if (total >= tier.minAmount && total <= tier.maxAmount) {
      return tier.coins
    }
  }
  return 0
}

/**
 * Get discount for redeeming coins. Returns { discountPercent, discountAmount }
 * Coins above 1500 cannot be redeemed.
 */
export function getRedemptionDiscount(coinsToRedeem, subtotal) {
  const coins = parseInt(coinsToRedeem, 10) || 0
  const total = parseFloat(subtotal) || 0

  if (coins <= 0 || total <= 0) {
    return { discountPercent: 0, discountAmount: 0 }
  }

  if (coins > MAX_REDEMPTION_COINS) {
    return { discountPercent: 0, discountAmount: 0 }
  }

  // Find highest tier user qualifies for
  let discountPercent = 0
  for (const tier of REDEMPTION_TIERS) {
    if (coins >= tier.minCoins) {
      discountPercent = tier.discountPercent
    }
  }

  const discountAmount = (total * discountPercent) / 100
  return { discountPercent, discountAmount: Math.round(discountAmount * 100) / 100 }
}
