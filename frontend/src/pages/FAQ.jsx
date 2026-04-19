import { useState } from 'react'
import { ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

function FAQ() {
  const navigate = useNavigate()
  const [openIndex, setOpenIndex] = useState(null)

  const faqCategories = [
    {
      category: 'Orders & Shipping',
      questions: [
        {
          q: 'How long does shipping take?',
          a: 'Standard shipping takes 5-7 business days. Express shipping (2-3 business days) is available for an additional charge. Free shipping is available on orders over ₹2000.'
        },
        {
          q: 'What are the shipping charges?',
          a: 'Shipping charges vary based on location and order value. Orders above ₹2000 qualify for free shipping. Standard shipping costs ₹99, and express shipping costs ₹199.'
        },
        {
          q: 'Can I track my order?',
          a: 'Yes! Once your order is shipped, you will receive a tracking number via email. You can track your order in the "Track Order" section of your dashboard.'
        },
        {
          q: 'What if I receive a damaged item?',
          a: 'If you receive a damaged item, please contact us within 48 hours with photos. We will arrange for a replacement or full refund immediately.'
        }
      ]
    },
    {
      category: 'Returns & Exchanges',
      questions: [
        {
          q: 'What is your return policy?',
          a: 'You can return items within 7 days of delivery. Items must be unworn, unwashed, with tags attached, and in original packaging. Sale items are final sale unless defective.'
        },
        {
          q: 'How do I return an item?',
          a: 'Log into your account, go to "Orders", select the order, and click "Return Item". Follow the instructions to print the return label and send the item back.'
        },
        {
          q: 'How long do refunds take?',
          a: 'Once we receive your return, we process refunds within 5-7 business days. The refund will be credited to your original payment method.'
        },
        {
          q: 'Can I exchange an item for a different size?',
          a: 'Yes! You can exchange for a different size within 7 days of delivery. If the new size is unavailable, we will process a refund.'
        }
      ]
    },
    {
      category: 'Sizing & Fit',
      questions: [
        {
          q: 'How do I know my size?',
          a: 'Check our comprehensive Size Guide page for detailed measurements. We provide size charts for Women, Teen, and Girls categories with measurements in centimeters.'
        },
        {
          q: 'What if the size doesn\'t fit?',
          a: 'You can exchange for a different size within 7 days of delivery. If the size you need is unavailable, we\'ll process a full refund.'
        },
        {
          q: 'Do you offer size recommendations?',
          a: 'Yes! Our customer service team can help you find the perfect fit. Contact us with your measurements, and we\'ll recommend the best size for you.'
        }
      ]
    },
    {
      category: 'Payment & Security',
      questions: [
        {
          q: 'What payment methods do you accept?',
          a: 'We accept all major credit/debit cards, UPI, Net Banking, and Cash on Delivery (COD) for orders above ₹500.'
        },
        {
          q: 'Is my payment information secure?',
          a: 'Absolutely! We use industry-standard SSL encryption to protect your payment information. We never store your complete card details.'
        },
        {
          q: 'Can I pay in installments?',
          a: 'Yes, we offer EMI options through our payment partners for orders above ₹5000. Select the EMI option at checkout.'
        }
      ]
    },
    {
      category: 'Account & Profile',
      questions: [
        {
          q: 'How do I create an account?',
          a: 'Click "Create Account" in the header or footer, enter your mobile number, email, password, and name. We require both mobile and email to keep your account secure.'
        },
        {
          q: 'I forgot my password. How do I reset it?',
          a: 'Go to the Dashboard, click "Login", then "Forgot Password". Enter the email address linked to your account and follow the instructions we send to that email.'
        },
        {
          q: 'Can I shop without creating an account?',
          a: 'Yes! You can shop as a guest. However, creating an account allows you to track orders, save addresses, and access exclusive offers.'
        }
      ]
    }
  ]

  const toggleQuestion = (index) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <div className="faq-page">
      <div className="container">
        <button onClick={() => navigate(-1)} className="back-button">
          <ArrowLeft size={20} />
          Back
        </button>

        <div className="page-header">
          <h1>Frequently Asked Questions</h1>
          <p>Find answers to common questions about shopping at Arudhra Fashions</p>
        </div>

        <div className="faq-content">
          {faqCategories.map((category, catIndex) => (
            <div key={catIndex} className="faq-category">
              <h2 className="faq-category-title">{category.category}</h2>
              <div className="faq-list">
                {category.questions.map((item, index) => {
                  const questionIndex = `${catIndex}-${index}`
                  const isOpen = openIndex === questionIndex
                  return (
                    <div key={index} className="faq-item">
                      <button
                        className={`faq-question ${isOpen ? 'open' : ''}`}
                        onClick={() => toggleQuestion(questionIndex)}
                      >
                        <span>{item.q}</span>
                        {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </button>
                      {isOpen && (
                        <div className="faq-answer">
                          <p>{item.a}</p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="faq-footer">
          <p>Still have questions?</p>
          <a href="/contact" className="btn btn-primary">Contact Us</a>
        </div>
      </div>
    </div>
  )
}

export default FAQ

