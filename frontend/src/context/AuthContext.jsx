import { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../utils/api'

const AuthContext = createContext()

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Load user from token on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = localStorage.getItem('token')
        const storedUser = (() => {
          try {
            return JSON.parse(localStorage.getItem('userSession') || 'null')
          } catch (e) {
            return null
          }
        })()

        // If we have a stored user session, optimistically set it so UI doesn't flash logged-out
        if (token && storedUser) {
          setUser(storedUser)
        }

        if (token) {
          try {
            const userData = await authAPI.getMe()
            setUser(userData)
            // Persist latest user session
            try {
              localStorage.setItem('userSession', JSON.stringify(userData))
            } catch (e) {
              // ignore storage errors
            }
          } catch (error) {
            console.error('Error loading user:', error)
            // If token is invalid (401) remove it; for network errors do not clear token so transient failures don't log the user out
            if (error && error.status === 401) {
              localStorage.removeItem('token')
              localStorage.removeItem('userSession')
              setUser(null)
            } else {
              // keep optimistic session if available; otherwise clear user
              if (!storedUser) setUser(null)
            }
          }
        }
      } catch (error) {
        console.error('Error in loadUser:', error)
      } finally {
        setLoading(false)
      }
    }
    loadUser()
  }, [])

  // Generate guest ID
  const getGuestId = () => {
    let guestId = localStorage.getItem('guestId')
    if (!guestId) {
      guestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem('guestId', guestId)
    }
    return guestId
  }

  // Register new user
  const register = async (mobile, password, name, email) => {
    try {
      const response = await authAPI.register(mobile, password, name, email)
      // Backend returns: { _id, mobile, name, email, token }
      const token = response.token
      // Store token
      if (token) {
        localStorage.setItem('token', token)
      }
      // Store user data (remove token from response)
      const { token: _, ...userData } = response
      setUser(userData)
      try {
        localStorage.setItem('userSession', JSON.stringify(userData))
      } catch (e) {
        // ignore
      }
      return userData
    } catch (error) {
      console.error('Registration error:', error)
      throw error
    }
  }

  // Login user (mobile or email)
  const login = async (mobile, email, password) => {
    try {
      const response = await authAPI.login(mobile, email, password)
      // Backend returns: { _id, mobile, name, email, token }
      const token = response.token
      // Store token
      if (token) {
        localStorage.setItem('token', token)
      }
      // Store user data (remove token from response)
      const { token: _, ...userData } = response
      setUser(userData)
      try {
        localStorage.setItem('userSession', JSON.stringify(userData))
      } catch (e) {
        // ignore
      }
      return userData
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  // Logout user
  const logout = () => {
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('userSession')
  }

  // Reset password
  const resetPassword = async (token, newPassword) => {
    try {
      await authAPI.resetPassword(token, newPassword)
    } catch (error) {
      console.error('Reset password error:', error)
      throw error
    }
  }

  // Update user profile
  const updateProfile = async (updates) => {
    if (!user) return

    try {
      const updatedUser = await authAPI.updateProfile(updates)
      setUser(updatedUser)
      return updatedUser
    } catch (error) {
      console.error('Update profile error:', error)
      throw error
    }
  }

  // Change password
  const changePassword = async (currentPassword, newPassword) => {
    if (!user) return

    try {
      await authAPI.changePassword(currentPassword, newPassword)
    } catch (error) {
      console.error('Change password error:', error)
      throw error
    }
  }

  // Merge guest cart with user cart (for use after login)
  const mergeCart = (guestCart) => {
    if (!user || !guestCart || guestCart.length === 0) return
    // This will be handled by the cart API when user logs in
    // For now, just return the guest cart to be merged by cart context
    return guestCart
  }

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    getGuestId,
    register,
    login,
    logout,
    resetPassword,
    updateProfile,
    changePassword,
    mergeCart
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

