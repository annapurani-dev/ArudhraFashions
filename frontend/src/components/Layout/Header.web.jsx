import { Link, useNavigate, useLocation } from 'react-router-dom'
import { ShoppingCart, Heart, User, Search, ChevronDown, ChevronUp, GitCompare, Coins } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useHeaderData } from '../../hooks/useHeaderData'
import { useLoginModal } from '../../context/LoginModalContext'
import { coinsAPI } from '../../utils/api'
import SearchModal from '../SearchModal/SearchModal'

function HeaderWeb() {
  const { isAuthenticated, user } = useAuth()
  const { cartCount, compareCount, wishlistCount, isSticky } = useHeaderData()
  const { openModal } = useLoginModal()
  const [expandedCategory, setExpandedCategory] = useState(null)
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false)
  const [categories, setCategories] = useState([])
  const [coinBalance, setCoinBalance] = useState(0)
  const navigate = useNavigate()
  const location = useLocation()
  const isHomePage = location.pathname === '/'

  // Load coin balance
  useEffect(() => {
    if (isAuthenticated && user) {
      loadCoinBalance()
    } else {
      setCoinBalance(0)
    }
  }, [isAuthenticated, user])

  const loadCoinBalance = async () => {
    if (!isAuthenticated) return
    try {
      const data = await coinsAPI.getBalance()
      setCoinBalance(data.balance || 0)
    } catch (err) {
      console.error('Failed to load coin balance:', err)
      // Set to 0 on error so icon still shows
      setCoinBalance(0)
    }
  }

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const base = import.meta.env.VITE_API_URL || (import.meta.env.MODE === 'production' ? 'https://api.arudhrafashions.com/api' : 'http://localhost:5001/api')
        const response = await fetch(`${base}/categories`)
        const data = await response.json()
        setCategories(data || [])
      } catch (err) {
        console.error('Failed to fetch categories:', err)
      }
    }
    fetchCategories()
  }, [])

  const toggleCategory = (categorySlug) => {
    setExpandedCategory(expandedCategory === categorySlug ? null : categorySlug)
  }

  const handleCategoryClick = (categorySlug) => {
    navigate(`/products/${categorySlug}`)
    setExpandedCategory(null)
  }

  const handleSubcategoryClick = (categorySlug, subcategorySlug) => {
    navigate(`/products/${categorySlug}/${subcategorySlug}`)
    setExpandedCategory(null)
  }

  // Close accordion when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (expandedCategory && !e.target.closest('.nav-category')) {
        setExpandedCategory(null)
      }
    }

    if (expandedCategory) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [expandedCategory])

  return (
    <>
      <div className={`header-wrapper ${!isHomePage ? 'header-footer-style' : ''}`}>
        <header className={`header header-web ${!isHomePage ? 'header-footer-style' : ''} ${isSticky ? 'sticky' : ''} ${isHomePage ? 'home-header' : ''}`}>
          <div className="container">
            <div className={`header-content ${isHomePage ? 'home-header-content' : 'other-page-header-content'}`}>
              <Link to="/" className="brand-name">
                Arudhra Fashions
              </Link>
              
              {/* Categories - Always visible on web */}
              <nav className={`main-nav ${isHomePage ? 'home-nav' : 'other-page-nav'}`}>
                {categories.map((category) => (
                  <div 
                    key={category.id} 
                    className={`nav-category ${expandedCategory === category.slug ? 'expanded' : ''}`}
                  >
                    <div className="nav-category-header">
                      <button
                        className="nav-category-btn"
                        onClick={() => toggleCategory(category.slug)}
                      >
                        {category.name}
                        {expandedCategory === category.slug ? (
                          <ChevronUp size={18} />
                        ) : (
                          <ChevronDown size={18} />
                        )}
                      </button>
                    </div>
                    
                    {expandedCategory === category.slug && (
                      <div className="nav-subcategories">
                        <button
                          className="nav-subcategory-item main-category-link"
                          onClick={() => handleCategoryClick(category.slug)}
                        >
                          View All {category.name}
                        </button>
                        {(category.subcategories || []).map((subcategory) => (
                          <button
                            key={subcategory.id}
                            className="nav-subcategory-item"
                            onClick={() => handleSubcategoryClick(category.slug, subcategory.slug)}
                          >
                            {subcategory.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </nav>

              <div className="header-actions">
                <button 
                  className="search-icon-btn" 
                  onClick={() => setIsSearchModalOpen(true)}
                  title="Search"
                >
                  <Search size={20} />
                </button>
                {(!isHomePage || isAuthenticated) && (
                  <>
                    <Link to="/wishlist" className="icon-btn" title="Wishlist">
                      <Heart size={20} />
                      {wishlistCount > 0 && <span className="badge show"></span>}
                    </Link>
                    <Link to="/cart" className="icon-btn" title="Shopping Cart">
                      <ShoppingCart size={20} />
                      {cartCount > 0 && <span className="badge show"></span>}
                    </Link>
                  </>
                )}
                
                <Link to="/compare" className="icon-btn" title="Compare Products">
                  <GitCompare size={20} />
                  {compareCount > 0 && (
                    <span className="badge show"></span>
                  )}
                </Link>
                {isAuthenticated && (
                  <Link to="/dashboard" state={{ tab: 'coins' }} className="icon-btn" title={`${coinBalance} Coins`}>
                    <Coins size={20} />
                    {coinBalance > 0 && (
                      <span className="coin-badge">{coinBalance}</span>
                    )}
                  </Link>
                )}
                {isAuthenticated ? (
                  <Link to="/dashboard" className="icon-btn" title={user?.name || 'Profile'}>
                    <User size={20} />
                  </Link>
                ) : (
                  <button
                    className="icon-btn"
                    onClick={() => openModal('login')}
                    title="Login/Register"
                  >
                    <User size={20} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </header>
      </div>
      
      {/* Search Modal */}
      <SearchModal 
        isOpen={isSearchModalOpen} 
        onClose={() => setIsSearchModalOpen(false)} 
      />
    </>
  )
}

export default HeaderWeb
