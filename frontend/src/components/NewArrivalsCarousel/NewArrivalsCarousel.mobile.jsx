import { useState, useEffect, useRef } from 'react'
import { getImageUrl } from '../../utils/api'

function NewArrivalsCarouselMobile({ newArrivals }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const intervalRef = useRef(null)

  // Auto-rotate carousel
  useEffect(() => {
    if (newArrivals.length <= 1) return

    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % newArrivals.length)
    }, 4000) // Rotate every 4 seconds

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [newArrivals.length])

  if (newArrivals.length === 0) {
    return null
  }

  const currentArrival = newArrivals[currentIndex]

  return (
    <section className="new-arrivals-carousel-section-mobile">
      <div className="container">
        <h2>New Arrivals</h2>
        <p className="new-arrivals-subtitle">Curated Collection Just For You</p>
        <div className="new-arrivals-carousel-mobile">
          <div 
            key={currentIndex}
            className="carousel-slide-mobile"
          >
            <div className="carousel-image-wrapper-mobile">
              <img 
                src={getImageUrl(currentArrival.image)} 
                alt={currentArrival.title}
                className="carousel-image-mobile"
              />
            </div>
            <div className="carousel-info-mobile">
              <h3>{currentArrival.title}</h3>
              {currentArrival.description && (
                <p>{currentArrival.description}</p>
              )}
              <div className="carousel-price-mobile">
                <span className="current-price">₹{parseFloat(currentArrival.price).toLocaleString()}</span>
                {currentArrival.originalPrice && parseFloat(currentArrival.originalPrice) > parseFloat(currentArrival.price) && (
                  <span className="original-price">₹{parseFloat(currentArrival.originalPrice).toLocaleString()}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default NewArrivalsCarouselMobile
