import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getImageUrl } from '../../utils/api'

function HeroBannerMobile({ banners }) {
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0)
  const [bannerHeights, setBannerHeights] = useState({})

  // Auto-rotate banners
  useEffect(() => {
    if (banners.length > 1) {
      const interval = setInterval(() => {
        setCurrentBannerIndex((prev) => (prev + 1) % banners.length)
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [banners.length])

  // Calculate banner heights based on image aspect ratios (fit width, calculate height)
  useEffect(() => {
    if (banners.length === 0) return

    const calculateHeights = () => {
      banners.forEach((banner) => {
        const img = new Image()
        img.onload = () => {
          const aspectRatio = img.naturalWidth / img.naturalHeight
          const containerWidth = window.innerWidth
          // Calculate height based on full width to show entire image
          const calculatedHeight = containerWidth / aspectRatio
          // Set max height to prevent extremely tall banners (e.g., 150vh)
          const maxHeight = window.innerHeight * 1.5
          // Set min height to ensure banner is visible (e.g., 300px)
          const minHeight = 300
          const finalHeight = Math.max(minHeight, Math.min(calculatedHeight, maxHeight))
          setBannerHeights(prev => ({ ...prev, [banner.id]: finalHeight }))
        }
        img.src = getImageUrl(banner.image)
      })
    }

    calculateHeights()
    window.addEventListener('resize', calculateHeights)
    return () => window.removeEventListener('resize', calculateHeights)
  }, [banners])


  if (banners.length === 0) {
    return null
  }

  const currentBanner = banners[currentBannerIndex]
  // Use computed banner height when available, otherwise fall back to a sensible fixed height
  const FALLBACK_BANNER_HEIGHT = 300
  const bannerHeight = bannerHeights[currentBanner.id] || FALLBACK_BANNER_HEIGHT

  return (
    <section 
      className="hero-banner hero-mobile"
      style={{ height: `${bannerHeight}px` }}
    >
      <div className="banner-slider">
        {banners.map((banner, index) => {
          const imageUrl = getImageUrl(banner.image)
          const ariaLabel = banner.title + (banner.subtitle ? ` - ${banner.subtitle}` : '')
          const slideHeight = bannerHeights[banner.id] || FALLBACK_BANNER_HEIGHT
          
          return (
            <div
              key={banner.id}
              className={`banner-slide ${index === currentBannerIndex ? 'active' : ''}`}
              role="img"
              aria-label={ariaLabel}
              style={{ height: `${slideHeight}px` }}
            >
              <img 
                src={imageUrl} 
                alt={ariaLabel}
                loading={index === 0 ? "eager" : "lazy"}
                onLoad={(e) => {
                  if (!bannerHeights[banner.id]) {
                    const img = e.target
                    const aspectRatio = img.naturalWidth / img.naturalHeight
                    const containerWidth = window.innerWidth
                    const calculatedHeight = containerWidth / aspectRatio
                    const maxHeight = window.innerHeight * 1.5
                    const minHeight = 300
                    const finalHeight = Math.max(minHeight, Math.min(calculatedHeight, maxHeight))
                    setBannerHeights(prev => ({ ...prev, [banner.id]: finalHeight }))
                  }
                }}
              />
              {banner.link ? (
                <Link 
                  to={banner.link} 
                  className="banner-link-overlay"
                  aria-label={`${ariaLabel} - Click to view`}
                >
                  <span className="sr-only">{ariaLabel}</span>
                </Link>
              ) : (
                <span className="sr-only">{ariaLabel}</span>
              )}
            </div>
          )
        })}
        {banners.length > 1 && (
          <div className="banner-indicators">
            {banners.map((_, index) => (
              <button
                key={index}
                className={`banner-indicator ${index === currentBannerIndex ? 'active' : ''}`}
                onClick={() => setCurrentBannerIndex(index)}
                aria-label={`Go to banner ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export default HeroBannerMobile
