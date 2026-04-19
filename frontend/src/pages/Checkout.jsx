import { useDevice } from '../hooks/useDevice'
import CheckoutMobile from './Checkout.mobile'
import CheckoutWeb from './Checkout.web'

function Checkout() {
  const isMobile = useDevice()

  if (isMobile) {
    return <CheckoutMobile />
  }

  return <CheckoutWeb />
}

export default Checkout
