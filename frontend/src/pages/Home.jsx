import { Link } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { useNewsletter } from '../context/NewsletterContext'
import ProductCard from '../components/ProductCard/ProductCard'
import { HeroBanner } from '../components/HeroBanner'
import { NewArrivalsCarousel } from '../components/NewArrivalsCarousel'
import { bannersAPI, productsAPI, contentAPI, newArrivalsAPI, testimonialsAPI, getImageUrl } from '../utils/api'
import { fetchWithCache } from '../utils/simpleCache'
import { useToast } from '../components/Toast/ToastContainer'
import { useDevice } from '../hooks/useDevice'
import Loading from '../components/Loading/Loading'
import { HomeSkeleton } from '../components/Skeletons/PageSkeletons'

function Home() {
  const isMobile = useDevice()
  const { openNewsletter } = useNewsletter()
  const [banners, setBanners] = useState([])
  // Splash is handled by a centralized portal component to avoid remount/flicker
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0)
  const [bannerHeights, setBannerHeights] = useState({})
  const [heroContent, setHeroContent] = useState({
    title: 'Welcome to Arudhra Fashions!',
    description: 'Fashioning Beauty for every Journey, Age and Story',
    button1Text: 'Shop Women',
    button1Link: '/products/women',
    button2Text: 'Shop Teen',
    button2Link: '/products/teen',
    button3Text: 'Shop Girls',
    button3Link: '/products/girls'
  })
  const [featuredProducts, setFeaturedProducts] = useState([])
  const [newProducts, setNewProducts] = useState([])
  const [newArrivals, setNewArrivals] = useState([])
  const [currentArrivalIndex, setCurrentArrivalIndex] = useState(0)
  const arrivalIntervalRef = useRef(null)
  const [testimonials, setTestimonials] = useState([])
  const [isHoveringTestimonials, setIsHoveringTestimonials] = useState(false)
  const testimonialScrollRef = useRef(null)
  const carouselSectionRef = useRef(null)
  const [parallaxOffset, setParallaxOffset] = useState(0)
  const [loading, setLoading] = useState(true)
  const { error: showError } = useToast()
  // Hardcoded fixed banners (served from frontend/public for fastest load)
  const hardcodedBanners = [
    '/Banner1.png',
    '/Banner2.png',
    '/Banner3.png'
  ]
  const [hardBannerIndex, setHardBannerIndex] = useState(0)
  const [hardBannerHeight, setHardBannerHeight] = useState(220)

  // When home finishes loading, notify the centralized Splash component to fade out
  useEffect(() => {
    if (!loading) {
      // Wait for hero banner's first image to finish loading before notifying Splash.
      // This avoids the splash hiding before the main banner appears.
      let cancelled = false
      const dispatchHomeLoaded = () => {
        if (cancelled) return
        window.dispatchEvent(new Event('homeLoaded'))
      }

      if (banners && banners.length > 0 && banners[0].image) {
        try {
          const img = new Image()
          img.onload = () => dispatchHomeLoaded()
          img.onerror = () => dispatchHomeLoaded()
          img.src = getImageUrl(banners[0].image)
          // Fallback in case onload doesn't fire within 2s
          const fallback = setTimeout(() => dispatchHomeLoaded(), 2000)
          return () => { cancelled = true; clearTimeout(fallback) }
        } catch (e) {
          dispatchHomeLoaded()
        }
      } else {
        dispatchHomeLoaded()
      }
    }
  }, [loading, banners])

  // Preload hardcoded banner images and auto-rotate them
  useEffect(() => {
    // Preload
    hardcodedBanners.forEach((src) => {
      try {
        const link = document.createElement('link')
        link.rel = 'preload'
        link.as = 'image'
        link.href = src
        document.head.appendChild(link)
      } catch (e) {
        // ignore
      }
    })

    // Auto-rotate
    const interval = setInterval(() => {
      setHardBannerIndex((prev) => (prev + 1) % hardcodedBanners.length)
    }, 5000)

    return () => {
      clearInterval(interval)
      // Note: we intentionally do not remove preload links to avoid race conditions
    }
  }, [])

  // Calculate hardcoded banner height based on first image aspect ratio
  useEffect(() => {
    if (!hardcodedBanners || hardcodedBanners.length === 0) return

    let cancelled = false
    const img = new Image()
    const calculate = () => {
      try {
        img.onload = () => {
          if (cancelled) return
          const aspectRatio = img.naturalWidth / img.naturalHeight || (16/9)
          const containerWidth = window.innerWidth
          const calculatedHeight = containerWidth / aspectRatio
          // Mobile: allow smaller heights; Desktop: keep minimum large to match design
          const maxHeight = isMobile ? window.innerHeight * 0.6 : window.innerHeight * 0.95
          const minHeight = isMobile ? 200 : 500
          const finalHeight = Math.max(minHeight, Math.min(calculatedHeight, maxHeight))
          setHardBannerHeight(finalHeight)
        }
        img.src = hardcodedBanners[0]
      } catch (e) {
        setHardBannerHeight(isMobile ? 220 : 500)
      }
    }

    calculate()
    window.addEventListener('resize', calculate)
    return () => {
      cancelled = true
      window.removeEventListener('resize', calculate)
    }
  }, [hardcodedBanners])

  // Splash interactions moved to central Splash component (portal)

  useEffect(() => {
    loadHomeData()
    
    // Show newsletter modal after 3 seconds on first visit
    const hasSeenNewsletter = localStorage.getItem('newsletterShown')
    if (!hasSeenNewsletter) {
      const timer = setTimeout(() => {
        openNewsletter()
        localStorage.setItem('newsletterShown', 'true')
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [])

  // Note: Auto-rotate banners is now handled in HeroBanner components

  // Auto-rotate new arrivals (4 seconds). Only run this interval for non-mobile (mobile has its own timer).
  useEffect(() => {
    // Always clear existing interval first
    if (arrivalIntervalRef.current) {
      clearInterval(arrivalIntervalRef.current)
      arrivalIntervalRef.current = null
    }

    // Set up interval if we have multiple arrivals and we're on web (not mobile)
    if (newArrivals.length > 1 && !isMobile) {
      arrivalIntervalRef.current = setInterval(() => {
        setCurrentArrivalIndex((prev) => {
          return (prev + 1) % newArrivals.length
        })
      }, 4000)
    }

    // Cleanup function
    return () => {
      if (arrivalIntervalRef.current) {
        clearInterval(arrivalIntervalRef.current)
        arrivalIntervalRef.current = null
      }
    }
  }, [newArrivals.length, isMobile])

  // Auto-scroll testimonials horizontally
  useEffect(() => {
    // Only enable scrolling if we have at least 2 testimonials (or content is wider than container)
    if (!testimonialScrollRef.current || testimonials.length === 0) {
      return
    }

    const scrollContainer = testimonialScrollRef.current
    let scrollPosition = 0
    let intervalId = null

    const startScrolling = () => {
      // Clear any existing interval
      if (intervalId) {
        clearInterval(intervalId)
      }

      intervalId = setInterval(() => {
        if (!scrollContainer || isHoveringTestimonials) {
          return
        }

        const containerWidth = scrollContainer.clientWidth
        const contentWidth = scrollContainer.scrollWidth

        // Only scroll if content is wider than container
        // With duplication, content should be wider (2x testimonials)
        if (contentWidth > containerWidth) {
          scrollPosition += 1 // 1 pixel per interval
          const oneSetWidth = contentWidth / 2 // Divide by 2 since we duplicate testimonials

          if (scrollPosition >= oneSetWidth) {
            // Reset to start for seamless infinite loop (jump back by one set width)
            scrollPosition = scrollPosition - oneSetWidth
            scrollContainer.scrollLeft = scrollPosition
          } else {
            scrollContainer.scrollLeft = scrollPosition
          }
        }
      }, 20) // Update every 20ms for smooth scrolling
    }

    // Start scrolling after DOM is ready
    const startTimeout = setTimeout(() => {
      if (scrollContainer) {
        // Check if content is actually wider than container before starting
        const containerWidth = scrollContainer.clientWidth
        const contentWidth = scrollContainer.scrollWidth
        
        if (contentWidth > containerWidth) {
          startScrolling()
        }
      }
    }, 500)

    return () => {
      clearTimeout(startTimeout)
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [testimonials.length, isHoveringTestimonials])

  // Calculate banner heights based on image aspect ratios (full width)
  useEffect(() => {
    if (banners.length === 0) return

    const calculateHeights = () => {
      const heights = {}
      banners.forEach((banner) => {
        const img = new Image()
        img.onload = () => {
          const aspectRatio = img.naturalWidth / img.naturalHeight
          const containerWidth = window.innerWidth
          const calculatedHeight = containerWidth / aspectRatio
          // Allow up to 95vh for tall images, minimum 500px
          const maxHeight = window.innerHeight * 0.95
          const minHeight = 500
          const finalHeight = Math.max(minHeight, Math.min(calculatedHeight, maxHeight))
          heights[banner.id] = finalHeight
          setBannerHeights(prev => ({ ...prev, [banner.id]: finalHeight }))
        }
        img.src = getImageUrl(banner.image)
      })
    }

    calculateHeights()
    window.addEventListener('resize', calculateHeights)
    return () => window.removeEventListener('resize', calculateHeights)
  }, [banners])

  // Parallax scroll effect for carousel section
  useEffect(() => {
    const handleScroll = () => {
      if (!carouselSectionRef.current) return
      
      const rect = carouselSectionRef.current.getBoundingClientRect()
      const windowHeight = window.innerHeight
      
      // Calculate parallax offset when section is in viewport
      if (rect.top < windowHeight && rect.bottom > 0) {
        const scrollProgress = (windowHeight - rect.top) / (windowHeight + rect.height)
        const offset = scrollProgress * 30 // Adjust multiplier for parallax intensity
        setParallaxOffset(offset)
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // Initial call
    
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const loadHomeData = async () => {
    try {
      setLoading(true)
      // Parallelize independent API calls. Featured product details are fetched
      // after we receive featured IDs (but per-id fetches run in parallel).
      // Disable banners fetch for now (temporarily using empty banners)
      const [
        heroRes,
        featuredIdsRes,
        newProductsRes,
        arrivalsRes,
        testimonialsRes
      ] = await Promise.allSettled([
        fetchWithCache('heroContent', () => contentAPI.getHero()),
        fetchWithCache('featuredProductIds', () => contentAPI.getFeaturedProducts()),
        fetchWithCache('newProducts_home', () => productsAPI.getAll({ new: true, limit: 8 })),
        fetchWithCache('newArrivals', () => newArrivalsAPI.getAll()),
        fetchWithCache('testimonials', () => testimonialsAPI.getAll())
      ])

      // Banners disabled: use empty list
      setBanners([])

      // Hero content
      if (heroRes.status === 'fulfilled' && heroRes.value && Object.keys(heroRes.value).length > 0) {
        setHeroContent(prev => ({ ...prev, ...heroRes.value }))
      } else if (heroRes.status === 'rejected') {
        console.error('Failed to load hero content:', heroRes.reason)
      }

      // Featured products: get IDs first, then fetch details in parallel
      try {
        const featuredIds = (featuredIdsRes.status === 'fulfilled' && featuredIdsRes.value && Array.isArray(featuredIdsRes.value.productIds))
          ? featuredIdsRes.value.productIds
          : []

        if (featuredIds.length > 0) {
          const detailPromises = featuredIds.map(id => productsAPI.getById(id).catch(err => { console.warn(`Failed to load product ${id}:`, err); return null }))
          const settled = await Promise.allSettled(detailPromises)
          const products = settled
            .filter(r => r.status === 'fulfilled' && r.value && r.value.isActive !== false)
            .map(r => r.value)
          setFeaturedProducts(products)
        } else {
          setFeaturedProducts([])
        }
      } catch (err) {
        console.error('Failed to load featured products:', err)
        setFeaturedProducts([])
      }

      // New products
      if (newProductsRes.status === 'fulfilled') {
        const newData = newProductsRes.value
        console.log('New products response:', newData)
        if (newData && Array.isArray(newData.products)) {
          setNewProducts(newData.products)
        } else if (Array.isArray(newData)) {
          setNewProducts(newData)
        } else {
          setNewProducts([])
        }
      } else {
        console.error('Failed to load new products:', newProductsRes.status === 'rejected' ? newProductsRes.reason : 'invalid response')
        setNewProducts([])
      }

      // New arrivals
      if (arrivalsRes.status === 'fulfilled' && Array.isArray(arrivalsRes.value)) {
        setNewArrivals(arrivalsRes.value)
        if (arrivalsRes.value.length > 0) {
          setCurrentArrivalIndex(0)
        }
      } else {
        console.error('Failed to load new arrivals:', arrivalsRes.status === 'rejected' ? arrivalsRes.reason : 'invalid response')
        setNewArrivals([])
      }

      // Testimonials
      if (testimonialsRes.status === 'fulfilled' && Array.isArray(testimonialsRes.value)) {
        setTestimonials(testimonialsRes.value)
      } else {
        console.error('Failed to load testimonials:', testimonialsRes.status === 'rejected' ? testimonialsRes.reason : 'invalid response')
        setTestimonials([])
      }

    } catch (err) {
      console.error('Failed to load home data:', err)
      // Don't show error toast on initial load to avoid blocking UI
    } finally {
      setLoading(false)
    }
  }

  // Banner navigation handlers (for web view)
  const nextBanner = () => {
    setCurrentBannerIndex((prev) => (prev + 1) % banners.length)
  }

  const prevBanner = () => {
    setCurrentBannerIndex((prev) => (prev - 1 + banners.length) % banners.length)
  }




  

  return (
    <div className="home-page">
      {/* Splash overlay is rendered centrally via portal Splash component */}
      {/* Banner / Hero area */}
      {hardcodedBanners && hardcodedBanners.length > 0 ? (
        isMobile ? (
          <section className="hero-banner hero-mobile">
            <div className="banner-slider">
              {hardcodedBanners.map((src, i) => {
                const ariaLabel = `Banner ${i + 1}`
                return (
                  <div
                    key={src}
                    className={`banner-slide ${i === hardBannerIndex ? 'active' : ''}`}
                    role="img"
                    aria-label={ariaLabel}
                  >
                    <img
                      src={src}
                      alt={ariaLabel}
                      loading={i === 0 ? 'eager' : 'lazy'}
                      style={{ width: '100%', height: 'auto', objectFit: 'contain', display: 'block' }}
                    />
                  </div>
                )
              })}
              {hardcodedBanners.length > 1 && (
                <div className="banner-indicators">
                  {hardcodedBanners.map((_, idx) => (
                    <button
                      key={idx}
                      className={`banner-indicator ${idx === hardBannerIndex ? 'active' : ''}`}
                      onClick={() => setHardBannerIndex(idx)}
                      aria-label={`Go to banner ${idx + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>
        ) : (
          <section
            className={`hero ${isMobile ? 'hero-mobile' : 'hero-web'}`}
            style={{ height: hardBannerHeight, position: 'relative', overflow: 'hidden' }}
          >
            {hardcodedBanners.map((src, i) => (
            <img
              key={src}
              src={src}
              alt=""
              loading={i === 0 ? 'eager' : 'lazy'}
              width={typeof window !== 'undefined' ? window.innerWidth : undefined}
              height={typeof hardBannerHeight === 'number' ? Math.round(hardBannerHeight) : undefined}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: i === hardBannerIndex ? 1 : 0,
                transition: 'opacity 0.6s ease'
              }}
            />
            ))}
          </section>
        )
      ) : banners.length > 0 ? (
        <HeroBanner 
          banners={banners}
          bannerHeights={bannerHeights}
          currentBannerIndex={currentBannerIndex}
          setCurrentBannerIndex={setCurrentBannerIndex}
          setBannerHeights={setBannerHeights}
        />
      ) : (
        <section className={`hero ${isMobile ? 'hero-mobile' : 'hero-web'}`}>
          <div className="hero-content">
            <h1>{heroContent.title}</h1>
            <p>{heroContent.description}</p>
            <div className="hero-buttons">
              <Link to={heroContent.button1Link || "/products/women"} className="btn btn-primary btn-large">
                {heroContent.button1Text || "Shop Women"}
              </Link>
              <Link to={heroContent.button2Link || "/products/teen"} className="btn btn-outline btn-large">
                {heroContent.button2Text || "Shop Teen"}
              </Link>
              <Link to={heroContent.button3Link || "/products/girls"} className="btn btn-outline btn-large">
                {heroContent.button3Text || "Shop Girls"}
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Loading indicator shown while rest of homepage fetches */}
      {loading ? (
        <div className="container" style={{ marginTop: 20 }}>
          <HomeSkeleton />
        </div>
      ) : (
        <>
          {/* Collections */}
          {featuredProducts.length > 0 && (
            <section className="featured-section collections-section">
              <div className="container">
                <h2 className="collections-heading">Collections</h2>
                <div className="products-grid featured-products-grid">
                  {featuredProducts.map(product => (
                    <ProductCard key={product.id} product={product} compact={true} />
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* New Arrivals Carousel */}
          {newArrivals.length >= 5 && (
            <div 
              ref={carouselSectionRef}
              style={{
                transform: `translateY(${parallaxOffset}px)`
              }}
            >
              <NewArrivalsCarousel 
                newArrivals={newArrivals}
                currentArrivalIndex={currentArrivalIndex}
                setCurrentArrivalIndex={setCurrentArrivalIndex}
              />
            </div>
          )}

          {/* (Removed separate newProducts listing — homepage now uses aggregated /api/home and carousel) */}

          {/* Testimonials Section */}
          {testimonials.length > 0 && (
            <section 
              className="testimonials-section"
              onMouseEnter={() => setIsHoveringTestimonials(true)}
              onMouseLeave={() => setIsHoveringTestimonials(false)}
            >
              <div className="container" style={{ overflow: 'hidden' }}>
                <h2 className="testimonials-heading">What Our Customers Say</h2>
                <div className="testimonials-carousel" ref={testimonialScrollRef}>
                  {/* Render testimonials - duplicate only if we have multiple for seamless scroll */}
                  {testimonials.map((testimonial, index) => (
                    <div key={testimonial.id} className="testimonial-card">
                      <div className="testimonial-content">
                        <p>"{testimonial.content}"</p>
                      </div>
                      <div className="testimonial-author">
                        <h4>{testimonial.name}</h4>
                        {testimonial.rating && (
                          <div className="testimonial-rating">
                            {'★'.repeat(testimonial.rating)}{'☆'.repeat(5 - testimonial.rating)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {/* Only duplicate if we have testimonials (for infinite scroll) */}
                  {testimonials.length > 0 && testimonials.map((testimonial, index) => (
                    <div key={`duplicate-${testimonial.id}-${index}`} className="testimonial-card">
                      <div className="testimonial-content">
                        <p>"{testimonial.content}"</p>
                      </div>
                      <div className="testimonial-author">
                        <h4>{testimonial.name}</h4>
                        {testimonial.rating && (
                          <div className="testimonial-rating">
                            {'★'.repeat(testimonial.rating)}{'☆'.repeat(5 - testimonial.rating)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}
        </>
      )}


    </div>
  )
}

export default Home

