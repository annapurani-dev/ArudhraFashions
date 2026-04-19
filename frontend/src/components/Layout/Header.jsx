import { useDevice } from '../../hooks/useDevice'
import HeaderWeb from './Header.web'
import HeaderMobile from './Header.mobile'

/**
 * Header wrapper component that detects device type
 * and renders the appropriate header (web or mobile)
 */
function Header() {
  const isMobile = useDevice()

  return isMobile ? <HeaderMobile /> : <HeaderWeb />
}

export default Header

