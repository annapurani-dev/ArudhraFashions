import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { cartAPI, compareAPI, wishlistAPI } from '../utils/api'

/**
 * Shared hook for header data (cart count, compare count, etc.)
 * Used by both web and mobile header components
 */
export function useHeaderData() {
  const { isAuthenticated } = useAuth()
  const [cartCount, setCartCount] = useState(0)
  const [compareCount, setCompareCount] = useState(0)
  const [wishlistCount, setWishlistCount] = useState(0)
  const [isSticky, setIsSticky] = useState(false)

  // Load cart count
  useEffect(() => {
    const loadCartCount = async () => {
      if (isAuthenticated) {
        try {
          const response = await cartAPI.get()
          console.log('Header cart response:', response) // Debug log
          
          // Handle different response structures
          let items = []
          if (Array.isArray(response)) {
            items = response
          } else if (response?.items) {
            items = Array.isArray(response.items) ? response.items : []
          } else if (response?.data?.items) {
            items = Array.isArray(response.data.items) ? response.data.items : []
          }
          
          const count = items.reduce((sum, item) => sum + (item.quantity || 1), 0)
          console.log('Cart count calculated:', count, 'from', items.length, 'items')
          setCartCount(count)
        } catch (err) {
          console.error('Failed to load cart count:', err)
        }
      } else {
        // Guest cart
        const guestCart = JSON.parse(localStorage.getItem('cart_guest') || '[]')
        const count = guestCart.reduce((sum, item) => sum + (item.quantity || 1), 0)
        setCartCount(count)
      }
    }
    loadCartCount()
    
    // Listen for cart updates
    const handleStorageChange = () => {
      if (!isAuthenticated) {
        const guestCart = JSON.parse(localStorage.getItem('cart_guest') || '[]')
        const count = guestCart.reduce((sum, item) => sum + (item.quantity || 1), 0)
        setCartCount(count)
      }
    }
    
    const handleCartUpdate = () => {
      loadCartCount()
    }
    
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('cartUpdated', handleCartUpdate)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('cartUpdated', handleCartUpdate)
    }
  }, [isAuthenticated])

  // Load compare count
  useEffect(() => {
    const loadCompareCount = async () => {
      if (isAuthenticated) {
        try {
          const response = await compareAPI.getCount()
          setCompareCount(response.count || 0)
        } catch (err) {
          console.error('Failed to load compare count:', err)
          setCompareCount(0)
        }
      } else {
        // For guests, use localStorage as fallback
        const compareIds = JSON.parse(localStorage.getItem('compareItems') || '[]')
        setCompareCount(compareIds.length)
      }
    }
    
    loadCompareCount()
    
    // Listen for compare updates
    const handleCompareUpdate = () => {
      loadCompareCount()
    }
    
    window.addEventListener('storage', handleCompareUpdate)
    window.addEventListener('compareUpdated', handleCompareUpdate)
    
    return () => {
      window.removeEventListener('storage', handleCompareUpdate)
      window.removeEventListener('compareUpdated', handleCompareUpdate)
    }
  }, [isAuthenticated])

  // Load wishlist count
  useEffect(() => {
    const loadWishlistCount = async () => {
      if (isAuthenticated) {
        try {
          const response = await wishlistAPI.getAll()
          let items = []
          if (Array.isArray(response)) {
            items = response
          } else if (response?.items) {
            items = Array.isArray(response.items) ? response.items : []
          }
          setWishlistCount(items.length)
        } catch (err) {
          console.error('Failed to load wishlist count:', err)
          setWishlistCount(0)
        }
      } else {
        // Guests: no wishlist stored on server; use 0 or localStorage fallback if implemented
        const guestWishlist = JSON.parse(localStorage.getItem('wishlist_guest') || '[]')
        setWishlistCount(guestWishlist.length)
      }
    }

    loadWishlistCount()

    const handleWishlistUpdate = () => {
      loadWishlistCount()
    }

    window.addEventListener('wishlistUpdated', handleWishlistUpdate)
    window.addEventListener('storage', handleWishlistUpdate)

    return () => {
      window.removeEventListener('wishlistUpdated', handleWishlistUpdate)
      window.removeEventListener('storage', handleWishlistUpdate)
    }
  }, [isAuthenticated])

  // Sticky header on scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return { cartCount, compareCount, wishlistCount, isSticky }
}
