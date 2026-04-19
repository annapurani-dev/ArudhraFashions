import { useState, useEffect } from 'react'
import { Mail, Phone, MapPin, Clock, ArrowLeft, Send, CheckCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { contactAPI, settingsAPI } from '../utils/api'
import { useToast } from '../components/Toast/ToastContainer'

function ContactMobile() {
  const navigate = useNavigate()
  const { success, error: showError } = useToast()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    subject: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [contactInfo, setContactInfo] = useState({
    email: 'support@arudhrafashions.com',
    phone: '+91 63847 37391',
    address: '11A, Appavu street, Pudhupalyam, Cuddalore - 607001',
    hours: 'Mon - Fri ( 10 to 6 )\nSaturday & Sunday ( 10 to 8 )'
  })

  useEffect(() => {
    loadContactInfo()
  }, [])

  const loadContactInfo = async () => {
    try {
      const settings = await settingsAPI.getContact()
      if (settings && Object.keys(settings).length > 0) {
        setContactInfo(prev => ({ ...prev, ...settings }))
      }
    } catch (err) {
      console.error('Failed to load contact info:', err)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      await contactAPI.submit(formData)
      setSubmitted(true)
      setFormData({ name: '', email: '', mobile: '', subject: '', message: '' })
      success('Message sent successfully! We\'ll get back to you soon.')
    } catch (error) {
      console.error('Failed to submit contact form:', error)
      showError('Failed to submit your message. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <div className="contact-mobile-page">
      {/* Mobile Header */}
      <div className="contact-mobile-header">
        <button onClick={() => navigate(-1)} className="contact-mobile-back-btn" aria-label="Go back">
          <ArrowLeft size={22} />
        </button>
        <h1 className="contact-mobile-title">Contact Us</h1>
        <div style={{ width: 22 }}></div> {/* Spacer for centering */}
      </div>

      {/* Success Message */}
      {submitted && (
        <div className="contact-mobile-success">
          <CheckCircle size={24} />
          <div>
            <h3>Message Sent!</h3>
            <p>We'll get back to you soon.</p>
          </div>
        </div>
      )}

      <div className="contact-mobile-content">
        {/* Contact Info Cards */}
        <div className="contact-mobile-info-section">
          <h2 className="contact-mobile-section-title">Get in Touch</h2>
          
          <div className="contact-mobile-info-grid">
            <div className="contact-mobile-info-card">
              <div className="contact-mobile-info-icon">
                <Mail size={16} />
              </div>
              <div className="contact-mobile-info-content">
                <h3>Email Us</h3>
                {contactInfo.email && (
                  <a href={`mailto:${contactInfo.email}`} className="contact-mobile-link">
                    {contactInfo.email}
                  </a>
                )}
                {contactInfo.email2 && (
                  <a href={`mailto:${contactInfo.email2}`} className="contact-mobile-link">
                    {contactInfo.email2}
                  </a>
                )}
              </div>
            </div>

            <div className="contact-mobile-info-card">
              <div className="contact-mobile-info-icon">
                <Phone size={16} />
              </div>
              <div className="contact-mobile-info-content">
                <h3>Call Us</h3>
                {contactInfo.phone && (
                  <a href={`tel:${contactInfo.phone.replace(/\s/g, '')}`} className="contact-mobile-link">
                    {contactInfo.phone}
                  </a>
                )}
                {contactInfo.phone2 && (
                  <a href={`tel:${contactInfo.phone2.replace(/\s/g, '')}`} className="contact-mobile-link">
                    {contactInfo.phone2}
                  </a>
                )}
                {contactInfo.phoneHours && (
                  <p className="contact-mobile-note">{contactInfo.phoneHours}</p>
                )}
              </div>
            </div>

            <div className="contact-mobile-info-card">
              <div className="contact-mobile-info-icon">
                <MapPin size={16} />
              </div>
              <div className="contact-mobile-info-content">
                <h3>Visit Us</h3>
                {contactInfo.address && contactInfo.address.split('\n').map((line, idx) => (
                  <p key={idx}>{line}</p>
                ))}
              </div>
            </div>

            <div className="contact-mobile-info-card">
              <div className="contact-mobile-info-icon">
                <Clock size={16} />
              </div>
              <div className="contact-mobile-info-content">
                <h3>Business Hours</h3>
                {contactInfo.hours && contactInfo.hours.split('\n').map((line, idx) => (
                  <p key={idx}>{line}</p>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="contact-mobile-form-section">
          <h2 className="contact-mobile-section-title">Send us a Message</h2>
          
          <form className="contact-mobile-form" onSubmit={handleSubmit}>
            <div className="contact-mobile-form-group">
              <label htmlFor="mobile-name">Full Name *</label>
              <input
                type="text"
                id="mobile-name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Enter your name"
                className="contact-mobile-input"
              />
            </div>

            <div className="contact-mobile-form-group">
              <label htmlFor="mobile-email">Email Address *</label>
              <input
                type="email"
                id="mobile-email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="your.email@example.com"
                className="contact-mobile-input"
              />
            </div>

            <div className="contact-mobile-form-group">
              <label htmlFor="mobile-mobile">Mobile Number *</label>
              <input
                type="tel"
                id="mobile-mobile"
                name="mobile"
                value={formData.mobile}
                onChange={handleChange}
                required
                placeholder="+91 98765 43210"
                className="contact-mobile-input"
              />
            </div>

            <div className="contact-mobile-form-group">
              <label htmlFor="mobile-subject">Subject *</label>
              <input
                type="text"
                id="mobile-subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
                placeholder="What is this regarding?"
                className="contact-mobile-input"
              />
            </div>

            <div className="contact-mobile-form-group">
              <label htmlFor="mobile-message">Message *</label>
              <textarea
                id="mobile-message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows="6"
                placeholder="Tell us how we can help you..."
                className="contact-mobile-textarea"
              ></textarea>
            </div>

            <button 
              type="submit" 
              className="contact-mobile-submit-btn" 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>Sending...</>
              ) : (
                <>
                  <Send size={18} />
                  Send Message
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ContactMobile
