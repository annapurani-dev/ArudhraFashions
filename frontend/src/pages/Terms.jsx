import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

function Terms() {
  const navigate = useNavigate()

  return (
    <div className="terms-page">
      <div className="container">
        <button onClick={() => navigate(-1)} className="back-button">
          <ArrowLeft size={20} />
          Back
        </button>

        <div className="page-header">
          <h1>Terms of Service</h1>
          <p>Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="policy-content">
          <section className="policy-section">
            <h2>1. Acceptance of Terms</h2>
            <p>By accessing and using Arudhra Fashions's website and services, you accept and agree to be bound by these Terms of Service. If you do not agree, please do not use our services.</p>
          </section>

          <section className="policy-section">
            <h2>2. Use of Website</h2>
            <h3>You agree to:</h3>
            <ul>
              <li>Use the website only for lawful purposes</li>
              <li>Provide accurate and complete information</li>
              <li>Maintain the security of your account</li>
              <li>Not use the website to transmit harmful code or viruses</li>
              <li>Not attempt to gain unauthorized access to our systems</li>
            </ul>
          </section>

          <section className="policy-section">
            <h2>3. Account Registration</h2>
            <ul>
              <li>You must be at least 18 years old to create an account</li>
              <li>You are responsible for maintaining account security</li>
              <li>You must provide accurate information</li>
              <li>One person or entity may not maintain more than one account</li>
              <li>We reserve the right to suspend or terminate accounts that violate these terms</li>
            </ul>
          </section>

          <section className="policy-section">
            <h2>4. Products and Pricing</h2>
            <ul>
              <li>We strive for accuracy in product descriptions and pricing</li>
              <li>Prices are subject to change without notice</li>
              <li>We reserve the right to refuse or cancel orders</li>
              <li>Product availability is subject to change</li>
              <li>Colors may vary due to screen settings</li>
            </ul>
          </section>

          <section className="policy-section">
            <h2>5. Orders and Payment</h2>
            <ul>
              <li>All orders are subject to acceptance and availability</li>
              <li>Payment must be received before order processing</li>
              <li>We accept various payment methods as listed on our website</li>
              <li>You agree to provide current and accurate payment information</li>
              <li>We reserve the right to cancel orders for suspected fraud</li>
            </ul>
          </section>

          <section className="policy-section">
            <h2>6. Shipping and Delivery</h2>
            <ul>
              <li>Shipping times are estimates, not guarantees</li>
              <li>We are not liable for delays caused by shipping carriers</li>
              <li>Risk of loss transfers to you upon delivery</li>
              <li>You are responsible for providing accurate shipping addresses</li>
            </ul>
          </section>

          <section className="policy-section">
            <h2>7. Returns and Refunds</h2>
            <p>Our return and refund policy is detailed on our Returns page. By making a purchase, you agree to our return policy terms.</p>
          </section>

          <section className="policy-section">
            <h2>8. Intellectual Property</h2>
            <ul>
              <li>All content on this website is owned by Arudhra Fashions</li>
              <li>You may not reproduce, distribute, or create derivative works without permission</li>
              <li>Trademarks and logos are our property</li>
              <li>User-generated content may be used by us for promotional purposes</li>
            </ul>
          </section>

          <section className="policy-section">
            <h2>9. Prohibited Uses</h2>
            <p>You may not use our website:</p>
            <ul>
              <li>For any unlawful purpose</li>
              <li>To violate any laws or regulations</li>
              <li>To infringe on intellectual property rights</li>
              <li>To transmit harmful or malicious code</li>
              <li>To collect user information without consent</li>
              <li>To impersonate others</li>
            </ul>
          </section>

          <section className="policy-section">
            <h2>10. Limitation of Liability</h2>
            <p>To the maximum extent permitted by law, Arudhra Fashions shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of our services.</p>
          </section>

          <section className="policy-section">
            <h2>11. Indemnification</h2>
            <p>You agree to indemnify and hold harmless Arudhra Fashions from any claims, damages, or expenses arising from your use of our services or violation of these terms.</p>
          </section>

          <section className="policy-section">
            <h2>12. Dispute Resolution</h2>
            <p>Any disputes arising from these terms shall be resolved through arbitration in accordance with Indian law. The arbitration shall take place in Mumbai, Maharashtra.</p>
          </section>

          <section className="policy-section">
            <h2>13. Changes to Terms</h2>
            <p>We reserve the right to modify these terms at any time. Continued use of our services after changes constitutes acceptance of the modified terms.</p>
          </section>

          <section className="policy-section">
            <h2>14. Contact Information</h2>
            <p>For questions about these Terms of Service, contact us:</p>
            <p><strong>Email:</strong> support@arudhrafashions.com</p>
            <p><strong>Phone:</strong> +91 98765 43210</p>
            <p><strong>Address:</strong> 123 Fashion Street, Mumbai, Maharashtra 400001, India</p>
          </section>
        </div>
      </div>
    </div>
  )
}

export default Terms

