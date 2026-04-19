import { useState, useEffect, useRef, useCallback } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, Package, FolderTree, ShoppingBag, Users, FileText, 
  MessageSquare, Boxes, Settings, LogOut, Menu, X, ChevronRight,
  Tag, Mail, RotateCcw, Ticket, Image as ImageIcon, FileText as FileTextIcon,
  Home, Coins as CoinsIcon
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

function AdminDashboardMobile() {
  const { admin, logout } = useAdminAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [expandedSections, setExpandedSections] = useState({})
  const drawerRef = useRef(null)
  const startXRef = useRef(0)
  const currentXRef = useRef(0)
  const isDraggingRef = useRef(false)
  const overlayRef = useRef(null)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const profileButtonRef = useRef(null)

  const menuSections = [
    {
      id: 'core',
      label: 'Core',
      priority: 1,
      icon: LayoutDashboard,
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
      icon: Package,
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
      icon: Users,
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
      icon: Tag,
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
      icon: FileText,
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
      icon: Settings,
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

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [drawerOpen])

  // Close drawer on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && drawerOpen) {
        setDrawerOpen(false)
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [drawerOpen])

  // Swipe to close drawer
  useEffect(() => {
    const drawer = drawerRef.current
    if (!drawer) return

    const handleTouchStart = (e) => {
      if (!drawerOpen) return
      startXRef.current = e.touches[0].clientX
      isDraggingRef.current = true
      drawer.style.transition = 'none'
    }

    const handleTouchMove = (e) => {
      if (!isDraggingRef.current || !drawerOpen) return
      e.preventDefault()
      currentXRef.current = e.touches[0].clientX
      const diff = currentXRef.current - startXRef.current
      if (diff < 0) {
        drawer.style.transform = `translateX(${diff}px)`
      }
    }

    const handleTouchEnd = () => {
      if (!isDraggingRef.current) return
      isDraggingRef.current = false
      drawer.style.transition = ''
      const diff = currentXRef.current - startXRef.current
      if (diff < -100) {
        setDrawerOpen(false)
      } else {
        drawer.style.transform = ''
      }
    }

    drawer.addEventListener('touchstart', handleTouchStart, { passive: false })
    drawer.addEventListener('touchmove', handleTouchMove, { passive: false })
    drawer.addEventListener('touchend', handleTouchEnd)

    return () => {
      drawer.removeEventListener('touchstart', handleTouchStart)
      drawer.removeEventListener('touchmove', handleTouchMove)
      drawer.removeEventListener('touchend', handleTouchEnd)
    }
  }, [drawerOpen])

  const toggleSection = useCallback((id) => {
    setExpandedSections(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }, [])

  const handleLogout = useCallback(() => {
    logout()
    navigate('/')
  }, [logout, navigate])

  const toggleProfileMenu = useCallback(() => {
    setShowProfileMenu(prev => !prev)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileButtonRef.current && !profileButtonRef.current.contains(event.target)) {
        setShowProfileMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const isActive = useCallback((path, exact = false) => {
    if (exact) {
      return location.pathname === path
    }
    return location.pathname.startsWith(path)
  }, [location.pathname])

  const handleNavClick = useCallback((path) => {
    navigate(path)
    setDrawerOpen(false)
  }, [navigate])

  // Get current page title
  const getCurrentPageTitle = useCallback(() => {
    const currentPath = location.pathname
    for (const section of menuSections) {
      for (const item of section.items) {
        if (item.path === currentPath || (currentPath.startsWith(item.path) && !item.exact)) {
          return item.label
        }
        if (item.children) {
          for (const child of item.children) {
            if (child.path === currentPath) {
              return child.label
            }
          }
        }
      }
    }
    return 'Dashboard'
  }, [location.pathname])

  // Bottom nav items (most frequently used)
  const bottomNavItems = [
    { id: 'overview', label: 'Home', icon: LayoutDashboard, path: '/admin/dashboard' },
    { id: 'orders', label: 'Orders', icon: ShoppingBag, path: '/admin/orders' },
    { id: 'products', label: 'Products', icon: Package, path: '/admin/products' },
    { id: 'menu', label: 'More', icon: Menu, path: null, isMenu: true }
  ]

  const filteredSections = menuSections

  const handleOverlayClick = useCallback(() => {
    setDrawerOpen(false)
  }, [])

  const handleDrawerToggle = useCallback(() => {
    setDrawerOpen(prev => !prev)
  }, [])

  if (!admin) {
    return <Navigate to="/admin/login" replace />
  }

  return (
    <div className="admin-mobile-dashboard">
      {/* Top Header */}
      <header className="admin-mobile-header">
        <button 
          className="admin-mobile-header-btn"
          onClick={handleDrawerToggle}
          aria-label="Open menu"
          aria-expanded={drawerOpen}
        >
          <Menu size={22} />
        </button>
        
        <div className="admin-mobile-header-content">
          <div className="admin-mobile-header-title-wrapper">
            <h1 className="admin-mobile-header-title">{getCurrentPageTitle()}</h1>
            <p className="admin-mobile-header-subtitle">Admin Panel</p>
          </div>
        </div>

        <div className="admin-mobile-header-actions">
          <button 
            className="admin-mobile-header-btn"
            onClick={() => navigate('/')}
            aria-label="Go to home"
          >
            <Home size={20} />
          </button>
          <div className="admin-mobile-profile" ref={profileButtonRef}>
            <button
              className="admin-mobile-user-pill"
              type="button"
              onClick={toggleProfileMenu}
              aria-haspopup="true"
              aria-expanded={showProfileMenu}
            >
              <span className="admin-mobile-user-initial">
                {admin.name?.charAt(0).toUpperCase() || 'A'}
              </span>
              <div className="admin-mobile-user-details">
                <span className="admin-mobile-user-name">{admin.name || 'Admin'}</span>
                <span className="admin-mobile-user-role">{admin.role || 'Administrator'}</span>
              </div>
            </button>
            {showProfileMenu && (
              <div className="admin-mobile-profile-menu">
                <button
                  type="button"
                  className="admin-mobile-profile-menu-item"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Drawer Overlay */}
      {drawerOpen && (
        <div 
          ref={overlayRef}
          className="admin-mobile-drawer-overlay"
          onClick={handleOverlayClick}
          aria-hidden="true"
        />
      )}

      {/* Side Drawer */}
      <aside 
        ref={drawerRef}
        className={`admin-mobile-drawer ${drawerOpen ? 'open' : ''}`}
        aria-label="Navigation menu"
        aria-hidden={!drawerOpen}
      >
        {/* Drawer Header */}
        <div className="admin-mobile-drawer-header">
          <div className="admin-mobile-drawer-brand">
            <div className="admin-mobile-drawer-logo-wrapper">
              <img src="/Logo.png?v=3" alt="Arudhra Fashions Logo" className="admin-mobile-drawer-logo" />
            </div>
            <div className="admin-mobile-drawer-brand-info">
              <h2>Arudhra Fashions</h2>
              <span>Admin Dashboard</span>
            </div>
          </div>
          <button 
            className="admin-mobile-drawer-close-btn"
            onClick={handleDrawerToggle}
            aria-label="Close menu"
          >
            <X size={22} />
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="admin-mobile-drawer-nav" aria-label="Main navigation">
          <div className="admin-mobile-drawer-nav-content">
            {filteredSections.length > 0 ? (
              filteredSections.map(section => {
                const SectionIcon = section.icon
                return (
                  <div key={section.id} className="admin-mobile-nav-section">
                    <div className="admin-mobile-nav-section-header">
                      <SectionIcon size={16} aria-hidden="true" />
                      <span className="admin-mobile-nav-section-label">{section.label}</span>
                    </div>
                    <div className="admin-mobile-nav-section-items">
                      {section.items.map(item => {
                        const Icon = item.icon
                        const hasChildren = item.children && item.children.length > 0
                        const isExpanded = expandedSections[item.id]
                        const active = isActive(item.path, item.exact)

                        return (
                          <div key={item.id} className="admin-mobile-nav-item-group">
                            <button
                              className={`admin-mobile-nav-item ${active ? 'active' : ''}`}
                              onClick={() => {
                                if (hasChildren) {
                                  toggleSection(item.id)
                                } else {
                                  handleNavClick(item.path)
                                }
                              }}
                              aria-expanded={hasChildren ? isExpanded : undefined}
                              aria-current={active ? 'page' : undefined}
                            >
                              <div className="admin-mobile-nav-item-content">
                                <Icon size={20} className="admin-mobile-nav-item-icon" aria-hidden="true" />
                                <span className="admin-mobile-nav-item-label">{item.label}</span>
                              </div>
                              {hasChildren && (
                                <ChevronRight 
                                  size={18} 
                                  className={`admin-mobile-nav-item-chevron ${isExpanded ? 'expanded' : ''}`}
                                  aria-hidden="true"
                                />
                              )}
                            </button>
                            {hasChildren && isExpanded && (
                              <div className="admin-mobile-nav-submenu" role="group">
                                {item.children.map((child, idx) => (
                                  <button
                                    key={idx}
                                    className={`admin-mobile-nav-submenu-item ${isActive(child.path) ? 'active' : ''}`}
                                    onClick={() => handleNavClick(child.path)}
                                    aria-current={isActive(child.path) ? 'page' : undefined}
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
                  </div>
                )
              })
            ) : (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <p>No menu items found</p>
              </div>
            )}
          </div>
        </nav>

      </aside>

      {/* Main Content */}
      <main className="admin-mobile-main">
        <div className="admin-mobile-main-content">
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

      {/* Bottom Navigation */}
      <nav className="admin-mobile-bottom-nav" aria-label="Quick navigation">
        {bottomNavItems.map(item => {
          const isActiveNav = item.isMenu 
            ? drawerOpen 
            : isActive(item.path, item.id === 'overview')
          
          return (
            <button
              key={item.id}
              className={`admin-mobile-bottom-nav-item ${isActiveNav ? 'active' : ''}`}
              onClick={() => {
                if (item.isMenu) {
                  handleDrawerToggle()
                } else {
                  handleNavClick(item.path)
                }
              }}
              aria-label={item.label}
              aria-current={isActiveNav && !item.isMenu ? 'page' : undefined}
            >
              <div className="admin-mobile-bottom-nav-item-icon-wrapper">
                <item.icon size={22} aria-hidden="true" />
              </div>
              <span className="admin-mobile-bottom-nav-item-label">{item.label}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}

export default AdminDashboardMobile
