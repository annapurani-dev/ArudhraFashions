import { useState, useEffect } from 'react'
import { Search, Mail, Phone, MessageSquare, CheckCircle, Clock, Eye, X } from 'lucide-react'
import { useToast } from '../../components/Toast/ToastContainer'
import { adminQueriesAPI } from '../../utils/adminApi'

const statusLabelMap = {
  new: 'New',
  'in-progress': 'In Progress',
  resolved: 'Resolved'
}

function Queries() {
  const { success, error: showError } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [queries, setQueries] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedQuery, setSelectedQuery] = useState(null)

  useEffect(() => {
    loadQueries()
  }, [statusFilter])

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      loadQueries()
    }, 500)
    return () => clearTimeout(debounceTimer)
  }, [searchQuery])

  const loadQueries = async () => {
    try {
      setLoading(true)
      const filters = {}
      if (statusFilter) filters.status = statusFilter
      if (searchQuery) filters.search = searchQuery
      const data = await adminQueriesAPI.getAll(filters)
      setQueries(data.queries || [])
    } catch (err) {
      console.error('Error loading queries:', err)
      showError('Failed to load queries')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (id, status) => {
    try {
      await adminQueriesAPI.updateStatus(id, status)
      await loadQueries()
      success('Query status updated')
    } catch (err) {
      showError('Failed to update query status')
    }
  }

  const handleReply = async (id, reply) => {
    try {
      await adminQueriesAPI.reply(id, reply)
      await loadQueries()
      setSelectedQuery(null)
      success('Reply sent successfully')
    } catch (err) {
      showError('Failed to send reply')
    }
  }

  const filteredQueries = queries.filter(query =>
    !searchQuery || 
    query.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    query.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    query.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    query.message?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getStatusIcon = (status) => {
    switch (status) {
      case 'resolved':
        return <CheckCircle size={16} className="text-success" />
      case 'in-progress':
        return <Clock size={16} className="text-warning" />
      default:
        return <MessageSquare size={16} />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'resolved':
        return 'status-success'
      case 'in-progress':
        return 'status-warning'
      default:
        return ''
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>Contact Queries</h1>
          <p>Manage customer inquiries and support requests</p>
        </div>
      </div>

      <div className="admin-toolbar">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search by name, email, or message..."
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
          <option value="new">New</option>
          <option value="in-progress">In Progress</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Contact</th>
              <th>Subject</th>
              <th>Message</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>
                  Loading queries...
                </td>
              </tr>
            ) : filteredQueries.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>
                  No queries found
                </td>
              </tr>
            ) : (
              filteredQueries.map(query => (
                <tr key={query.id}>
                  <td><strong>{query.name}</strong></td>
                  <td>
                    <div className="contact-info">
                      <p><Mail size={14} /> {query.email}</p>
                      {query.phone && (
                        <p className="text-muted"><Phone size={14} /> {query.phone}</p>
                      )}
                    </div>
                  </td>
                  <td>{query.subject}</td>
                  <td>
                    <div className="message-preview">
                      {query.message?.substring(0, 100)}
                      {query.message?.length > 100 && '...'}
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge ${getStatusColor(query.status)}`}>
                      {getStatusIcon(query.status)}
                      {statusLabelMap[query.status] || 'Unknown'}
                    </span>
                  </td>
                  <td>{new Date(query.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="table-actions">
                      <button
                        className="btn-icon"
                        title="View Details"
                        onClick={() => setSelectedQuery(query)}
                      >
                        <Eye size={16} />
                      </button>
                      {query.status !== 'resolved' && (
                        <button
                          className="btn-icon text-success"
                          title="Mark as Resolved"
                          onClick={() => handleUpdateStatus(query.id, 'resolved')}
                        >
                          <CheckCircle size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Query Details Modal */}
      {selectedQuery && (
        <div className="modal-overlay" onClick={() => setSelectedQuery(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Query Details</h2>
              <button 
                className="modal-close" 
                onClick={() => setSelectedQuery(null)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-group">
                <label>Name</label>
                <p>{selectedQuery.name}</p>
              </div>
              <div className="detail-group">
                <label>Email</label>
                <p><Mail size={14} /> {selectedQuery.email}</p>
              </div>
              {selectedQuery.phone && (
                <div className="detail-group">
                  <label>Phone</label>
                  <p><Phone size={14} /> {selectedQuery.phone}</p>
                </div>
              )}
              <div className="detail-group">
                <label>Subject</label>
                <p>{selectedQuery.subject}</p>
              </div>
              <div className="detail-group">
                <label>Message</label>
                <p className="message-full">{selectedQuery.message}</p>
              </div>
                <div className="detail-group">
                  <label>Status</label>
                  <span className={`status-badge ${getStatusColor(selectedQuery.status)}`}>
                    {getStatusIcon(selectedQuery.status)}
                    {statusLabelMap[selectedQuery.status] || 'Unknown'}
                  </span>
                </div>
              <div className="detail-group">
                <label>Date</label>
                <p>{new Date(selectedQuery.createdAt).toLocaleString()}</p>
              </div>
              {selectedQuery.reply && (
                <div className="detail-group">
                  <label>Reply</label>
                  <p className="reply-text">{selectedQuery.reply}</p>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-outline" 
                onClick={() => setSelectedQuery(null)}
              >
                Close
              </button>
              {selectedQuery.status !== 'resolved' && (
                <button
                  className="btn btn-success"
                  onClick={() => {
                    handleUpdateStatus(selectedQuery.id, 'resolved')
                    setSelectedQuery(null)
                  }}
                >
                  Mark as Resolved
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Queries
