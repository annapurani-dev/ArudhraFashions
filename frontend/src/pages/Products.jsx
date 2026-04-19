import { useParams, Link, useSearchParams } from 'react-router-dom'
import { useState, useMemo, useEffect } from 'react'
import ProductCard from '../components/ProductCard/ProductCard'
import Loading from '../components/Loading/Loading'
import { ProductsSkeleton } from '../components/Skeletons/PageSkeletons'
import { Filter, X, ArrowRight, ChevronRight, Home, Grid, List, SlidersHorizontal } from 'lucide-react'
import { productsAPI } from '../utils/api'
import { fetchWithCache } from '../utils/simpleCache'

function Products() {
  const { category, subcategory } = useParams()
  const [searchParams] = useSearchParams()
  const searchQuery = searchParams.get('search') || ''
  const [showFilters, setShowFilters] = useState(false)
  const [allProducts, setAllProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sortBy, setSortBy] = useState('newest')
  const [filters, setFilters] = useState({
    priceRange: [0, 50000],
    sizes: [],
    material: [],
    specifications: {} // Dynamic filters per category
  })

  // Fetch categories for subcategory mapping
  const [categories, setCategories] = useState([])
  
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
  
  // Build category subcategories mapping from API
  const categorySubcategories = categories.reduce((acc, cat) => {
    if (cat.subcategories) {
      acc[cat.name] = cat.subcategories.map(sub => sub.name)
    }
    return acc
  }, {})

  // Fetch products from API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        setError(null)
        const apiFilters = {}
        
        // On base /products page, fetch all products to get sample images for subcategories
        if (!category && !subcategory && !searchQuery) {
          // Fetch all active products to get sample images for subcategory cards
          apiFilters.limit = 200 // Get more products to find samples
        } else {
          if (category) {
            const catName = category.charAt(0).toUpperCase() + category.slice(1).toLowerCase()
            apiFilters.category = catName
          }
          
          if (subcategory) {
            const subcatName = subcategory.charAt(0).toUpperCase() + subcategory.slice(1).toLowerCase()
            apiFilters.subcategory = subcatName
          }
          
          // Apply selected filters (price, sizes, material) - only when not on base page
          if (filters.sizes.length > 0) {
            apiFilters.sizes = filters.sizes
          }
          if (filters.material && filters.material.length > 0) {
            apiFilters.material = filters.material
          }
          if (filters.priceRange[1] < 50000) {
            apiFilters.maxPrice = filters.priceRange[1]
          }
          if (filters.priceRange[0] > 0) {
            apiFilters.minPrice = filters.priceRange[0]
          }
        }
        
        // Add search query if present
        if (searchQuery) {
          apiFilters.search = searchQuery
        }
        
        console.log('Fetching products with filters:', apiFilters)
        // Use in-memory cache to avoid refetching when navigating back
        const cacheKey = `products:${JSON.stringify(apiFilters)}`
        const response = await fetchWithCache(cacheKey, () => productsAPI.getAll(apiFilters))
        console.log('Products API response:', {
          total: response.total,
          productsCount: response.products?.length || 0,
          products: response.products?.map(p => ({
            id: p.id || p._id,
            name: p.name,
            price: p.price,
            originalPrice: p.originalPrice,
            isActive: p.isActive,
            category: p.category?.name,
            subcategory: p.subcategory?.name
          })) || []
        })
        // Log first product's full data to check price field
        if (response.products && response.products.length > 0) {
          console.log('First product full data:', response.products[0])
          console.log('First product price:', response.products[0].price, 'type:', typeof response.products[0].price)
        }
        if (!response.products || response.products.length === 0) {
          console.warn('No products returned from API. Response:', response)
        }
        setAllProducts(response.products || [])
      } catch (err) {
        console.error('Failed to fetch products:', err)
        setError('Failed to load products. Please try again later.')
      } finally {
        setLoading(false)
      }
    }
    
    fetchProducts()
  }, [category, subcategory, filters.sizes, filters.material, filters.priceRange[0], filters.priceRange[1], searchQuery])
  
  // Get image URL helper
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null
    if (imagePath.startsWith('http')) return imagePath
    const base = import.meta.env.VITE_API_URL || (import.meta.env.MODE === 'production' ? 'https://api.arudhrafashions.com/api' : 'http://localhost:5001/api')
    return `${base.replace('/api', '')}${imagePath.startsWith('/') ? imagePath : '/' + imagePath}`
  }

  // Calculate relevance score for search results
  const calculateRelevanceScore = (product, query) => {
    if (!query) return 0
    
    const queryLower = query.toLowerCase()
    const name = (product.name || '').toLowerCase()
    const description = (product.description || '').toLowerCase()
    const category = (product.category?.name || '').toLowerCase()
    const subcategory = (product.subcategory?.name || '').toLowerCase()
    
    let score = 0
    
    // Exact name match gets highest score
    if (name === queryLower) score += 100
    // Name starts with query
    else if (name.startsWith(queryLower)) score += 50
    // Name contains query
    else if (name.includes(queryLower)) score += 30
    
    // Category/subcategory match
    if (category.includes(queryLower)) score += 20
    if (subcategory.includes(queryLower)) score += 20
    
    // Description contains query
    if (description.includes(queryLower)) score += 10
    
    // Word-by-word matching for better relevance
    const queryWords = queryLower.split(/\s+/).filter(w => w.length > 0)
    queryWords.forEach(word => {
      if (name.includes(word)) score += 5
      if (description.includes(word)) score += 2
    })
    
    return score
  }

  // Filter products based on category and subcategory (client-side filtering for additional filters)
  const filteredProducts = useMemo(() => {
    let filtered = allProducts

    // Apply client-side material filtering as a fallback (API should handle it)
    if (filters.material && filters.material.length > 0) {
      filtered = filtered.filter(p =>
        filters.material.some(m => p.material?.toLowerCase().includes(m.toLowerCase()))
      )
    }

    // Apply client-side dynamic specifications filtering
    Object.keys(filters.specifications).forEach(specName => {
      const selectedOptions = filters.specifications[specName]
      if (selectedOptions && selectedOptions.length > 0) {
        filtered = filtered.filter(p => {
          const productValue = p.specifications?.[specName]
          return selectedOptions.includes(productValue)
        })
      }
    })

    // Apply sorting
    const sorted = [...filtered]
    
    // If there's a search query, sort by relevance first, then by selected sort option
    if (searchQuery && searchQuery.trim()) {
      // Sort by relevance score (highest first)
      sorted.sort((a, b) => {
        const scoreA = calculateRelevanceScore(a, searchQuery)
        const scoreB = calculateRelevanceScore(b, searchQuery)
        
        // If relevance scores are different, use relevance
        if (scoreB !== scoreA) {
          return scoreB - scoreA
        }
        
        // If same relevance, apply secondary sort
        switch (sortBy) {
          case 'price-low':
            return (a.price || 0) - (b.price || 0)
          case 'price-high':
            return (b.price || 0) - (a.price || 0)
          case 'name':
            return (a.name || '').localeCompare(b.name || '')
          case 'newest':
          default:
            return new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
        }
      })
    } else {
      // No search query, use normal sorting
      switch (sortBy) {
        case 'price-low':
          sorted.sort((a, b) => (a.price || 0) - (b.price || 0))
          break
        case 'price-high':
          sorted.sort((a, b) => (b.price || 0) - (a.price || 0))
          break
        case 'name':
          sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
          break
        case 'newest':
        default:
          sorted.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
          break
      }
    }

    return sorted
  }, [allProducts, filters.style, filters.material, filters.brand, sortBy, searchQuery])

  // Group products by subcategory for "View All" pages
  const groupedProducts = useMemo(() => {
    if (category && !subcategory) {
      const grouped = {}
      filteredProducts.forEach(product => {
        const subcatName = product.subcategory?.name || product.subcategory
        if (!grouped[subcatName]) {
          grouped[subcatName] = []
        }
        grouped[subcatName].push(product)
      })
      return grouped
    }
    return {}
  }, [category, subcategory, filteredProducts])

  const isViewAllPage = category && !subcategory
  const isBaseProductsPage = !category && !subcategory && !searchQuery
  const pageTitle = searchQuery
    ? `Search Results for "${searchQuery}"`
    : subcategory 
    ? `${allProducts[0]?.subcategory?.name || subcategory}` 
    : category 
    ? `${categories.find(c => c.slug === category.toLowerCase())?.name || category.charAt(0).toUpperCase() + category.slice(1)}` 
    : 'Shop by Category'
  
  // Show relevance message for search results
  const searchResultsMessage = searchQuery && filteredProducts.length > 0
    ? `Showing ${filteredProducts.length} most relevant result${filteredProducts.length === 1 ? '' : 's'}`
    : null
  
  // Build breadcrumbs
  const breadcrumbs = useMemo(() => {
    const crumbs = [
      { label: 'Home', path: '/' }
    ]
    if (category) {
      crumbs.push({ 
        label: categories.find(c => c.slug === category.toLowerCase())?.name || category, 
        path: `/products/${category}` 
      })
    }
    if (subcategory) {
      crumbs.push({ 
        label: allProducts[0]?.subcategory?.name || subcategory, 
        path: null 
      })
    }
    if (searchQuery) {
      crumbs.push({ label: `Search: "${searchQuery}"`, path: null })
    }
    return crumbs
  }, [category, subcategory, searchQuery, categories, allProducts])

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: prev[filterType].includes(value)
        ? prev[filterType].filter(v => v !== value)
        : [...prev[filterType], value]
    }))
  }
  
  const handleSpecFilterChange = (specName, value) => {
    setFilters(prev => {
      const currentSpecs = prev.specifications[specName] || []
      const newSpecs = currentSpecs.includes(value)
        ? currentSpecs.filter(v => v !== value)
        : [...currentSpecs, value]
        
      return {
        ...prev,
        specifications: {
          ...prev.specifications,
          [specName]: newSpecs
        }
      }
    })
  }

  // Helpers for dual-thumb price slider
  const PRICE_MIN = 0
  const PRICE_MAX = 50000
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
  const percent = (v) => ((v - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100

  const handleMinRangeChange = (val) => {
    const min = clamp(Number(val) || 0, PRICE_MIN, PRICE_MAX)
    setFilters(prev => ({ ...prev, priceRange: [Math.min(min, prev.priceRange[1]), prev.priceRange[1]] }))
  }
  const handleMaxRangeChange = (val) => {
    const max = clamp(Number(val) || 0, PRICE_MIN, PRICE_MAX)
    setFilters(prev => ({ ...prev, priceRange: [prev.priceRange[0], Math.max(prev.priceRange[0], max)] }))
  }
  // Format price for display (INR with commas)
  const fmtPrice = (v) => {
    try {
      return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v)
    } catch (e) {
      return `₹${v}`
    }
  }

  // Listen for global clear event from header
  useEffect(() => {
    const onClear = () => {
      setFilters({
        priceRange: [PRICE_MIN, PRICE_MAX],
        sizes: [],
        material: [],
        specifications: {}
      })
      // close sidebar if open
      setShowFilters(false)
    }
    window.addEventListener('clearFilters', onClear)
    return () => window.removeEventListener('clearFilters', onClear)
  }, [])

  const clearAllFilters = () => {
    setFilters({
      priceRange: [PRICE_MIN, PRICE_MAX],
      sizes: [],
      material: [],
      specifications: {}
    })
    setShowFilters(false)
  }

  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (filters.priceRange[0] > PRICE_MIN || filters.priceRange[1] < PRICE_MAX) count++
    if (filters.sizes.length > 0) count += filters.sizes.length
    if (filters.material.length > 0) count += filters.material.length
    Object.values(filters.specifications).forEach(arr => {
      count += arr.length
    })
    return count
  }, [filters])

  return (
    <div className="products-page">
      <div className="container">
        {/* Breadcrumbs - Hide on base products page */}
        {!isBaseProductsPage && (
          <nav className="products-breadcrumbs">
            {breadcrumbs.map((crumb, index) => (
              <span key={index} className="breadcrumb-item">
                {crumb.path ? (
                  <Link to={crumb.path} className="breadcrumb-link">
                    {index === 0 ? <Home size={14} /> : crumb.label}
                  </Link>
                ) : (
                  <span className="breadcrumb-current">{crumb.label}</span>
                )}
                {index < breadcrumbs.length - 1 && <ChevronRight size={14} className="breadcrumb-separator" />}
              </span>
            ))}
          </nav>
        )}

        {/* Header Section - Hide on base products page */}
        {!isBaseProductsPage && (
          <div className="products-header-new">
            <div className="products-header-content">
              <div className="products-title-section">
                <h1 className="products-title">{pageTitle}</h1>
                {!loading && (
                  <div>
                    {searchResultsMessage ? (
                      <p className="products-count products-count-relevant">{searchResultsMessage}</p>
                    ) : (
                      <p className="products-count">
                        {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'} found
                      </p>
                    )}
                  </div>
                )}
              </div>
              {!isViewAllPage && (
              <div className="products-controls-new">
                <div className="sort-controls">
                  <label htmlFor="sort-select" className="sort-label">
                    Sort by:
                  </label>
                  <select 
                    id="sort-select"
                    className="sort-select"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="newest">Newest First</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="name">Name: A to Z</option>
                  </select>
                </div>
                <button 
                  className="filter-btn-new"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <SlidersHorizontal size={18} />
                  <span>Filters</span>
                  {activeFiltersCount > 0 && (
                    <span className="filter-badge">{activeFiltersCount}</span>
                  )}
                </button>
              </div>
              )}
            </div>
          </div>
        )}

        {/* Filter Overlay */}
        {showFilters && !isViewAllPage && !(!category && !subcategory && !searchQuery) && (
          <div className="filter-overlay" onClick={() => setShowFilters(false)} aria-hidden="true"></div>
        )}

        {/* Filter Sidebar */}
        {showFilters && !isViewAllPage && !(!category && !subcategory && !searchQuery) && (
          <aside className={`filters-sidebar-new ${showFilters ? 'open' : ''}`} aria-label="Filters sidebar">
            <div className="filters-header-new">
              <div className="filters-header-content">
                <h3 className="filters-title">
                  <SlidersHorizontal size={20} />
                  Filters
                </h3>
                {activeFiltersCount > 0 && (
                  <button
                    className="clear-filters-btn"
                    onClick={clearAllFilters}
                    title="Clear all filters"
                  >
                    Clear All
                  </button>
                )}
              </div>
              <button 
                className="close-filters-new"
                onClick={() => setShowFilters(false)}
                aria-label="Close filters"
              >
                <X size={20} />
              </button>
            </div>

            <div className="filters-content-new">
              <div className="filter-section">
                <h4>Price Range</h4>
                <div className="price-slider">
                  <div style={{ position: 'relative', height: 48, marginBottom: 8 }}>
                    {/* background track */}
                    <div style={{ position: 'absolute', left: 0, right: 0, top: 22, height: 6, background: '#e6e6e6', borderRadius: 6 }} />
                    {/* selected range progress */}
                    <div
                      style={{
                        position: 'absolute',
                        top: 22,
                        height: 6,
                        borderRadius: 6,
                        background: '#ff6b6b',
                        left: `${percent(filters.priceRange[0])}%`,
                        width: `${percent(filters.priceRange[1]) - percent(filters.priceRange[0])}%`
                      }}
                    />
                    {/* two range thumbs */}
                    <input
                      type="range"
                      min={PRICE_MIN}
                      max={PRICE_MAX}
                      step="50"
                      value={filters.priceRange[0]}
                      onChange={(e) => handleMinRangeChange(e.target.value)}
                      style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 48, background: 'transparent', pointerEvents: 'none' }}
                    />
                    <input
                      type="range"
                      min={PRICE_MIN}
                      max={PRICE_MAX}
                      step="50"
                      value={filters.priceRange[1]}
                      onChange={(e) => handleMaxRangeChange(e.target.value)}
                      style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 48, background: 'transparent', pointerEvents: 'none' }}
                    />
                    {/* visible thumbs (separate inputs for accessibility) */}
                    <input
                      aria-label="Minimum price"
                      type="range"
                      min={PRICE_MIN}
                      max={PRICE_MAX}
                      step="50"
                      value={filters.priceRange[0]}
                      onChange={(e) => handleMinRangeChange(e.target.value)}
                      style={{ position: 'absolute', left: 0, right: 0, top: 8, height: 32, background: 'transparent' }}
                    />
                    <input
                      aria-label="Maximum price"
                      type="range"
                      min={PRICE_MIN}
                      max={PRICE_MAX}
                      step="50"
                      value={filters.priceRange[1]}
                      onChange={(e) => handleMaxRangeChange(e.target.value)}
                      style={{ position: 'absolute', left: 0, right: 0, top: 8, height: 32, background: 'transparent' }}
                    />
                  </div>

                  {/* Price badges that sit above the thumbs (persistent, dynamic) */}
                  <div style={{ position: 'relative', height: 36 }}>
                    {(() => {
                      const pMin = percent(filters.priceRange[0])
                      const pMax = percent(filters.priceRange[1])
                      const gap = pMax - pMin
                      const MIN_GAP_TO_NOT_STACK = 8 // percent
                      const clampPercent = (p) => Math.min(96, Math.max(4, p))

                      if (gap < MIN_GAP_TO_NOT_STACK) {
                        // When thumbs are close, stack vertically to avoid overlap
                        return (
                          <>
                            <div
                              aria-hidden
                              style={{
                                position: 'absolute',
                                top: -40,
                                left: `${clampPercent((pMin + pMax) / 2)}%`,
                                transform: 'translateX(-50%)',
                                background: '#fff',
                                padding: '6px 10px',
                                borderRadius: 8,
                                boxShadow: '0 6px 18px rgba(0,0,0,0.12)',
                                fontSize: 12,
                                color: '#222',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {fmtPrice(filters.priceRange[0])} — {fmtPrice(filters.priceRange[1])}
                            </div>
                          </>
                        )
                      }

                      return (
                        <>
                          <div
                            aria-hidden
                            style={{
                              position: 'absolute',
                              top: -26,
                              left: `${clampPercent(pMin)}%`,
                              transform: 'translateX(-50%)',
                              background: '#fff',
                              padding: '6px 8px',
                              borderRadius: 6,
                              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                              fontSize: 12,
                              color: '#222',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {fmtPrice(filters.priceRange[0])}
                          </div>
                          <div
                            aria-hidden
                            style={{
                              position: 'absolute',
                              top: -26,
                              left: `${clampPercent(pMax)}%`,
                              transform: 'translateX(-50%)',
                              background: '#fff',
                              padding: '6px 8px',
                              borderRadius: 6,
                              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                              fontSize: 12,
                              color: '#222',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {fmtPrice(filters.priceRange[1])}
                          </div>
                        </>
                      )
                    })()}
                  </div>
                </div>
              </div>

              <div className="filter-section">
                <h4>Size</h4>
                <div className="size-filters">
                  {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map(size => (
                    <label key={size} className="size-option">
                      <input 
                        type="checkbox" 
                        checked={filters.sizes.includes(size)}
                        onChange={() => handleFilterChange('sizes', size)}
                      />
                      <span>{size}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="filter-section">
                <h4>Material</h4>
                <div className="material-filters">
                  {['Cotton', 'Polyester', 'Silk', 'Denim', 'Linen', 'Wool'].map(material => (
                    <label key={material} className="material-option">
                      <input 
                        type="checkbox" 
                        checked={filters.material.includes(material)}
                        onChange={() => handleFilterChange('material', material)}
                      />
                      <span>{material}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Dynamic Category Filters */}
              {(() => {
                const currentCat = categories.find(c => c.slug === category?.toLowerCase())
                if (!currentCat || !Array.isArray(currentCat.customFilters)) return null
                
                return currentCat.customFilters.map((filter, idx) => (
                  <div key={idx} className="filter-section">
                    <h4>{filter.name}</h4>
                    <div className="dynamic-filters" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {(Array.isArray(filter.options) ? filter.options : (typeof filter.options === 'string' ? filter.options.split(',').map(s => s.trim()) : [])).map((option, i) => (
                        <label key={i} className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                          <input 
                            type="checkbox" 
                            checked={(filters.specifications[filter.name] || []).includes(option)}
                            onChange={() => handleSpecFilterChange(filter.name, option)}
                            style={{ width: '18px', height: '18px' }}
                          />
                          <span style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>{option}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))
              })()}
            </div>
          </aside>
        )}

        {/* Products Display */}
        <div className="products-content">
          {loading ? (
            <ProductsSkeleton />
          ) : error ? (
            <div className="error-message">
              <p>{error}</p>
            </div>
          ) : !category && !subcategory && !searchQuery ? (
            // Base /products page - Show categories with subcategory cards
            <div className="categories-overview">
              {categories.filter(cat => cat.isActive && cat.subcategories && cat.subcategories.length > 0).map(category => (
                <div key={category.id} className="category-section-overview">
                  <div className="category-header-overview">
                    <h2 className="category-title-overview">{category.name}</h2>
                    <Link 
                      to={`/products/${category.slug}`}
                      className="view-all-category-btn"
                    >
                      View All
                      <ArrowRight size={18} />
                    </Link>
                  </div>
                  <div className="subcategories-grid-overview">
                    {category.subcategories
                      .filter(sub => sub.isActive)
                      .map(subcategory => {
                        // Get first product image from this subcategory as sample
                        const sampleProduct = allProducts.find(p => 
                          p.subcategory?.id === subcategory.id || 
                          p.subcategory?.name === subcategory.name
                        )
                        const sampleImage = subcategory.image || sampleProduct?.images?.[0] || sampleProduct?.image || null
                        const imageUrl = sampleImage ? getImageUrl(sampleImage) : null
                        
                        return (
                          <Link
                            key={subcategory.id}
                            to={`/products/${category.slug}/${subcategory.slug}`}
                            className="subcategory-card-overview"
                          >
                            <div className="subcategory-card-image-wrapper">
                              {imageUrl ? (
                                <img 
                                  src={imageUrl}
                                  alt={subcategory.name}
                                  className="subcategory-card-image"
                                  loading="lazy"
                                  onError={(e) => {
                                    e.target.style.display = 'none'
                                    e.target.nextSibling.style.display = 'flex'
                                  }}
                                />
                              ) : null}
                              <div className="subcategory-card-placeholder" style={{ display: imageUrl ? 'none' : 'flex' }}>
                                <span>{subcategory.name.charAt(0).toUpperCase()}</span>
                              </div>
                            </div>
                            <div className="subcategory-card-content">
                              <h3 className="subcategory-card-title">{subcategory.name}</h3>
                            </div>
                          </Link>
                        )
                      })}
                  </div>
                </div>
              ))}
            </div>
          ) : isViewAllPage ? (
            // View All - Grouped by subcategory
            Object.keys(groupedProducts).length > 0 ? (
              <div className="subcategory-sections">
                {(() => {
                  const currentCategory = categories.find(cat => cat.slug === category.toLowerCase())
                  const subcats = currentCategory?.subcategories || []
                  return subcats.map(subcat => {
                    const subProducts = groupedProducts[subcat.name] || []
                    if (subProducts.length === 0) return null
                    
                    return (
                      <div key={subcat.id} className="subcategory-section">
                        <div className="subcategory-header">
                          <h2 className="subcategory-title">{subcat.name}</h2>
                          <Link
                            to={`/products/${category.toLowerCase()}/${subcat.slug}`}
                            className="subcategory-arrow-link"
                          >
                            <span>View All</span>
                            <ArrowRight size={20} />
                          </Link>
                        </div>
                      <div className="products-grid grid-compact">
                        {subProducts.map(product => (
                          <ProductCard key={product._id || product.id} product={product} />
                        ))}
                      </div>
                    </div>
                    )
                  })
                })()}
              </div>
            ) : (
              <div className="no-products">
                <p>No products found in this category.</p>
              </div>
            )
          ) : (
            // Specific subcategory page
            filteredProducts.length > 0 ? (
              <div className="products-grid grid-medium">
                {filteredProducts.map(product => (
                  <ProductCard key={product._id || product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="no-products-new">
                <div className="no-products-content">
                  <div className="no-products-icon">🔍</div>
                  <h3>No products found</h3>
                  <p>Try adjusting your filters or search terms</p>
                  {activeFiltersCount > 0 && (
                    <button 
                      className="clear-filters-action-btn"
                      onClick={clearAllFilters}
                    >
                      Clear All Filters
                    </button>
                  )}
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  )
}

export default Products
