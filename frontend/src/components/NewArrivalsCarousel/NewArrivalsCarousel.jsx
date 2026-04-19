import { useDevice } from '../../hooks/useDevice'
import NewArrivalsCarouselWeb from './NewArrivalsCarousel.web'
import NewArrivalsCarouselMobile from './NewArrivalsCarousel.mobile'

/**
 * NewArrivalsCarousel wrapper component that detects device type
 * and renders the appropriate carousel (web or mobile)
 */
function NewArrivalsCarousel({ newArrivals, currentArrivalIndex, setCurrentArrivalIndex }) {
  const isMobile = useDevice()

  if (isMobile) {
    return <NewArrivalsCarouselMobile newArrivals={newArrivals} />
  }

  return (
    <NewArrivalsCarouselWeb 
      newArrivals={newArrivals}
      currentArrivalIndex={currentArrivalIndex}
      setCurrentArrivalIndex={setCurrentArrivalIndex}
    />
  )
}

export default NewArrivalsCarousel
