import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useLocation } from 'react-router-dom'
import { X, Mail, Lock, Smartphone, User, Eye, EyeOff, UserPlus, LogIn, AlertCircle, ArrowLeft, CheckCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useAdminAuth } from '../context/AdminAuthContext'
import { useToast } from './Toast/ToastContainer'
import { authAPI } from '../utils/api'

function LoginModal({ isOpen, onClose, initialMode = 'login' }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { login: customerLogin, register, isAuthenticated: isCustomerAuth } = useAuth()
  const { login: adminLogin, isAuthenticated: isAdminAuth } = useAdminAuth()
  const { success, error: showError } = useToast()
  
  const [mode, setMode] = useState(initialMode)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotPasswordSent, setForgotPasswordSent] = useState(false)
  const [redirectPath, setRedirectPath] = useState(null)

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode)
      const stateRedirect = location.state?.redirectPath
      const currentPath = location.pathname
      
      if (stateRedirect) {
        setRedirectPath(stateRedirect)
      } else if (currentPath !== '/dashboard' && currentPath !== '/admin/dashboard') {
        setRedirectPath(currentPath)
      } else {
        setRedirectPath('/')
      }
    }
  }, [initialMode, isOpen, location])
  
  const [formData, setFormData] = useState({
    loginInput: '',
    password: '',
    confirmPassword: '',
    name: '',
    email: '',
    mobile: '',
    rememberMe: false,
    forgotPasswordInput: ''
  })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  useEffect(() => {
    if (isCustomerAuth || isAdminAuth) {
      onClose()
    }
  }, [isCustomerAuth, isAdminAuth, onClose])

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        loginInput: '',
        password: '',
        confirmPassword: '',
        name: '',
        email: '',
        mobile: '',
        rememberMe: false,
        forgotPasswordInput: ''
      })
      setError('')
      setShowPassword(false)
      setShowConfirmPassword(false)
      setShowForgotPassword(false)
      setForgotPasswordSent(false)
      setRedirectPath(null)
    } else {
      setFormData({
        loginInput: '',
        password: '',
        confirmPassword: '',
        name: '',
        email: '',
        mobile: '',
        rememberMe: false,
        forgotPasswordInput: ''
      })
      setError('')
      setShowPassword(false)
      setShowConfirmPassword(false)
      setShowForgotPassword(false)
      setForgotPasswordSent(false)
    }
  }, [isOpen])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    setError('')
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const input = formData.loginInput.trim()
      
      if (!input) {
        throw new Error('Please enter your email or mobile number')
      }

      if (!formData.password) {
        throw new Error('Please enter your password')
      }

      const isEmail = input.includes('@')
      const isMobile = /^[0-9]{10}$/.test(input)

      if (isEmail) {
        try {
          await adminLogin(input, formData.password)
          success('Admin login successful!')
          navigate('/admin/dashboard')
          onClose()
          return
        } catch (adminError) {
          try {
            await customerLogin(null, input, formData.password)
            success('Login successful! Welcome back!')
            navigate(redirectPath || '/')
            onClose()
            return
          } catch (customerError) {
            throw new Error('Invalid email or password')
          }
        }
      } else if (isMobile) {
        await customerLogin(input, null, formData.password)
        success('Login successful! Welcome back!')
        navigate(redirectPath || '/')
        onClose()
      } else {
        throw new Error('Please enter a valid email or 10-digit mobile number')
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.')
      showError(err.message || 'Login failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    const mobile = formData.mobile.trim()
    const email = formData.email.trim()

    if (!mobile || !email) {
      setError('Please provide both mobile number and email address')
      setIsLoading(false)
      return
    }

    if (mobile.length !== 10 || !/^[0-9]+$/.test(mobile)) {
      setError('Please enter a valid 10-digit mobile number')
      setIsLoading(false)
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address')
      setIsLoading(false)
      return
    }

    if (!formData.name || formData.name.trim().length === 0) {
      setError('Please enter your full name')
      setIsLoading(false)
      return
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters')
      setIsLoading(false)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    try {
      await register(
        mobile,
        formData.password,
        formData.name.trim(),
        email
      )
      success('Registration successful! Welcome to Arudhra Fashions!')
      navigate(redirectPath || '/')
      onClose()
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.')
      showError(err.message || 'Registration failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const emailInput = formData.forgotPasswordInput.trim()
      
      if (!emailInput) {
        throw new Error('Please enter your email address')
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput)) {
        throw new Error('Please enter a valid email address')
      }

      await authAPI.forgotPassword(emailInput)
      setForgotPasswordSent(true)
      success('Password reset instructions have been sent to your email address')
    } catch (err) {
      setError(err.message || 'Failed to send password reset. Please try again.')
      showError(err.message || 'Failed to send password reset. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e) => {
    if (showForgotPassword) {
      handleForgotPassword(e)
    } else if (mode === 'login') {
      handleLogin(e)
    } else {
      handleRegister(e)
    }
  }

  if (!isOpen) return null

  const modalContent = (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div 
        className={`auth-modal-card ${mode === 'register' ? 'register-mode' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="auth-modal-close" onClick={onClose} aria-label="Close">
          <X size={20} />
        </button>

        <div className="auth-modal-header">
          <h2>Arudhra Fashions</h2>
          <p>
            {showForgotPassword 
              ? 'Reset your password' 
              : mode === 'login' 
                ? 'Sign in to continue' 
                : 'Create your account'}
          </p>
        </div>

        {showForgotPassword && (
          <button
            type="button"
            className="auth-back-btn"
            onClick={() => {
              setShowForgotPassword(false)
              setForgotPasswordSent(false)
              setError('')
              setFormData(prev => ({ ...prev, forgotPasswordInput: '' }))
            }}
          >
            <ArrowLeft size={18} />
            Back to Sign In
          </button>
        )}

        {!showForgotPassword && (
          <div className="auth-modal-tabs">
            <button
              className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
              onClick={() => {
                setMode('login')
                setError('')
                setShowForgotPassword(false)
              }}
            >
              <LogIn size={18} />
              Sign In
            </button>
            <button
              className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
              onClick={() => {
                setMode('register')
                setError('')
                setShowForgotPassword(false)
              }}
            >
              <UserPlus size={18} />
              Register
            </button>
          </div>
        )}

        {error && (
          <div className="auth-modal-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form className="auth-modal-form" onSubmit={handleSubmit}>
          {showForgotPassword ? (
            <>
              {!forgotPasswordSent ? (
                <div className="auth-form-group">
                  <label htmlFor="forgot-password-input" className="auth-form-label">
                    <Mail size={18} />
                    Email Address
                  </label>
                  <div className="auth-input-wrapper">
                    <Mail className="auth-input-icon" size={18} />
                    <input
                      type="email"
                      id="forgot-password-input"
                      name="forgotPasswordInput"
                      className="auth-form-input"
                      value={formData.forgotPasswordInput}
                      onChange={handleChange}
                      placeholder="Enter your email address"
                      autoFocus
                      required
                    />
                  </div>
                </div>
              ) : (
              <div className="auth-success-message">
                <CheckCircle className="auth-success-icon" size={64} />
                <h3>Check Your Email</h3>
                <p>
                  We've sent password reset instructions to <strong>{formData.forgotPasswordInput}</strong>
                </p>
                <p style={{ fontSize: '0.85rem', fontStyle: 'italic', marginTop: '1rem' }}>
                  Please check your email inbox and follow the instructions to reset your password.
                </p>
                <button
                  type="button"
                  className="auth-submit-btn"
                  onClick={() => {
                    setShowForgotPassword(false)
                    setForgotPasswordSent(false)
                    setFormData(prev => ({ ...prev, forgotPasswordInput: '' }))
                  }}
                >
                  Back to Sign In
                </button>
              </div>
              )}
            </>
          ) : mode === 'login' ? (
            <>
              <div className="auth-form-group">
                <label htmlFor="login-input" className="auth-form-label">
                  <Smartphone size={18} />
                  Mobile Number/Email
                </label>
                <div className="auth-input-wrapper">
                  <Smartphone className="auth-input-icon" size={18} />
                  <input
                    type="text"
                    id="login-input"
                    name="loginInput"
                    className="auth-form-input"
                    value={formData.loginInput}
                    onChange={handleChange}
                    placeholder="Enter mobile number or email"
                    autoFocus
                  />
                </div>
              </div>

              <div className="auth-form-group">
                <label htmlFor="login-password" className="auth-form-label">
                  <Lock size={18} />
                  Password
                </label>
                <div className="auth-input-wrapper">
                  <Lock className="auth-input-icon" size={18} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="login-password"
                    name="password"
                    className="auth-form-input"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    className="auth-password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="auth-form-options">
                <label className="auth-checkbox-label">
                  <input
                    type="checkbox"
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleChange}
                  />
                  <span>Remember me</span>
                </label>
                <button
                  type="button"
                  className="auth-forgot-link"
                  onClick={() => {
                    setShowForgotPassword(true)
                    setError('')
                  }}
                >
                  Forgot Password?
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="auth-form-group">
                <label htmlFor="register-name" className="auth-form-label">
                  <User size={18} />
                  Full Name
                </label>
                <div className="auth-input-wrapper">
                  <User className="auth-input-icon" size={18} />
                  <input
                    type="text"
                    id="register-name"
                    name="name"
                    className="auth-form-input"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    required
                  />
                </div>
              </div>

              <div className="auth-form-group">
                <label htmlFor="register-mobile" className="auth-form-label">
                  <Smartphone size={18} />
                  Mobile Number
                </label>
                <div className="auth-input-wrapper">
                  <Smartphone className="auth-input-icon" size={18} />
                  <input
                    type="tel"
                    id="register-mobile"
                    name="mobile"
                    className="auth-form-input"
                    value={formData.mobile}
                    onChange={handleChange}
                    placeholder="Enter 10-digit mobile number"
                    maxLength="10"
                    pattern="[0-9]{10}"
                    required
                  />
                </div>
              </div>

              <div className="auth-form-group">
                <label htmlFor="register-email" className="auth-form-label">
                  <Mail size={18} />
                  Email Address
                </label>
                <div className="auth-input-wrapper">
                  <Mail className="auth-input-icon" size={18} />
                  <input
                    type="email"
                    id="register-email"
                    name="email"
                    className="auth-form-input"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    required
                  />
                </div>
                <p className="auth-form-hint">
                  Mobile number and email address are required to register.
                </p>
              </div>

              <div className="auth-form-group">
                <label htmlFor="register-password" className="auth-form-label">
                  <Lock size={18} />
                  Password
                </label>
                <div className="auth-input-wrapper">
                  <Lock className="auth-input-icon" size={18} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="register-password"
                    name="password"
                    className="auth-form-input"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter password (min 8 characters)"
                    required
                    minLength="8"
                  />
                  <button
                    type="button"
                    className="auth-password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="auth-form-group">
                <label htmlFor="register-confirm-password" className="auth-form-label">
                  <Lock size={18} />
                  Confirm Password
                </label>
                <div className="auth-input-wrapper">
                  <Lock className="auth-input-icon" size={18} />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="register-confirm-password"
                    name="confirmPassword"
                    className="auth-form-input"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm your password"
                    required
                  />
                  <button
                    type="button"
                    className="auth-password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </>
          )}

          {!forgotPasswordSent && (
            <button
              type="submit"
              className="auth-submit-btn"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="loading-dots"><span>.</span><span>.</span><span>.</span></span>
                  <span>{showForgotPassword ? 'Sending...' : mode === 'login' ? 'Signing In...' : 'Registering...'}</span>
                </>
              ) : (
                <>
                  {showForgotPassword ? (
                    <>
                      <Mail size={18} />
                      <span>Send Reset Link</span>
                    </>
                  ) : mode === 'login' ? (
                    <>
                      <LogIn size={18} />
                      <span>Sign In</span>
                    </>
                  ) : (
                    <>
                      <UserPlus size={18} />
                      <span>Create Account</span>
                    </>
                  )}
                </>
              )}
            </button>
          )}
        </form>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}

export default LoginModal
