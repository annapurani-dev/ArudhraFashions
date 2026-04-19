import { useState, useEffect } from 'react'

/**
 * Hook to detect if the device is mobile or web
 * @returns {boolean} true if mobile (≤768px), false if web (>768px)
 */
export function useDevice() {
  const [isMobile, setIsMobile] = useState(() => {
    // Check on initial render
    if (typeof window !== 'undefined') {
      return window.innerWidth <= 768
    }
    return false
  })

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768)
    }

    window.addEventListener('resize', handleResize)
    
    // Check immediately in case window size changed before listener was added
    handleResize()

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return isMobile
}
