import { useState, useEffect } from 'react'
import { Coins, TrendingUp, TrendingDown, Clock, Gift, Info, ShoppingBag, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react'
import { coinsAPI } from '../utils/api'
import { useToast } from './Toast/ToastContainer'
import Loading from './Loading/Loading'
import { CoinsSkeleton } from './Skeletons/PageSkeletons'
import { ALLOTMENT_TIERS, REDEMPTION_TIERS, MAX_REDEMPTION_COINS } from '../constants/coinRules'

function CoinsTab({ user, showSuccessToast, showError }) {
  const [coinBalance, setCoinBalance] = useState(0)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    loadCoinData()
  }, [page, user])

  const loadCoinData = async () => {
    try {
      setLoading(true)
      const [balanceData, transactionsData] = await Promise.all([
        coinsAPI.getBalance(),
        coinsAPI.getTransactions(page, 20)
      ])
      setCoinBalance(balanceData.balance || 0)
      setTransactions(transactionsData.transactions || [])
      setTotalPages(transactionsData.totalPages || 1)
    } catch (err) {
      console.error('Failed to load coin data:', err)
      showError('Failed to load coin information')
    } finally {
      setLoading(false)
    }
  }

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'earned':
        return <TrendingUp size={20} className="text-success" />
      case 'spent':
        return <TrendingDown size={20} className="text-danger" />
      case 'expired':
        return <Clock size={20} className="text-warning" />
      case 'refunded':
        return <Gift size={20} className="text-info" />
      default:
        return <Coins size={20} />
    }
  }

  const getTransactionColor = (type) => {
    switch (type) {
      case 'earned':
        return 'text-success'
      case 'spent':
        return 'text-danger'
      case 'expired':
        return 'text-warning'
      case 'refunded':
        return 'text-info'
      default:
        return ''
    }
  }

  if (loading) {
    return (
      <div className="dashboard-section">
        <CoinsSkeleton />
      </div>
    )
  }

  return (
    <div className="dashboard-section">
      <div className="coins-header">
        <h2>Coins & Rewards</h2>
        <p className="coins-subtitle">
          Earn coins on every purchase. Redeem 500/1000/1500 coins for 10%/15%/20% off (max {MAX_REDEMPTION_COINS} coins per order)
        </p>
      </div>

      {/* Coin Balance Card */}
      <div className="coin-balance-card">
        <div className="coin-balance-icon">
          <Coins size={48} />
        </div>
        <div className="coin-balance-content">
          <div className="coin-balance-label">Your Coin Balance</div>
          <div className="coin-balance-amount">{coinBalance}</div>
          <div className="coin-balance-info">
            500 coins = 10% | 1000 coins = 15% | 1500 coins = 20% off
          </div>
        </div>
      </div>

      {/* Coin Rules */}
      <div className="coin-rules-section">
        <div className="coin-rules-header">
          <div className="coin-rules-header-icon">
            <Sparkles size={28} />
          </div>
          <div>
            <h3>How It Works</h3>
            <p className="coin-rules-subtitle">Earn and redeem your rewards</p>
          </div>
        </div>

        <div className="coin-steps-container">
          <div className="coin-step-card">
            <div className="coin-step-number">1</div>
            <div className="coin-step-content">
              <div className="coin-step-header">
                <ShoppingBag size={24} className="coin-step-icon" />
                <h4>Shop & Earn</h4>
              </div>
              <p className="coin-step-description">
                Earn coins based on your order value
              </p>
              <div className="coin-step-reward">
                <Coins size={18} />
                <span>₹0-1000: 10 coins | ₹1001-1999: 30 | ₹2000+: 50-350 coins</span>
              </div>
            </div>
          </div>

          <div className="coin-step-card">
            <div className="coin-step-number">2</div>
            <div className="coin-step-content">
              <div className="coin-step-header">
                <Gift size={24} className="coin-step-icon" />
                <h4>Redeem & Save</h4>
              </div>
              <p className="coin-step-description">
                Redeem coins at checkout for discounts
              </p>
              <div className="coin-step-reward">
                <CheckCircle2 size={18} />
                <span>
                  {REDEMPTION_TIERS.map((t, i) => (
                    <span key={i}>{t.minCoins} coins = {t.discountPercent}%{i < REDEMPTION_TIERS.length - 1 ? ' | ' : ''}</span>
                  ))}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="coin-info-grid">
          <div className="coin-info-card earn-card">
            <div className="coin-info-icon-wrapper">
              <TrendingUp size={28} />
            </div>
            <div className="coin-info-content">
              <h4>Earn Coins</h4>
              <p className="coin-info-main">
                <span className="coin-info-highlight">10-350 coins</span>
              </p>
              <p className="coin-info-detail">
                Based on order total
              </p>
            </div>
          </div>

          <div className="coin-info-card redeem-card">
            <div className="coin-info-icon-wrapper">
              <Gift size={28} />
            </div>
            <div className="coin-info-content">
              <h4>Redeem Coins</h4>
              <p className="coin-info-main">
                <span className="coin-info-highlight">Up to 20% off</span>
              </p>
              <p className="coin-info-detail">
                Max {MAX_REDEMPTION_COINS} coins per order
              </p>
            </div>
          </div>
        </div>

        <div className="coin-tips-section">
          <div className="coin-tips-header">
            <Info size={20} />
            <h4>Tips</h4>
          </div>
          <ul className="coin-tips-list">
            <li>
              <CheckCircle2 size={16} />
              <span>Coins are added after successful payment</span>
            </li>
            <li>
              <CheckCircle2 size={16} />
              <span>Redeem 500, 1000, or 1500 coins for 10%, 15%, or 20% discount at checkout</span>
            </li>
            <li>
              <CheckCircle2 size={16} />
              <span>Maximum {MAX_REDEMPTION_COINS} coins can be redeemed per order</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Transaction History */}
      <div className="coin-transactions-section">
        <h3>Transaction History</h3>
        {transactions.length === 0 ? (
          <div className="empty-state">
            <Coins size={48} />
            <h3>No transactions yet</h3>
            <p>Make a purchase to earn coins and see your history here</p>
          </div>
        ) : (
          <>
            <div className="coin-transactions-list">
              {transactions.map(transaction => (
                <div key={transaction.id} className="coin-transaction-item">
                  <div className="transaction-icon-wrapper">
                    {getTransactionIcon(transaction.type)}
                  </div>
                  <div className="transaction-details">
                    <div className="transaction-description">{transaction.description}</div>
                    <div className="transaction-date">
                      {new Date(transaction.createdAt).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                  <div className={`transaction-amount ${getTransactionColor(transaction.type)}`}>
                    {transaction.type === 'earned' || transaction.type === 'refunded' ? '+' : '-'}
                    {transaction.amount} coins
                  </div>
                  <div className="transaction-balance">
                    Balance: {transaction.balanceAfter} coins
                  </div>
                </div>
              ))}
            </div>
            {totalPages > 1 && (
              <div className="pagination">
                <button
                  className="btn btn-outline"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </button>
                <span className="pagination-info">Page {page} of {totalPages}</span>
                <button
                  className="btn btn-outline"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default CoinsTab
