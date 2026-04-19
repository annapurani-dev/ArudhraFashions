import { useDevice } from '../hooks/useDevice'
import ContactMobile from './Contact.mobile'
import ContactWeb from './Contact.web'

function Contact() {
  const isMobile = useDevice()

  if (isMobile) {
    return <ContactMobile />
  }

  return <ContactWeb />
}

export default Contact

