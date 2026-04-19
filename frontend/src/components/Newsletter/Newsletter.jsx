import { useState } from 'react'
import { Mail, X } from 'lucide-react'
import { useToast } from '../Toast/ToastContainer'
import { newsletterAPI } from '../../utils/api'

function Newsletter({ onClose }) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { success, error } = useToast()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim()) {
      error('Please enter your email address')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await newsletterAPI.subscribe(email.trim(), name.trim() || null)
      
      // Check if email was already subscribed
      if (response && response.message) {
        if (response.message.includes('already subscribed')) {
          success('You are already subscribed to our newsletter!')
        } else {
          success('Successfully subscribed to our newsletter!')
        }
      } else {
        success('Successfully subscribed to our newsletter!')
      }
      
      setEmail('')
      setName('')
      if (onClose) onClose()
    } catch (err) {
      console.error('Failed to subscribe:', err)
      const errorMessage = err.message || 'Failed to subscribe. Please try again.'
      
      // Check if email is already subscribed (backend returns 400 with "Email already subscribed")
      if (errorMessage.toLowerCase().includes('already subscribed') || 
          errorMessage.toLowerCase().includes('email already subscribed')) {
        success('You are already subscribed to our newsletter! Thank you for your interest.')
        setEmail('')
        setName('')
        setTimeout(() => {
          if (onClose) onClose()
        }, 1500)
      } else {
        error(errorMessage)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="newsletter-modal">
      <div className="newsletter-content">
        {onClose && (
          <button className="newsletter-close" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        )}
        <div className="newsletter-icon">
          <Mail size={48} />
        </div>
        <h2>Subscribe to Our Newsletter</h2>
        <p>Get the latest fashion trends, exclusive offers, and style tips delivered to your inbox!</p>
        <form onSubmit={handleSubmit} className="newsletter-form">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name (optional)"
            className="newsletter-input"
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
            className="newsletter-input"
            required
          />
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Subscribing...' : 'Subscribe'}
          </button>
        </form>
        <p className="newsletter-note">By subscribing, you agree to our Privacy Policy. Unsubscribe anytime.</p>
      </div>
    </div>
  )
}

export default Newsletter

