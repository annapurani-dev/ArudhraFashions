import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { productsAPI, compareAPI } from '../utils/api'
import { useToast } from '../components/Toast/ToastContainer'
import { useDevice } from '../hooks/useDevice'
import CompareMobile from './Compare.mobile'
import CompareWeb from './Compare.web'

function Compare() {
  const { isAuthenticated } = useAuth()
  const { error: showError, success } = useToast()
  const isMobile = useDevice()
  const [compareItems, setCompareItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isAuthenticated) {
      loadCompareItems()
    } else {
      // For guests, use localStorage as fallback
      loadGuestCompareItems()
    }
  }, [isAuthenticated])

  const loadCompareItems = async () => {
    try {
      setLoading(true)
      const products = await compareAPI.getAll()
      setCompareItems(Array.isArray(products) ? products : [])
    } catch (err) {
      console.error('Failed to load compare items:', err)
      showError('Failed to load compare items')
      setCompareItems([])
    } finally {
      setLoading(false)
    }
  }

  const loadGuestCompareItems = async () => {
    try {
      setLoading(true)
      // Load compare items from localStorage for guests
      const compareIds = JSON.parse(localStorage.getItem('compareItems') || '[]')
      
      if (compareIds.length === 0) {
        setCompareItems([])
        setLoading(false)
        return
      }

      // Fetch product details for each compare item
      const productPromises = compareIds.map(id => 
        productsAPI.getById(id).catch(err => {
          console.error(`Failed to load product ${id}:`, err)
          return null
        })
      )
      
      const products = await Promise.all(productPromises)
      const validProducts = products.filter(p => p !== null)
      setCompareItems(validProducts)
    } catch (err) {
      console.error('Failed to load compare items:', err)
      showError('Failed to load compare items')
    } finally {
      setLoading(false)
    }
  }

  const removeFromCompare = async (id) => {
    // Optimistically update the UI first
    const previousItems = [...compareItems]
    setCompareItems(items => items.filter(item => {
      const itemId = item._id || item.id
      return itemId !== id
    }))
    
    // Dispatch event to update header count
    window.dispatchEvent(new Event('compareUpdated'))
    
    if (!isAuthenticated) {
      // For guests, use localStorage
      const compareIds = JSON.parse(localStorage.getItem('compareItems') || '[]')
      const updatedIds = compareIds.filter(itemId => itemId !== id)
      localStorage.setItem('compareItems', JSON.stringify(updatedIds))
      success('Removed from compare')
      return
    }

    try {
      // Remove from backend
      const result = await compareAPI.remove(id)
      // Update state with the returned list (in case backend filtered differently)
      if (Array.isArray(result)) {
        setCompareItems(result)
      }
      success('Removed from compare')
    } catch (err) {
      console.error('Failed to remove from compare:', err)
      const errorMessage = err.message || ''
      
      // Check if error is about list being empty or not found - this is acceptable
      // The product was successfully removed from UI, backend might have different state
      if (errorMessage.includes('not found') || 
          errorMessage.includes('empty') || 
          errorMessage.includes('404')) {
        // Product was removed successfully (or wasn't in list), which is fine
        success('Removed from compare')
      } else {
        // Revert the optimistic update only for real errors
        setCompareItems(previousItems)
        showError('Failed to remove from compare')
      }
    }
  }

  return isMobile ? (
    <CompareMobile
      compareItems={compareItems}
      loading={loading}
      removeFromCompare={removeFromCompare}
      isAuthenticated={isAuthenticated}
    />
  ) : (
    <CompareWeb
      compareItems={compareItems}
      loading={loading}
      removeFromCompare={removeFromCompare}
      isAuthenticated={isAuthenticated}
    />
  )
}

export default Compare

