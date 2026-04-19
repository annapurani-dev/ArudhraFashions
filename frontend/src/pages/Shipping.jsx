import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

function Shipping() {
  const navigate = useNavigate()

  return (
    <div className="shipping-page">
      <div className="container">
        <button onClick={() => navigate(-1)} className="back-button">
          <ArrowLeft size={20} />
          Back
        </button>

        <div className="page-header">
          <h1>Shipping Information</h1>
          <p>Everything you need to know about shipping your orders</p>
        </div>

        <div className="info-sections">
          <section className="info-section">
            <h2>Shipping Options</h2>
            <div className="shipping-options">
              <div className="shipping-option">
                <h3>Standard Shipping</h3>
                <p className="price">₹99 or FREE on orders over ₹2000</p>
                <p className="duration">5-7 business days</p>
                <p>Delivered via standard courier service. Tracking information will be provided via email.</p>
              </div>
              <div className="shipping-option">
                <h3>Express Shipping</h3>
                <p className="price">₹199</p>
                <p className="duration">2-3 business days</p>
                <p>Priority handling and faster delivery. Available for most locations in India.</p>
              </div>
              <div className="shipping-option">
                <h3>Same Day Delivery</h3>
                <p className="price">₹299</p>
                <p className="duration">Same day (select cities)</p>
                <p>Available in Mumbai, Delhi, Bangalore, and Chennai for orders placed before 12 PM.</p>
              </div>
            </div>
          </section>

          <section className="info-section">
            <h2>Shipping Locations</h2>
            <p>We currently ship to all major cities and towns across India. Shipping charges may vary based on location.</p>
            <p>For remote locations, delivery may take additional 2-3 business days.</p>
          </section>

          <section className="info-section">
            <h2>Order Processing</h2>
            <ul className="info-list">
              <li>Orders are processed within 1-2 business days</li>
              <li>You will receive an order confirmation email immediately after placing your order</li>
              <li>Once your order ships, you'll receive tracking information</li>
              <li>You can track your order status in your account dashboard</li>
            </ul>
          </section>

          <section className="info-section">
            <h2>Delivery Information</h2>
            <ul className="info-list">
              <li>Our delivery partners will attempt delivery during business hours (9 AM - 8 PM)</li>
              <li>You will receive email notifications about delivery attempts</li>
              <li>If you're not available, the package will be held at the nearest delivery center</li>
              <li>You can reschedule delivery or pick up from the delivery center</li>
            </ul>
          </section>

          <section className="info-section">
            <h2>International Shipping</h2>
            <p>Currently, we only ship within India. International shipping will be available soon. Stay tuned!</p>
          </section>

          <section className="info-section">
            <h2>Need Help?</h2>
            <p>If you have any questions about shipping, please contact our customer service team:</p>
            <p><strong>Email:</strong> support@arudhrafashions.com</p>
            <p><strong>Phone:</strong> +91 98765 43210</p>
          </section>
        </div>
      </div>
    </div>
  )
}

export default Shipping

