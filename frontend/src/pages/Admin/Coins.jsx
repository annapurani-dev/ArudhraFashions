import { useState, useEffect } from 'react'
import { Coins as CoinsIcon, TrendingUp, Gift, Info } from 'lucide-react'
import { CoinsSkeleton } from '../../components/Skeletons/PageSkeletons'
import { ALLOTMENT_TIERS, REDEMPTION_TIERS, MAX_REDEMPTION_COINS } from '../../constants/coinRules'

function Coins() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(false)
  }, [])

  if (loading) {
    return (
      <div className="admin-page">
        <CoinsSkeleton />
      </div>
    )
  }

  const formatRange = (min, max) => {
    if (max === Infinity) return `₹${min.toLocaleString()} and above`
    return `₹${min.toLocaleString()} - ₹${max.toLocaleString()}`
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>Coins & Rewards</h1>
          <p>Fixed rules for coin allotment and redemption</p>
        </div>
      </div>

      <div className="coins-config-sections">
        {/* Coin Allotment Rules */}
        <div className="coins-config-card">
          <div className="coins-config-header">
            <div className="coins-config-icon earning-icon">
              <TrendingUp size={28} />
            </div>
            <div>
              <h2>Coin Allotment Rules</h2>
              <p>Coins earned based on order total</p>
            </div>
          </div>
          <div className="coins-config-content">
            <div className="coins-rules-table">
              <table>
                <thead>
                  <tr>
                    <th>Order Value</th>
                    <th>Coins Awarded</th>
                  </tr>
                </thead>
                <tbody>
                  {ALLOTMENT_TIERS.map((tier, i) => (
                    <tr key={i}>
                      <td>{formatRange(tier.minAmount, tier.maxAmount)}</td>
                      <td>{tier.coins} coins</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Coin Redemption Rules */}
        <div className="coins-config-card">
          <div className="coins-config-header">
            <div className="coins-config-icon redemption-icon">
              <Gift size={28} />
            </div>
            <div>
              <h2>Coin Redemption Rules</h2>
              <p>Discount when redeeming coins (max {MAX_REDEMPTION_COINS} coins)</p>
            </div>
          </div>
          <div className="coins-config-content">
            <div className="coins-rules-table">
              <table>
                <thead>
                  <tr>
                    <th>Coins Redeemed</th>
                    <th>Discount</th>
                  </tr>
                </thead>
                <tbody>
                  {REDEMPTION_TIERS.map((tier, i) => (
                    <tr key={i}>
                      <td>{tier.minCoins} coins</td>
                      <td>{tier.discountPercent}% off</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="coins-config-preview">
              <Info size={18} />
              <div>
                <strong>Max redemption:</strong> {MAX_REDEMPTION_COINS} coins per order
              </div>
            </div>
          </div>
        </div>

        {/* Information Section */}
        <div className="coins-config-info">
          <div className="coins-config-info-header">
            <CoinsIcon size={24} />
            <h3>How It Works</h3>
          </div>
          <ul className="coins-config-info-list">
            <li>
              <strong>Coin Earning:</strong> Customers earn coins based on their order total. Higher order values earn more coins.
            </li>
            <li>
              <strong>Coin Redemption:</strong> Redeem 500, 1000, or 1500 coins for 10%, 15%, or 20% discount respectively. Maximum 1500 coins per order.
            </li>
            <li>
              <strong>Balance Tracking:</strong> All coin transactions are tracked in the customer's account.
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default Coins
