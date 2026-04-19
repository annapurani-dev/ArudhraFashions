import { useEffect } from 'react'
import { getImageUrl } from '../../utils/api'

function NewArrivalsCarouselWeb({ newArrivals, currentArrivalIndex, setCurrentArrivalIndex }) {
  // Auto-rotate carousel
  useEffect(() => {
    if (newArrivals.length <= 1) return

    const interval = setInterval(() => {
      setCurrentArrivalIndex((prev) => (prev + 1) % newArrivals.length)
    }, 4000)

    return () => clearInterval(interval)
  }, [newArrivals.length, setCurrentArrivalIndex])

  if (newArrivals.length === 0) {
    return null
  }

  const total = newArrivals.length
  
  // Calculate position for each item relative to current index
  const getPositionClass = (itemIndex) => {
    // Calculate the shortest distance from current index
    let diff = itemIndex - currentArrivalIndex
    
    // Handle wrapping - find shortest path
    if (diff > total / 2) {
      diff -= total
    } else if (diff < -total / 2) {
      diff += total
    }
    
    // Map diff to position class
    switch (diff) {
      case 0: return 'center'
      case -1: return 'left-1'
      case -2: return 'left-2'
      case 1: return 'right-1'
      case 2: return 'right-2'
      default: return 'hidden'
    }
  }
  
  return (
    <section className="new-arrivals-carousel-section">
      <div className="container">
        <h2>New Arrivals</h2>
        <p className="new-arrivals-subtitle">Curated Collection Just For You</p>
        <div className="new-arrivals-carousel">
          {newArrivals.map((arrival, index) => {
            const positionClass = getPositionClass(index)
            
            return (
              <div
                key={arrival.id}
                className={`arrival-slide ${positionClass}`}
              >
                <div className="arrival-slide-content">
                  <img 
                    src={getImageUrl(arrival.image)} 
                    alt={arrival.title}
                  />
                  <div className="arrival-slide-info">
                    <h3>{arrival.title}</h3>
                    {arrival.description && (
                      <p>{arrival.description}</p>
                    )}
                    <div className="arrival-slide-price">
                      <span className="current-price">₹{parseFloat(arrival.price).toLocaleString()}</span>
                      {arrival.originalPrice && parseFloat(arrival.originalPrice) > parseFloat(arrival.price) && (
                        <span className="original-price">₹{parseFloat(arrival.originalPrice).toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default NewArrivalsCarouselWeb
