import { useDevice } from '../../hooks/useDevice'
import HeroBannerWeb from './HeroBanner.web'
import HeroBannerMobile from './HeroBanner.mobile'

/**
 * HeroBanner wrapper component that detects device type
 * and renders the appropriate hero banner (web or mobile)
 */
function HeroBanner({ banners, bannerHeights, currentBannerIndex, setCurrentBannerIndex, setBannerHeights }) {
  const isMobile = useDevice()

  if (isMobile) {
    return <HeroBannerMobile banners={banners} />
  }

  return (
    <HeroBannerWeb 
      banners={banners}
      bannerHeights={bannerHeights}
      currentBannerIndex={currentBannerIndex}
      setCurrentBannerIndex={setCurrentBannerIndex}
      setBannerHeights={setBannerHeights}
    />
  )
}

export default HeroBanner
