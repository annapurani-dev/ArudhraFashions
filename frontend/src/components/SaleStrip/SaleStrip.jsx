import { useDevice } from '../../hooks/useDevice'
import SaleStripWeb from './SaleStrip.web'
import SaleStripMobile from './SaleStrip.mobile'

/**
 * SaleStrip wrapper component that detects device type
 * and renders the appropriate sale strip (web or mobile)
 */
function SaleStrip() {
  const isMobile = useDevice()

  return isMobile ? <SaleStripMobile /> : <SaleStripWeb />
}

export default SaleStrip
