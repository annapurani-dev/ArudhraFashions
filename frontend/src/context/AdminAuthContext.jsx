import { createContext, useContext, useState, useEffect } from 'react'
import { adminAuthAPI } from '../utils/adminApi'

const AdminAuthContext = createContext()

export function useAdminAuth() {
  const context = useContext(AdminAuthContext)
  if (!context) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider')
  }
  return context
}

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null)
  const [loading, setLoading] = useState(true)

  // Load admin session from localStorage
  useEffect(() => {
    const loadAdmin = async () => {
      try {
        const storedToken = localStorage.getItem('adminToken')
        const storedAdmin = localStorage.getItem('adminSession')
        
        if (storedToken && storedAdmin) {
          try {
            // Verify token is still valid by fetching admin info
            const adminData = await adminAuthAPI.getMe()
            setAdmin(adminData)
          } catch (error) {
            // Token invalid, clear storage
            console.error('Admin session invalid:', error)
            localStorage.removeItem('adminToken')
            localStorage.removeItem('adminSession')
            setAdmin(null)
          }
        }
      } catch (error) {
        console.error('Error in loadAdmin:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadAdmin()
  }, [])

  const login = async (email, password) => {
    try {
      const adminData = await adminAuthAPI.login(email, password)
      
      // Store token and admin data
      localStorage.setItem('adminToken', adminData.token)
      localStorage.setItem('adminSession', JSON.stringify({
        _id: adminData._id,
        email: adminData.email,
        name: adminData.name,
        role: adminData.role
      }))
      
      setAdmin({
        _id: adminData._id,
        email: adminData.email,
        name: adminData.name,
        role: adminData.role
      })
      
      return adminData
    } catch (error) {
      throw new Error(error.message || 'Invalid email or password')
    }
  }

  const logout = () => {
    setAdmin(null)
    localStorage.removeItem('adminToken')
    localStorage.removeItem('adminSession')
  }

  const value = {
    admin,
    loading,
    isAuthenticated: !!admin,
    login,
    logout
  }

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
}

