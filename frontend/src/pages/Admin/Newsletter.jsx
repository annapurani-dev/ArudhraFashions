import { useState, useEffect } from 'react'
import { Search, Mail, Download, Trash2, Send, Users, X } from 'lucide-react'
import { useToast } from '../../components/Toast/ToastContainer'
import { adminNewsletterAPI } from '../../utils/adminApi'

function Newsletter() {
  const { success, error: showError } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showSendModal, setShowSendModal] = useState(false)
  const [subscribers, setSubscribers] = useState([])
  const [loading, setLoading] = useState(true)
  const [sendForm, setSendForm] = useState({ subject: '', content: '' })

  useEffect(() => {
    loadSubscribers()
  }, [statusFilter])

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      loadSubscribers()
    }, 500)
    return () => clearTimeout(debounceTimer)
  }, [searchQuery])

  const loadSubscribers = async () => {
    try {
      setLoading(true)
      const filters = {}
      if (statusFilter) filters.status = statusFilter
      if (searchQuery) filters.search = searchQuery
      const data = await adminNewsletterAPI.getSubscribers(filters)
      setSubscribers(data.subscribers || [])
    } catch (err) {
      console.error('Error loading subscribers:', err)
      showError('Failed to load subscribers')
    } finally {
      setLoading(false)
    }
  }


  const handleDelete = async (id) => {
    if (window.confirm('Remove this subscriber?')) {
      try {
        await adminNewsletterAPI.removeSubscriber(id)
        await loadSubscribers()
        success('Subscriber removed')
      } catch (err) {
        showError('Failed to remove subscriber')
      }
    }
  }

  const handleSendNewsletter = async () => {
    if (!sendForm.subject || !sendForm.content) {
      showError('Please fill in subject and content')
      return
    }
    try {
      await adminNewsletterAPI.send(sendForm.subject, sendForm.content)
      setShowSendModal(false)
      setSendForm({ subject: '', content: '' })
      success('Newsletter sent successfully')
    } catch (err) {
      showError('Failed to send newsletter')
    }
  }

  const handleExport = () => {
    const csv = [
      ['Email', 'Name', 'Subscribed At', 'Status'],
      ...subscribers.map(s => [s.email, s.name || '', s.subscribedAt, s.status])
    ].map(row => row.join(',')).join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `newsletter-subscribers-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    success('Subscribers exported successfully')
  }

  const activeSubscribers = subscribers.filter(s => s.status === 'active').length

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>Newsletter Subscribers</h1>
          <p>Manage newsletter subscribers and send campaigns</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-outline" onClick={handleExport}>
            <Download size={18} />
            Export CSV
          </button>
          <button className="btn btn-primary" onClick={() => setShowSendModal(true)}>
            <Send size={18} />
            Send Newsletter
          </button>
        </div>
      </div>

      <div className="newsletter-stats">
        <div className="stat-mini-card">
          <Users size={24} />
          <div>
            <h3>{subscribers.length}</h3>
            <p>Total Subscribers</p>
          </div>
        </div>
        <div className="stat-mini-card success">
          <Mail size={24} />
          <div>
            <h3>{activeSubscribers}</h3>
            <p>Active</p>
          </div>
        </div>
      </div>

      <div className="admin-toolbar">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search by email or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select 
          className="filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="unsubscribed">Unsubscribed</option>
        </select>
      </div>

      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Name</th>
              <th>Subscribed At</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" className="text-center">Loading...</td>
              </tr>
            ) : subscribers.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center">No subscribers found</td>
              </tr>
            ) : (
              subscribers.map(subscriber => (
              <tr key={subscriber.id}>
                <td>{subscriber.email}</td>
                <td>{subscriber.name || '-'}</td>
                <td>{new Date(subscriber.subscribedAt).toLocaleDateString()}</td>
                <td>
                  <span className={`status-badge status-${subscriber.status === 'active' ? 'active' : 'inactive'}`}>
                    {subscriber.status}
                  </span>
                </td>
                <td>
                  <button className="btn-icon danger" title="Remove" onClick={() => handleDelete(subscriber.id)}>
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Send Newsletter Modal */}
      {showSendModal && (
        <div className="modal-overlay" onClick={() => setShowSendModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Send Newsletter</h2>
              <button className="modal-close" onClick={() => setShowSendModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Subject *</label>
                <input 
                  type="text" 
                  placeholder="Newsletter Subject" 
                  value={sendForm.subject}
                  onChange={(e) => setSendForm({ ...sendForm, subject: e.target.value })}
                  required 
                />
              </div>
              <div className="form-group">
                <label>Message *</label>
                <textarea 
                  rows="10" 
                  placeholder="Enter newsletter content..." 
                  value={sendForm.content}
                  onChange={(e) => setSendForm({ ...sendForm, content: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Recipients</label>
                <p className="text-muted">Will be sent to {subscribers.filter(s => s.status === 'active').length} active subscribers</p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => {
                setShowSendModal(false)
                setSendForm({ subject: '', content: '' })
              }}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSendNewsletter}>Send Newsletter</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Newsletter

