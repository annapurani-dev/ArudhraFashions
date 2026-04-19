import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Package, ShoppingBag, Users, IndianRupee, AlertCircle, ArrowUp, ArrowDown, MessageSquare, ExternalLink, RotateCcw, TrendingUp, Award } from 'lucide-react'
import { adminDashboardAPI, adminInventoryAPI, adminQueriesAPI } from '../../utils/adminApi'
import { useToast } from '../../components/Toast/ToastContainer'

function DashboardOverview() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalProducts: 0,
    revenueChange: 0,
    ordersChange: 0
  })
  const [topProducts, setTopProducts] = useState([])
  const [revenueChartData, setRevenueChartData] = useState([])
  const [chartPeriod, setChartPeriod] = useState('7days')
  const [lowStockCount, setLowStockCount] = useState(0)
  const [pendingQueriesCount, setPendingQueriesCount] = useState(0)
  const [orderStatusBreakdown, setOrderStatusBreakdown] = useState([])
  const [returnsSummary, setReturnsSummary] = useState({
    totalReturns: 0,
    pendingReturns: 0,
    refundedReturns: 0,
    totalRefundedAmount: 0,
    pendingRefundAmount: 0
  })
  const [topCustomers, setTopCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const { error: showError } = useToast()

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const [statsData, productsData, chartData, lowStockData, queriesData, statusBreakdown, returnsData, customersData] = await Promise.all([
        adminDashboardAPI.getStats(),
        adminDashboardAPI.getTopProducts(),
        adminDashboardAPI.getRevenueChart(chartPeriod),
        adminInventoryAPI.getLowStock(3).catch(() => []),
        adminQueriesAPI.getAll({ status: 'new' }).catch(() => []),
        adminDashboardAPI.getOrderStatusBreakdown().catch(() => ({ breakdown: [], total: 0 })),
        adminDashboardAPI.getReturnsSummary().catch(() => ({
          totalReturns: 0,
          pendingReturns: 0,
          refundedReturns: 0,
          totalRefundedAmount: 0,
          pendingRefundAmount: 0
        })),
        adminDashboardAPI.getTopCustomers(5).catch(() => [])
      ])

      setStats({
        totalRevenue: statsData.totalRevenue || 0,
        totalOrders: statsData.totalOrders || 0,
        totalCustomers: statsData.totalCustomers || 0,
        totalProducts: statsData.totalProducts || 0,
        revenueChange: statsData.revenueChange || 0,
        ordersChange: statsData.ordersChange || 0
      })
      setTopProducts(productsData || [])
      setRevenueChartData(chartData.data || [])
      setLowStockCount(Array.isArray(lowStockData) ? lowStockData.length : 0)
      setPendingQueriesCount(Array.isArray(queriesData) ? queriesData.length : 0)
      setOrderStatusBreakdown(statusBreakdown.breakdown || [])
      setReturnsSummary(returnsData)
      setTopCustomers(Array.isArray(customersData) ? customersData : [])
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      showError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chartPeriod])

  const statCards = [
    {
      title: 'Total Revenue',
      value: stats.totalRevenue >= 100000 
        ? `₹${(stats.totalRevenue / 100000).toFixed(2)}L` 
        : `₹${stats.totalRevenue.toLocaleString()}`,
      change: stats.revenueChange,
      hasChange: true,
      icon: IndianRupee,
      color: 'success'
    },
    {
      title: 'Total Orders',
      value: stats.totalOrders.toLocaleString(),
      change: stats.ordersChange,
      hasChange: true,
      icon: ShoppingBag,
      color: 'primary'
    },
    {
      title: 'Total Customers',
      value: stats.totalCustomers.toLocaleString(),
      change: null,
      hasChange: false,
      icon: Users,
      color: 'info'
    },
    {
      title: 'Total Products',
      value: stats.totalProducts.toLocaleString(),
      change: null,
      hasChange: false,
      icon: Package,
      color: 'warning'
    }
  ]


  return (
    <div className="admin-page dashboard-overview">
      <div className="admin-page-header">
        <h1>Dashboard Overview</h1>
        <p>Welcome back! Here's what's happening with your store today.</p>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          const isPositive = stat.change !== null && stat.change > 0
          return (
            <div key={index} className="stat-card">
              <div className="stat-card-header">
                <div className={`stat-icon stat-icon-${stat.color}`}>
                  <Icon size={24} />
                </div>
                {stat.hasChange && stat.change !== null && (
                  <div className={`stat-change ${isPositive ? 'positive' : 'negative'}`}>
                    {isPositive ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                    {Math.abs(stat.change).toFixed(1)}%
                  </div>
                )}
              </div>
              <div className="stat-card-body">
                <h3>{stat.value}</h3>
                <p>{stat.title}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Charts and Tables Row */}
      <div className="dashboard-content-grid">
        {/* Revenue Chart */}
        <div className="dashboard-card">
          <div className="card-header">
            <h2>Revenue Overview</h2>
            <select 
              className="period-select" 
              value={chartPeriod}
              onChange={(e) => setChartPeriod(e.target.value)}
            >
              <option value="7days">Last 7 days</option>
              <option value="30days">Last 30 days</option>
              <option value="3months">Last 3 months</option>
              <option value="year">Last year</option>
            </select>
          </div>
          {loading ? (
            <div className="chart-placeholder" style={{ textAlign: 'center', padding: '2rem' }}>
              Loading chart data...
            </div>
          ) : revenueChartData.length === 0 ? (
            <div className="chart-placeholder" style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
              No revenue data available for this period
            </div>
          ) : (
            <div className="chart-placeholder">
              <div className="chart-bars">
                {revenueChartData.map((item, idx) => (
                  <div 
                    key={idx} 
                    className="chart-bar" 
                    style={{ height: `${item.percentage}%` }}
                    title={`${item.day} - ₹${item.revenue.toLocaleString()}`}
                  ></div>
                ))}
              </div>
              <div className="chart-labels">
                {revenueChartData.map((item, idx) => (
                  <span key={idx} title={`${item.date} - ₹${item.revenue.toLocaleString()}`}>
                    {chartPeriod === '7days' ? item.day : item.dayNumber}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Order Status Breakdown */}
        <div className="dashboard-card">
          <div className="card-header">
            <h2>Order Status Breakdown</h2>
            <button 
              className="btn btn-outline btn-small" 
              onClick={() => navigate('/admin/orders')}
            >
              View All <ExternalLink size={14} style={{ marginLeft: '4px' }} />
            </button>
          </div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>Loading...</div>
          ) : orderStatusBreakdown.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>No orders yet</div>
          ) : (
            <div className="order-status-list">
              {orderStatusBreakdown.map((item, index) => {
                const statusColors = {
                  'Pending': '#FFA500',
                  'Processing': '#4A90E2',
                  'Shipped': '#7B68EE',
                  'Delivered': '#50C878',
                  'Cancelled': '#FF6B6B',
                  'Returned': '#FF69B4'
                }
                const color = statusColors[item.status] || '#666'
                return (
                  <div key={index} className="status-breakdown-item">
                    <div className="status-indicator" style={{ backgroundColor: color }}></div>
                    <div className="status-info">
                      <span className="status-name">{item.status}</span>
                      <span className="status-count">{item.count} orders</span>
                    </div>
                    <div className="status-percentage">{item.percentage}%</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Second Row - Top Products and Top Customers */}
      <div className="dashboard-content-grid">
        {/* Top Products */}
        <div className="dashboard-card">
          <div className="card-header">
            <h2>Top Selling Products</h2>
          </div>
          <div className="top-products-list">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>Loading...</div>
            ) : topProducts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>No sales data yet</div>
            ) : (
              topProducts.slice(0, 5).map((product, index) => (
                <div key={index} className="top-product-item">
                  <div className="product-rank">#{index + 1}</div>
                  <div className="product-info">
                    <h4>{product.name}</h4>
                    <p>{product.sales} {product.sales === 1 ? 'sale' : 'sales'}</p>
                  </div>
                  <div className="product-revenue">₹{product.revenue.toLocaleString()}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Customers */}
        <div className="dashboard-card">
          <div className="card-header">
            <h2>Top Customers</h2>
            <button 
              className="btn btn-outline btn-small" 
              onClick={() => navigate('/admin/customers')}
            >
              View All <ExternalLink size={14} style={{ marginLeft: '4px' }} />
            </button>
          </div>
          <div className="top-customers-list">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>Loading...</div>
            ) : topCustomers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>No customer data yet</div>
            ) : (
              topCustomers.map((customer, index) => (
                <div key={customer.id} className="top-customer-item">
                  <div className="customer-rank">
                    <Award size={16} style={{ color: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : '#666' }} />
                    #{index + 1}
                  </div>
                  <div className="customer-info">
                    <h4>{customer.name}</h4>
                    <p>{customer.totalOrders} {customer.totalOrders === 1 ? 'order' : 'orders'}</p>
                  </div>
                  <div className="customer-spent">₹{customer.totalSpent.toLocaleString()}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Returns & Refunds Summary */}
      <div className="dashboard-card">
        <div className="card-header">
          <h2>Returns & Refunds Summary</h2>
          <button 
            className="btn btn-outline btn-small" 
            onClick={() => navigate('/admin/returns')}
          >
            View All <ExternalLink size={14} style={{ marginLeft: '4px' }} />
          </button>
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>Loading...</div>
        ) : (
          <div className="returns-summary-grid">
            <div className="returns-stat-card">
              <div className="returns-stat-icon" style={{ backgroundColor: 'rgba(122, 80, 81, 0.1)' }}>
                <RotateCcw size={24} style={{ color: '#7A5051' }} />
              </div>
              <div className="returns-stat-info">
                <h3>{returnsSummary.totalReturns}</h3>
                <p>Total Returns</p>
              </div>
            </div>
            <div className="returns-stat-card">
              <div className="returns-stat-icon" style={{ backgroundColor: 'rgba(255, 165, 0, 0.1)' }}>
                <AlertCircle size={24} style={{ color: '#FFA500' }} />
              </div>
              <div className="returns-stat-info">
                <h3>{returnsSummary.pendingReturns}</h3>
                <p>Pending Returns</p>
              </div>
            </div>
            <div className="returns-stat-card">
              <div className="returns-stat-icon" style={{ backgroundColor: 'rgba(80, 200, 120, 0.1)' }}>
                <TrendingUp size={24} style={{ color: '#50C878' }} />
              </div>
              <div className="returns-stat-info">
                <h3>{returnsSummary.refundedReturns}</h3>
                <p>Refunded Returns</p>
              </div>
            </div>
            <div className="returns-stat-card">
              <div className="returns-stat-icon" style={{ backgroundColor: 'rgba(122, 80, 81, 0.1)' }}>
                <IndianRupee size={24} style={{ color: '#7A5051' }} />
              </div>
              <div className="returns-stat-info">
                <h3>₹{returnsSummary.totalRefundedAmount.toLocaleString()}</h3>
                <p>Total Refunded</p>
              </div>
            </div>
            <div className="returns-stat-card">
              <div className="returns-stat-icon" style={{ backgroundColor: 'rgba(255, 165, 0, 0.1)' }}>
                <IndianRupee size={24} style={{ color: '#FFA500' }} />
              </div>
              <div className="returns-stat-info">
                <h3>₹{returnsSummary.pendingRefundAmount.toLocaleString()}</h3>
                <p>Pending Refund</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Alerts - Only show if there are actual alerts */}
      {(lowStockCount > 0 || pendingQueriesCount > 0) && (
        <div className="dashboard-alerts">
          {lowStockCount > 0 && (
            <div className="alert-card warning">
              <AlertCircle size={20} />
              <div>
                <h4>Low Stock Alert</h4>
                <p>{lowStockCount} {lowStockCount === 1 ? 'product is' : 'products are'} running low on stock</p>
              </div>
              <button 
                className="btn btn-outline btn-small"
                onClick={() => navigate('/admin/inventory?status=low_stock')}
              >
                View <ExternalLink size={14} style={{ marginLeft: '4px' }} />
              </button>
            </div>
          )}
          {pendingQueriesCount > 0 && (
            <div className="alert-card info">
              <MessageSquare size={20} />
              <div>
                <h4>Pending Queries</h4>
                <p>{pendingQueriesCount} {pendingQueriesCount === 1 ? 'customer query needs' : 'customer queries need'} attention</p>
              </div>
              <button 
                className="btn btn-outline btn-small"
                onClick={() => navigate('/admin/queries?status=new')}
              >
                View <ExternalLink size={14} style={{ marginLeft: '4px' }} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default DashboardOverview

