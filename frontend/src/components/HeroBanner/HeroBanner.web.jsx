import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getImageUrl } from '../../utils/api'

function HeroBannerWeb({ banners, bannerHeights, currentBannerIndex, setCurrentBannerIndex, setBannerHeights }) {
  // Auto-rotate banners
  useEffect(() => {
    if (banners.length > 1) {
      const interval = setInterval(() => {
        setCurrentBannerIndex((prev) => (prev + 1) % banners.length)
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [banners.length, setCurrentBannerIndex])

  if (banners.length === 0) {
    return null
  }

  return (
    <section 
      className="hero-banner hero-web"
      style={bannerHeights[banners[currentBannerIndex]?.id] ? {
        height: `${bannerHeights[banners[currentBannerIndex].id]}px`
      } : {}}
    >
      <div className="banner-slider">
        {banners.map((banner, index) => {
          const imageUrl = getImageUrl(banner.image)
          const ariaLabel = banner.title + (banner.subtitle ? ` - ${banner.subtitle}` : '')
          return (
            <div
              key={banner.id}
              className={`banner-slide ${index === currentBannerIndex ? 'active' : ''}`}
              role="img"
              aria-label={ariaLabel}
            >
              <img
                src={imageUrl}
                alt={ariaLabel}
                loading={index === 0 ? "eager" : "lazy"}
                width={banner.width || undefined}
                height={banner.height || undefined}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                onLoad={(e) => {
                  // If caller passed a setter, update banner heights (backwards compatible)
                  if (!bannerHeights[banner.id] && typeof setBannerHeights === 'function') {
                    const img = e.target
                    const aspectRatio = img.naturalWidth / img.naturalHeight
                    const containerWidth = window.innerWidth
                    const calculatedHeight = containerWidth / aspectRatio
                    const maxHeight = window.innerHeight * 0.95
                    const minHeight = 500
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

export default HeroBannerWeb
