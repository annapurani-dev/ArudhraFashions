import { Link } from 'react-router-dom'
import { Facebook, Instagram, Mail } from 'lucide-react'
import { useDevice } from '../../hooks/useDevice'
import { useLoginModal } from '../../context/LoginModalContext'
import { useNewsletter } from '../../context/NewsletterContext'

function Footer() {
  const isMobile = useDevice()
  const { openModal } = useLoginModal()
  const { openNewsletter } = useNewsletter()

  const handleSignIn = () => {
    openModal('login')
  }

  const handleCreateAccount = () => {
    openModal('register')
  }
  return (
    <footer className={`footer ${isMobile ? 'footer-mobile' : 'footer-web'}`}>
      <div className="container">
        <div className="footer-content">
          {isMobile ? (
            <>
              <div className="footer-main-content">
                <div className="footer-brand-section">
                  <img src="/Logo.png?v=3" alt="Arudhra Fashions Logo" className="footer-logo-img" />
                </div>
                <div className="footer-sections-wrapper">
                  <div className="footer-section">
                    <h3>Customer Service</h3>
                    <ul>
                      <li><Link to="/size-guide">Size Guide</Link></li>
                      <li><Link to="/shipping">Shipping Info</Link></li>
                      <li><Link to="/returns">Returns</Link></li>
                      <li><Link to="/faq">FAQ</Link></li>
                      <li><Link to="/contact">Contact Us</Link></li>
                      <li><button onClick={openNewsletter} className="footer-link-btn">Newsletter</button></li>
                    </ul>
                  </div>

                  <div className="footer-section">
                    <h3>Account</h3>
                    <ul>
                      <li><button onClick={handleSignIn} className="footer-link-btn">Sign In</button></li>
                      <li><button onClick={handleCreateAccount} className="footer-link-btn">Create Account</button></li>
                      <li><Link to="/dashboard">My Account</Link></li>
                      <li><Link to="/wishlist">Wishlist</Link></li>
                      <li><Link to="/dashboard" state={{ tab: 'track' }}>Track Order</Link></li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="footer-brand-name-section">
                <h2 className="footer-brand-name">Arudhra Fashions</h2>
                <div className="social-links">
                  <a href="#" aria-label="Facebook"><Facebook size={20} /></a>
                  <a href="#" aria-label="Instagram"><Instagram size={20} /></a>
                  <a href="#" aria-label="Email"><Mail size={20} /></a>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="footer-main-content">
                <div className="footer-brand-section">
                  <img src="/Logo.png?v=3" alt="Arudhra Fashions Logo" className="footer-logo-img" />
                </div>
                <div className="footer-sections-wrapper">
                  <div className="footer-section">
                    <h3>Customer Service</h3>
                    <ul>
                      <li><Link to="/size-guide">Size Guide</Link></li>
                      <li><Link to="/shipping">Shipping Info</Link></li>
                      <li><Link to="/returns">Returns</Link></li>
                      <li><Link to="/faq">FAQ</Link></li>
                      <li><Link to="/contact">Contact Us</Link></li>
                      <li><button onClick={openNewsletter} className="footer-link-btn">Newsletter</button></li>
                    </ul>
                  </div>

                  <div className="footer-section">
                    <h3>Account</h3>
                    <ul>
                      <li><button onClick={handleSignIn} className="footer-link-btn">Sign In</button></li>
                      <li><button onClick={handleCreateAccount} className="footer-link-btn">Create Account</button></li>
                      <li><Link to="/dashboard">My Account</Link></li>
                      <li><Link to="/wishlist">Wishlist</Link></li>
                      <li><Link to="/dashboard" state={{ tab: 'track' }}>Track Order</Link></li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="footer-brand-name-section">
                <h2 className="footer-brand-name">Arudhra Fashions</h2>
                <div className="social-links">
                  <a href="#" aria-label="Facebook"><Facebook size={20} /></a>
                  <a href="#" aria-label="Instagram"><Instagram size={20} /></a>
                  <a href="#" aria-label="Email"><Mail size={20} /></a>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="footer-bottom">
          <p>&copy; 2026 Arudhra Fashions. All rights reserved.</p>
          <div className="footer-links">
            <Link to="/privacy" className="footer-legal-link">Privacy Policy</Link>
            <Link to="/terms" className="footer-legal-link">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer

