import { useState, useRef, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, Package, FolderTree, ShoppingBag, Users, FileText, 
  MessageSquare, Boxes, Settings, LogOut, Menu, X, ChevronDown, ChevronRight,
  Tag, Mail, RotateCcw, Ticket, Image as ImageIcon, FileText as FileTextIcon,
  Coins as CoinsIcon
} from 'lucide-react'
import { useAdminAuth } from '../../context/AdminAuthContext'
import DashboardOverview from './DashboardOverview'
import Products from './Products'
import Categories from './Categories'
import Orders from './Orders'
import Customers from './Customers'
import Content from './Content'
import Queries from './Queries'
import Inventory from './Inventory'
import AdminSettings from './AdminSettings'
import Discounts from './Discounts'
import Newsletter from './Newsletter'
import Returns from './Returns'
import Coupons from './Coupons'
import Banners from './Banners'
import EmailTemplates from './EmailTemplates'
import Coins from './Coins'

function AdminDashboardWeb() {
  const { admin, logout } = useAdminAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [expandedSections, setExpandedSections] = useState({})
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const profileRef = useRef(null)

  const menuSections = [
    {
      id: 'core',
      label: 'Core',
      priority: 1,
      items: [
        {
          id: 'overview',
          label: 'Dashboard',
          icon: LayoutDashboard,
          path: '/admin/dashboard',
          exact: true,
          badge: null
        },
        {
          id: 'orders',
          label: 'Orders',
          icon: ShoppingBag,
          path: '/admin/orders',
          badge: null
        }
      ]
    },
    {
      id: 'catalog',
      label: 'Catalog Management',
      priority: 2,
      items: [
        {
          id: 'products',
          label: 'Products',
          icon: Package,
          path: '/admin/products',
          children: [
            { label: 'All Products', path: '/admin/products' },
            { label: 'Add Product', path: '/admin/products/add' }
          ]
        },
        {
          id: 'categories',
          label: 'Categories',
          icon: FolderTree,
          path: '/admin/categories'
        },
        {
          id: 'inventory',
          label: 'Inventory',
          icon: Boxes,
          path: '/admin/inventory'
        }
      ]
    },
    {
      id: 'customers',
      label: 'Customer Management',
      priority: 3,
      items: [
        {
          id: 'customers',
          label: 'Customers',
          icon: Users,
          path: '/admin/customers'
        },
        {
          id: 'queries',
          label: 'Customer Queries',
          icon: MessageSquare,
          path: '/admin/queries'
        },
        {
          id: 'returns',
          label: 'Returns & Refunds',
          icon: RotateCcw,
          path: '/admin/returns'
        }
      ]
    },
    {
      id: 'marketing',
      label: 'Marketing & Promotions',
      priority: 4,
      items: [
        {
          id: 'discounts',
          label: 'Discounts & Promotions',
          icon: Tag,
          path: '/admin/discounts'
        },
        {
          id: 'coupons',
          label: 'Coupon Codes',
          icon: Ticket,
          path: '/admin/coupons'
        },
        {
          id: 'coins',
          label: 'Coins & Rewards',
          icon: CoinsIcon,
          path: '/admin/coins'
        },
        {
          id: 'banners',
          label: 'Banners & Sliders',
          icon: ImageIcon,
          path: '/admin/banners'
        },
        {
          id: 'newsletter',
          label: 'Newsletter',
          icon: Mail,
          path: '/admin/newsletter'
        }
      ]
    },
    {
      id: 'content',
      label: 'Content & Communication',
      priority: 5,
      items: [
        {
          id: 'content',
          label: 'Home Page Content',
          icon: FileText,
          path: '/admin/content'
        },
        {
          id: 'email-templates',
          label: 'Email Templates',
          icon: FileTextIcon,
          path: '/admin/email-templates'
        }
      ]
    },
    {
      id: 'system',
      label: 'System Settings',
      priority: 6,
      items: [
        {
          id: 'settings',
          label: 'Settings',
          icon: Settings,
          path: '/admin/settings'
        }
      ]
    }
  ]

  const toggleSection = (id) => {
    setExpandedSections(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const toggleProfileMenu = () => {
    setShowProfileMenu(prev => !prev)
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const isActive = (path, exact = false) => {
    if (exact) {
      return location.pathname === path
    }
    return location.pathname.startsWith(path)
  }

  if (!admin) {
    return <Navigate to="/admin/login" replace />
  }

  return (
    <div className="admin-dashboard">
      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : 'closed'} ${isTransitioning ? 'transitioning' : ''}`}>
        <div className="admin-sidebar-header">
          <div className="admin-logo">
            <img src="/Logo.png?v=3" alt="Arudhra Fashions Logo" className="admin-logo-img" />
            <div>
              <h2>Arudhra Fashions</h2>
              <span>Admin Panel</span>
            </div>
          </div>
          {sidebarOpen && (
            <button 
              className="sidebar-toggle"
              onClick={() => {
                setIsTransitioning(true)
                setSidebarOpen(false)
                setTimeout(() => setIsTransitioning(false), 400)
              }}
              aria-label="Collapse sidebar"
              title="Collapse sidebar"
            >
              <X size={18} />
            </button>
          )}
          {!sidebarOpen && (
            <button 
              className="sidebar-toggle"
              onClick={() => {
                setIsTransitioning(true)
                setSidebarOpen(true)
                setTimeout(() => setIsTransitioning(false), 400)
              }}
              aria-label="Expand sidebar"
              title="Expand sidebar"
            >
              <Menu size={20} />
            </button>
          )}
        </div>

        <nav className="admin-nav">
          {menuSections.map(section => (
            <div key={section.id} className="nav-section">
              {sidebarOpen && (
                <div className="nav-section-label">
                  {section.label}
                </div>
              )}
              {section.items.map(item => {
                const Icon = item.icon
                const hasChildren = item.children && item.children.length > 0
                const isExpanded = expandedSections[item.id]
                const active = isActive(item.path, item.exact)

                return (
                  <div key={item.id} className="nav-item-wrapper">
                    <button
                      className={`nav-item ${active ? 'active' : ''}`}
                      onClick={() => {
                        if (hasChildren) {
                          toggleSection(item.id)
                        } else {
                          navigate(item.path)
                        }
                      }}
                    >
                      <Icon size={20} />
                      {sidebarOpen && <span>{item.label}</span>}
                      {sidebarOpen && hasChildren && (
                        isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />
                      )}
                    </button>
                    {sidebarOpen && hasChildren && isExpanded && (
                      <div className="nav-submenu">
                        {item.children.map((child, idx) => (
                          <button
                            key={idx}
                            className={`nav-submenu-item ${isActive(child.path) ? 'active' : ''}`}
                            onClick={() => navigate(child.path)}
                          >
                            {child.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </nav>

      </aside>

      {/* Main Content */}
      <main className="admin-main-content">
        <header className="admin-main-header">
          <div className="admin-main-header-actions">
            <div className="admin-main-user-header" ref={profileRef}>
              <button
                type="button"
                className="admin-main-profile-btn"
                onClick={toggleProfileMenu}
                aria-haspopup="true"
                aria-expanded={showProfileMenu}
              >
                <div className="admin-main-user-badge">
                  <div className="admin-user-initial">
                    {admin.name?.charAt(0).toUpperCase() || 'A'}
                  </div>
                  <div className="admin-main-user-details">
                    <p className="admin-main-user-name">{admin.name || 'Admin'}</p>
                    <p className="admin-main-user-role">{admin.role || 'Administrator'}</p>
                  </div>
                </div>
                <LogOut size={16} />
              </button>
              {showProfileMenu && (
                <div className="admin-profile-menu">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="admin-profile-menu-item"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        <div className="admin-content-wrapper">
          <Routes>
            <Route index element={<DashboardOverview />} />
            <Route path="dashboard" element={<DashboardOverview />} />
            <Route path="products/*" element={<Products />} />
            <Route path="categories" element={<Categories />} />
            <Route path="orders" element={<Orders />} />
            <Route path="customers" element={<Customers />} />
            <Route path="content" element={<Content />} />
            <Route path="queries" element={<Queries />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="discounts" element={<Discounts />} />
            <Route path="coupons" element={<Coupons />} />
            <Route path="coins" element={<Coins />} />
            <Route path="banners" element={<Banners />} />
            <Route path="newsletter" element={<Newsletter />} />
            <Route path="returns" element={<Returns />} />
            <Route path="email-templates" element={<EmailTemplates />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="*" element={<Navigate to="dashboard" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}

export default AdminDashboardWeb
