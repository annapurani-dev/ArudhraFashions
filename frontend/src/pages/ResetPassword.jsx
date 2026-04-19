import { useEffect, useRef, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { authAPI } from '../utils/api'
import { useLoginModal } from '../context/LoginModalContext'
import { Eye, EyeOff } from 'lucide-react'

const ResetPassword = () => {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [status, setStatus] = useState({ type: '', message: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()
  const redirectTimer = useRef(null)
  const { openModal } = useLoginModal()

  const clearStatus = () => {
    if (status.message) {
      setStatus({ type: '', message: '' })
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!token) {
      setStatus({ type: 'error', message: 'Missing reset token. Please request a new link.' })
      return
    }

    if (newPassword.length < 8) {
      setStatus({ type: 'error', message: 'Password must be at least 8 characters.' })
      return
    }

    if (newPassword !== confirmPassword) {
      setStatus({ type: 'error', message: 'Passwords do not match.' })
      return
    }

    try {
      setIsSubmitting(true)
      await authAPI.resetPassword(token, newPassword)
      setStatus({
        type: 'success',
        message: 'Password reset successful. Redirecting to home…'
      })
    setNewPassword('')
    setConfirmPassword('')
      redirectTimer.current = setTimeout(() => {
        openModal('login')
        navigate('/')
      }, 2000)
    } catch (error) {
      setStatus({
        type: 'error',
        message: error?.message || 'Unable to reset password at this time.'
      })
    } finally {
    setIsSubmitting(false)
    }
  }

  const handleInputChange = (setter) => (event) => {
    setter(event.target.value)
    clearStatus()
  }

  const isFormDisabled = isSubmitting || !token

  useEffect(() => {
    return () => {
      if (redirectTimer.current) {
        clearTimeout(redirectTimer.current)
      }
    }
  }, [])

  return (
    <section className="reset-password-page">
      <div className="reset-password-card">
        <h1>Reset your password</h1>
        <p className="reset-password-subtitle">
          Enter a new password for your account. The link sent via email expires in one hour.
        </p>

        {!token && (
          <div className="reset-feedback error">
            The reset link appears to be invalid. Please request a new email to continue.
          </div>
        )}

        {status.message && (
          <div className={`reset-feedback ${status.type}`}>
            {status.message}
          </div>
        )}

        <form className="reset-password-form" onSubmit={handleSubmit}>
          <label htmlFor="newPassword">New password</label>
          <div className="reset-password-field">
            <input
              id="newPassword"
              type={showNewPassword ? 'text' : 'password'}
              value={newPassword}
              placeholder="At least 8 characters"
              minLength={8}
              onChange={handleInputChange(setNewPassword)}
              disabled={isFormDisabled}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowNewPassword(prev => !prev)}
              aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
            >
              {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <label htmlFor="confirmPassword">Confirm password</label>
          <div className="reset-password-field">
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              placeholder="Re-enter your password"
              minLength={8}
              onChange={handleInputChange(setConfirmPassword)}
              disabled={isFormDisabled}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowConfirmPassword(prev => !prev)}
              aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <button
            type="submit"
            className="btn primary"
            disabled={isFormDisabled}
            aria-busy={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Save new password'}
          </button>
        </form>
      </div>
    </section>
  )
}

export default ResetPassword
