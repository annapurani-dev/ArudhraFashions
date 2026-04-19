import { useState, useEffect } from 'react'
import { Search, Edit, Mail, Eye, X, Plus, Info, Copy, Settings, Trash2 } from 'lucide-react'
import { useToast } from '../../components/Toast/ToastContainer'
import { adminEmailTemplatesAPI } from '../../utils/adminApi'

// Default variables for each template type
const DEFAULT_VARIABLES = {
  order_confirmation: [
    { name: 'orderNumber', label: 'Order Number', description: 'Order ID/Number' },
    { name: 'customerName', label: 'Customer Name', description: 'Full name of customer' },
    { name: 'orderDate', label: 'Order Date', description: 'Date of order' },
    { name: 'orderTotal', label: 'Order Total', description: 'Total amount' },
    { name: 'orderItems', label: 'Order Items', description: 'List of ordered items' },
    { name: 'shippingAddress', label: 'Shipping Address', description: 'Delivery address' }
  ],
  shipping_notification: [
    { name: 'orderNumber', label: 'Order Number', description: 'Order ID/Number' },
    { name: 'customerName', label: 'Customer Name', description: 'Full name of customer' },
    { name: 'trackingNumber', label: 'Tracking Number', description: 'Shipping tracking code' },
    { name: 'carrier', label: 'Carrier', description: 'Shipping carrier name' },
    { name: 'estimatedDelivery', label: 'Estimated Delivery', description: 'Expected delivery date' }
  ],
  order_cancelled: [
    { name: 'orderNumber', label: 'Order Number', description: 'Order ID/Number' },
    { name: 'customerName', label: 'Customer Name', description: 'Full name of customer' },
    { name: 'cancellationReason', label: 'Cancellation Reason', description: 'Reason for cancellation' },
    { name: 'refundAmount', label: 'Refund Amount', description: 'Amount to be refunded' }
  ],
  password_reset: [
    { name: 'customerName', label: 'Customer Name', description: 'Full name of customer' },
    { name: 'resetLink', label: 'Reset Link', description: 'Password reset URL' },
    { name: 'expiryTime', label: 'Expiry Time', description: 'Link expiration time' }
  ],
  welcome: [
    { name: 'customerName', label: 'Customer Name', description: 'Full name of customer' },
    { name: 'signupDate', label: 'Signup Date', description: 'Account creation date' }
  ],
  promotional: [
    { name: 'customerName', label: 'Customer Name', description: 'Full name of customer' },
    { name: 'discountCode', label: 'Discount Code', description: 'Promo code' },
    { name: 'discountPercent', label: 'Discount Percent', description: 'Discount percentage' },
    { name: 'validUntil', label: 'Valid Until', description: 'Offer expiration date' }
  ],
  reminder: [
    { name: 'customerName', label: 'Customer Name', description: 'Full name of customer' },
    { name: 'reminderMessage', label: 'Reminder Message', description: 'Reminder content' },
    { name: 'actionLink', label: 'Action Link', description: 'Link to take action' }
  ]
}

// Default template types
const DEFAULT_TEMPLATE_TYPES = [
  { value: 'order_confirmation', label: 'Order Confirmation' },
  { value: 'shipping_notification', label: 'Shipping Notification' },
  { value: 'order_cancelled', label: 'Order Cancelled' },
  { value: 'password_reset', label: 'Password Reset' },
  { value: 'welcome', label: 'Welcome' },
  { value: 'promotional', label: 'Promotional' },
  { value: 'reminder', label: 'Reminder' }
]

function EmailTemplates() {
  const { success, error: showError } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [editingTemplate, setEditingTemplate] = useState(null)
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [showVariablesModal, setShowVariablesModal] = useState(false)
  const [showTypesModal, setShowTypesModal] = useState(false)
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [templateTypes, setTemplateTypes] = useState(() => {
    const saved = localStorage.getItem('templateTypes')
    if (saved) {
      return JSON.parse(saved)
    }
    // Initialize with defaults and save to localStorage
    localStorage.setItem('templateTypes', JSON.stringify(DEFAULT_TEMPLATE_TYPES))
    return DEFAULT_TEMPLATE_TYPES
  })
  const [templateVariables, setTemplateVariables] = useState(() => {
    const saved = localStorage.getItem('templateVariables')
    if (saved) {
      return JSON.parse(saved)
    }
    // Initialize with defaults and save to localStorage
    localStorage.setItem('templateVariables', JSON.stringify(DEFAULT_VARIABLES))
    return DEFAULT_VARIABLES
  })
  const [newVariable, setNewVariable] = useState({ name: '', label: '', description: '' })
  const [editingVariable, setEditingVariable] = useState(null)
  const [newType, setNewType] = useState({ value: '', label: '' })
  const [editingType, setEditingType] = useState(null)
  const [templateForm, setTemplateForm] = useState({
    name: '',
    type: '',
    subject: '',
    body: '',
    variables: []
  })

  useEffect(() => {
    loadTemplates()
  }, [typeFilter])

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      loadTemplates()
    }, 500)
    return () => clearTimeout(debounceTimer)
  }, [searchQuery])

  const loadTemplates = async () => {
    try {
      setLoading(true)
      const data = await adminEmailTemplatesAPI.getAll(typeFilter || undefined)
      setTemplates(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Error loading templates:', err)
      showError('Failed to load email templates')
    } finally {
      setLoading(false)
    }
  }

  const handleAddTemplate = () => {
    setEditingTemplate(null)
    setTemplateForm({
      name: '',
      type: '',
      subject: '',
      body: '',
      variables: []
    })
    setShowTemplateModal(true)
  }

  const handleSave = async () => {
    if (!templateForm.name || !templateForm.type || !templateForm.subject || !templateForm.body) {
      showError('Please fill in all required fields')
      return
    }
    

    try {
      setSaving(true)
      if (editingTemplate) {
        await adminEmailTemplatesAPI.update(editingTemplate.id, templateForm)
        success('Template updated successfully')
      } else {
        await adminEmailTemplatesAPI.create(templateForm)
        success('Template created successfully')
      }
      setEditingTemplate(null)
      setShowTemplateModal(false)
      setTemplateForm({ name: '', type: '', subject: '', body: '', variables: [] })
      await loadTemplates()
    } catch (err) {
      console.error('Error saving template:', err)
      showError(err.message || 'Failed to save template')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = async (template) => {
    try {
      const fullTemplate = await adminEmailTemplatesAPI.getById(template.id)
      setEditingTemplate(fullTemplate)
      setTemplateForm({
        name: fullTemplate.name || '',
        type: fullTemplate.type || '',
        subject: fullTemplate.subject || '',
        body: fullTemplate.body || '',
        variables: fullTemplate.variables || []
      })
      setShowTemplateModal(true)
    } catch (err) {
      showError('Failed to load template')
    }
  }

  // Get available variables for current template type
  const getAvailableVariables = () => {
    return templateVariables[templateForm.type] || []
  }

  // Insert variable into body at cursor position
  const insertVariable = (varName) => {
    const textarea = document.getElementById('template-body-textarea')
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const text = templateForm.body
      const before = text.substring(0, start)
      const after = text.substring(end)
      const newText = before + `{{${varName}}}` + after
      setTemplateForm({ ...templateForm, body: newText })
      
      // Set cursor position after inserted variable
      setTimeout(() => {
        textarea.focus()
        const newPos = start + `{{${varName}}}`.length
        textarea.setSelectionRange(newPos, newPos)
      }, 0)
    } else {
      // Fallback: append to end
      setTemplateForm({ ...templateForm, body: templateForm.body + `{{${varName}}}` })
    }
  }

  // Copy variable to clipboard
  const copyVariable = (varName) => {
    navigator.clipboard.writeText(`{{${varName}}}`)
    success(`Variable {{${varName}}} copied to clipboard`)
  }

  // Add or update variable
  const handleSaveVariable = () => {
    if (!newVariable.name || !newVariable.label || !templateForm.type) {
      showError('Please fill in variable name, label, and select a template type')
      return
    }
    
    const varName = newVariable.name.trim().replace(/\s+/g, '')
    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(varName)) {
      showError('Variable name must start with a letter and contain only letters, numbers, and underscores')
      return
    }

    const currentVars = templateVariables[templateForm.type] || []
    
    // Check if variable name already exists (excluding the one being edited)
    if (editingVariable) {
      const exists = currentVars.some((v, idx) => v.name === varName && idx !== editingVariable.index)
      if (exists) {
        showError('Variable name already exists')
        return
      }
    } else {
      const exists = currentVars.some(v => v.name === varName)
      if (exists) {
        showError('Variable name already exists')
        return
      }
    }

    const updated = {
      ...templateVariables,
      [templateForm.type]: editingVariable
        ? currentVars.map((v, idx) => idx === editingVariable.index 
            ? { name: varName, label: newVariable.label, description: newVariable.description }
            : v)
        : [...currentVars, { name: varName, label: newVariable.label, description: newVariable.description }]
    }
    setTemplateVariables(updated)
    localStorage.setItem('templateVariables', JSON.stringify(updated))
    setNewVariable({ name: '', label: '', description: '' })
    setEditingVariable(null)
    success(editingVariable ? 'Variable updated successfully' : 'Variable added successfully')
  }

  // Delete variable
  const handleDeleteVariable = (varIndex) => {
    if (!window.confirm('Are you sure you want to delete this variable?')) {
      return
    }

    const currentVars = templateVariables[templateForm.type] || []
    const updated = {
      ...templateVariables,
      [templateForm.type]: currentVars.filter((_, idx) => idx !== varIndex)
    }
    setTemplateVariables(updated)
    localStorage.setItem('templateVariables', JSON.stringify(updated))
    if (editingVariable && editingVariable.index === varIndex) {
      setEditingVariable(null)
      setNewVariable({ name: '', label: '', description: '' })
    }
    success('Variable deleted successfully')
  }

  // Edit variable
  const handleEditVariable = (variable, index) => {
    setEditingVariable({ variable, index })
    setNewVariable({
      name: variable.name,
      label: variable.label,
      description: variable.description || ''
    })
  }

  // Cancel editing variable
  const handleCancelEditVariable = () => {
    setEditingVariable(null)
    setNewVariable({ name: '', label: '', description: '' })
  }

  // Add or update template type
  const handleSaveType = () => {
    if (!newType.value || !newType.label) {
      showError('Please fill in both type value and label')
      return
    }
    
    const typeValue = newType.value.trim().toLowerCase().replace(/\s+/g, '_')
    
    // Check if type already exists (excluding the one being edited)
    if (editingType !== null) {
      const exists = templateTypes.some((t, idx) => t.value === typeValue && idx !== editingType)
      if (exists) {
        showError('Template type already exists')
        return
      }
    } else {
      const exists = templateTypes.some(t => t.value === typeValue)
      if (exists) {
        showError('Template type already exists')
        return
      }
    }

    const updated = editingType !== null
      ? templateTypes.map((t, idx) => idx === editingType 
          ? { value: typeValue, label: newType.label }
          : t)
      : [...templateTypes, { value: typeValue, label: newType.label }]
    
    setTemplateTypes(updated)
    localStorage.setItem('templateTypes', JSON.stringify(updated))
    setNewType({ value: '', label: '' })
    setEditingType(null)
    success(editingType !== null ? 'Template type updated successfully' : 'Template type added successfully')
  }

  // Delete template type
  const handleDeleteType = (typeIndex) => {
    const type = templateTypes[typeIndex]
    
    // Check if any templates are using this type
    const templatesUsingType = templates.filter(t => t.type === type.value)
    if (templatesUsingType.length > 0) {
      showError(`Cannot delete type "${type.label}" because ${templatesUsingType.length} template(s) are using it`)
      return
    }

    if (!window.confirm(`Are you sure you want to delete the template type "${type.label}"?`)) {
      return
    }

    const updated = templateTypes.filter((_, idx) => idx !== typeIndex)
    setTemplateTypes(updated)
    localStorage.setItem('templateTypes', JSON.stringify(updated))
    if (editingType === typeIndex) {
      setEditingType(null)
      setNewType({ value: '', label: '' })
    }
    success('Template type deleted successfully')
  }

  // Edit template type
  const handleEditType = (type, index) => {
    setEditingType(index)
    setNewType({
      value: type.value,
      label: type.label
    })
  }

  // Cancel editing type
  const handleCancelEditType = () => {
    setEditingType(null)
    setNewType({ value: '', label: '' })
  }

  const filteredTemplates = templates.filter(template =>
    (!searchQuery || 
    template.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.subject?.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>Email Templates</h1>
          <p>Manage email templates for order confirmations, notifications, and more</p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={handleAddTemplate}
        >
          <Plus size={18} />
          Add Template
        </button>
      </div>

      <div className="admin-toolbar">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select 
          className="filter-select"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="">All Types</option>
          {templateTypes.map(type => (
            <option key={type.value} value={type.value}>{type.label}</option>
          ))}
        </select>
        <button
          className="btn btn-outline"
          onClick={() => setShowTypesModal(true)}
          title="Manage Template Types"
        >
          <Settings size={16} />
          Types
        </button>
      </div>

      <div className="templates-list">
        {loading ? (
          <div className="loading-state">Loading templates...</div>
        ) : filteredTemplates.length === 0 ? (
          <div className="empty-state">No templates found</div>
        ) : (
          filteredTemplates.map(template => (
            <div key={template.id} className="template-card">
              <div className="template-header">
                <div>
                  <h3>{template.name}</h3>
                  <span className="template-type">{template.type}</span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <span className="template-channel">Email</span>
                  <button 
                    className="btn-icon" 
                    title="Edit"
                    onClick={() => handleEdit(template)}
                  >
                    <Edit size={16} />
                  </button>
                </div>
              </div>
              <div className="template-content">
                {template.subject && (
                  <p><strong>Subject:</strong> {template.subject}</p>
                )}
                <div className="template-body-preview">
                  {template.body?.substring(0, 150)}
                  {template.body?.length > 150 && '...'}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Template Modal */}
      {showTemplateModal && (
        <div className="modal-overlay" onClick={() => !saving && setShowTemplateModal(false)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingTemplate ? 'Edit Template' : 'Add Template'}</h2>
              <button 
                className="modal-close" 
                onClick={() => {
                  if (!saving) {
                    setShowTemplateModal(false)
                    setEditingTemplate(null)
      setTemplateForm({ name: '', type: '', subject: '', body: '', variables: [] })
                  }
                }}
                disabled={saving}
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Template Name *</label>
                <input
                  type="text"
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                  placeholder="Order Confirmation"
                  required
                  disabled={saving}
                />
              </div>
              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Type *</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <select
                      value={templateForm.type}
                      onChange={(e) => setTemplateForm({ ...templateForm, type: e.target.value })}
                      required
                      disabled={saving}
                      style={{ flex: 1 }}
                    >
                      <option value="">Select Type</option>
                      {templateTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => setShowTypesModal(true)}
                      disabled={saving}
                      title="Add Custom Type"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              </div>
              <div className="form-group">
                <label>Subject *</label>
                <input
                  type="text"
                  value={templateForm.subject}
                  onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })}
                  placeholder="Your order has been confirmed"
                  required
                  disabled={saving}
                />
              </div>
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label>Email Body *</label>
                  {templateForm.type && (
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => setShowVariablesModal(true)}
                      disabled={saving}
                      style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem' }}
                    >
                      <Info size={14} />
                      View Variables
                    </button>
                  )}
                </div>
                <textarea
                  id="template-body-textarea"
                  rows={15}
                  value={templateForm.body}
                  onChange={(e) => setTemplateForm({ ...templateForm, body: e.target.value })}
                  placeholder="Enter email template body. Use {{variable}} for dynamic content."
                  required
                  disabled={saving}
                />
                <small>Use variables like {'{{orderNumber}}'}, {'{{customerName}}'}, etc.</small>
                {templateForm.type && getAvailableVariables().length > 0 && (
                  <div className="variables-preview" style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'var(--bg-light)', borderRadius: '6px' }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                      Available Variables:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {getAvailableVariables().map((variable, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className="variable-tag"
                          onClick={() => insertVariable(variable.name)}
                          disabled={saving}
                          title={variable.description || variable.label}
                        >
                          {`{{${variable.name}}}`}
                          <Copy size={12} style={{ marginLeft: '0.25rem' }} />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-outline" 
                onClick={() => {
                  if (!saving) {
                    setShowTemplateModal(false)
                    setEditingTemplate(null)
                    setTemplateForm({ name: '', type: '', subject: '', body: '', variables: [] })
                  }
                }}
                disabled={saving}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Saving...' : editingTemplate ? 'Update' : 'Create'} Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Variables Management Modal */}
      {showVariablesModal && (
        <div className="modal-overlay" onClick={() => setShowVariablesModal(false)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Manage Variables</h2>
              <button 
                className="modal-close" 
                onClick={() => setShowVariablesModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              {templateForm.type ? (
                <>
                  <div className="form-group">
                    <label>Template Type</label>
                    <input
                      type="text"
                      value={templateTypes.find(t => t.value === templateForm.type)?.label || templateForm.type}
                      disabled
                      style={{ background: 'var(--bg-light)' }}
                    />
                  </div>
                  
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>Available Variables</h3>
                    <div className="variables-list">
                      {getAvailableVariables().map((variable, idx) => (
                        <div key={idx} className="variable-item">
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                              <code style={{ background: 'var(--bg-light)', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.875rem' }}>
                                {`{{${variable.name}}}`}
                              </code>
                              <button
                                type="button"
                                className="btn-icon-small"
                                onClick={() => copyVariable(variable.name)}
                                title="Copy to clipboard"
                              >
                                <Copy size={14} />
                              </button>
                              <button
                                type="button"
                                className="btn-icon-small"
                                onClick={() => insertVariable(variable.name)}
                                title="Insert into template"
                              >
                                <Plus size={14} />
                              </button>
                              <button
                                type="button"
                                className="btn-icon-small"
                                onClick={() => handleEditVariable(variable, idx)}
                                title="Edit variable"
                              >
                                <Edit size={14} />
                              </button>
                              <button
                                type="button"
                                className="btn-icon-small btn-icon-danger"
                                onClick={() => handleDeleteVariable(idx)}
                                title="Delete variable"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                              {variable.label}
                            </div>
                            {variable.description && (
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                                {variable.description}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
                    <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>
                      {editingVariable ? 'Edit Variable' : 'Add Variable'}
                    </h3>
                    <div className="form-group">
                      <label>Variable Name *</label>
                      <input
                        type="text"
                        value={newVariable.name}
                        onChange={(e) => setNewVariable({ ...newVariable, name: e.target.value })}
                        placeholder="orderStatus"
                        style={{ fontFamily: 'monospace' }}
                        disabled={editingVariable !== null}
                      />
                      <small>Use camelCase (e.g., orderStatus, customerEmail)</small>
                    </div>
                    <div className="form-group">
                      <label>Variable Label *</label>
                      <input
                        type="text"
                        value={newVariable.label}
                        onChange={(e) => setNewVariable({ ...newVariable, label: e.target.value })}
                        placeholder="Order Status"
                      />
                    </div>
                    <div className="form-group">
                      <label>Description</label>
                      <input
                        type="text"
                        value={newVariable.description}
                        onChange={(e) => setNewVariable({ ...newVariable, description: e.target.value })}
                        placeholder="Current status of the order"
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={handleSaveVariable}
                      >
                        {editingVariable ? <><Edit size={16} /> Update</> : <><Plus size={16} /> Add</>} Variable
                      </button>
                      {editingVariable && (
                        <button
                          type="button"
                          className="btn btn-outline"
                          onClick={handleCancelEditVariable}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <p>Please select a template type first to view available variables.</p>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-outline" 
                onClick={() => setShowVariablesModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Template Types Management Modal */}
      {showTypesModal && (
        <div className="modal-overlay" onClick={() => setShowTypesModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Manage Template Types</h2>
              <button 
                className="modal-close" 
                onClick={() => setShowTypesModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>Existing Types</h3>
                <div className="template-types-list">
                  {templateTypes.map((type, idx) => (
                    <div key={idx} className="template-type-item">
                      <div>
                        <strong>{type.label}</strong>
                        <code style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {type.value}
                        </code>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          type="button"
                          className="btn-icon-small"
                          onClick={() => handleEditType(type, idx)}
                          title="Edit type"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          type="button"
                          className="btn-icon-small btn-icon-danger"
                          onClick={() => handleDeleteType(idx)}
                          title="Delete type"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>
                  {editingType !== null ? 'Edit Type' : 'Add New Type'}
                </h3>
                <div className="form-group">
                  <label>Type Label *</label>
                  <input
                    type="text"
                    value={newType.label}
                    onChange={(e) => setNewType({ ...newType, label: e.target.value })}
                    placeholder="Payment Reminder"
                  />
                </div>
                <div className="form-group">
                  <label>Type Value *</label>
                  <input
                    type="text"
                    value={newType.value}
                    onChange={(e) => setNewType({ ...newType, value: e.target.value })}
                    placeholder="payment_reminder"
                    style={{ fontFamily: 'monospace' }}
                    disabled={editingType !== null}
                  />
                  <small>Use lowercase with underscores (e.g., payment_reminder)</small>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleSaveType}
                  >
                    {editingType !== null ? <><Edit size={16} /> Update</> : <><Plus size={16} /> Add</>} Type
                  </button>
                  {editingType !== null && (
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={handleCancelEditType}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-outline" 
                onClick={() => setShowTypesModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EmailTemplates
