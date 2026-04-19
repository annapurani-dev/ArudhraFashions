import { useState, useEffect } from 'react'
import { Mail, Phone, MapPin, Clock, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { contactAPI, settingsAPI } from '../utils/api'
import { useToast } from '../components/Toast/ToastContainer'

function ContactWeb() {
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
    <div className="contact-page">
      <div className="container">
        <button onClick={() => navigate(-1)} className="back-button">
          <ArrowLeft size={20} />
          Back
        </button>

        <div className="page-header">
          <h1>Contact Us</h1>
          <p>We'd love to hear from you. Get in touch with us!</p>
        </div>

        {submitted && (
          <div className="alert alert-success">
            Thank you! Your message has been sent successfully. We'll get back to you soon.
          </div>
        )}

        <div className="contact-layout">
          <div className="contact-info">
            <div className="info-card">
              <div className="info-icon">
                <Mail size={24} />
              </div>
              <h3>Email Us</h3>
              {contactInfo.email && <p>{contactInfo.email}</p>}
              {contactInfo.email2 && <p>{contactInfo.email2}</p>}
            </div>

            <div className="info-card">
              <div className="info-icon">
                <Phone size={24} />
              </div>
              <h3>Call Us</h3>
              {contactInfo.phone && <p>{contactInfo.phone}</p>}
              {contactInfo.phone2 && <p>{contactInfo.phone2}</p>}
              {contactInfo.phoneHours && <p className="info-note">{contactInfo.phoneHours}</p>}
            </div>

            <div className="info-card">
              <div className="info-icon">
                <MapPin size={24} />
              </div>
              <h3>Visit Us</h3>
              {contactInfo.address && contactInfo.address.split('\n').map((line, idx) => (
                <p key={idx}>{line}</p>
              ))}
            </div>

            <div className="info-card">
              <div className="info-icon">
                <Clock size={24} />
              </div>
              <h3>Business Hours</h3>
              {contactInfo.hours && contactInfo.hours.split('\n').map((line, idx) => (
                <p key={idx}>{line}</p>
              ))}
            </div>
          </div>

          <div className="contact-form-wrapper">
            <form className="contact-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">Full Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Enter your name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="your.email@example.com"
                />
              </div>

              <div className="form-group">
                <label htmlFor="mobile">Mobile Number *</label>
                <input
                  type="tel"
                  id="mobile"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  required
                  placeholder="+91 98765 43210"
                />
              </div>

              <div className="form-group">
                <label htmlFor="subject">Subject *</label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  placeholder="What is this regarding?"
                />
              </div>

              <div className="form-group">
                <label htmlFor="message">Message *</label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows="6"
                  placeholder="Tell us how we can help you..."
                ></textarea>
              </div>

              <button type="submit" className="btn btn-primary btn-large" disabled={isSubmitting}>
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ContactWeb
