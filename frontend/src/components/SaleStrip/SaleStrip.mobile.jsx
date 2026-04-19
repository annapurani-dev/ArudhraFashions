import { useState, useEffect, useRef } from 'react'
import { saleStripAPI } from '../../utils/api'

function SaleStripMobile() {
  const [saleStrips, setSaleStrips] = useState([])
  const [currentSaleStripIndex, setCurrentSaleStripIndex] = useState(0)
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  const saleStripIntervalRef = useRef(null)

  useEffect(() => {
    loadSaleStrips()

    return () => {
      if (saleStripIntervalRef.current) {
        clearInterval(saleStripIntervalRef.current)
      }
    }
  }, [])

  const loadSaleStrips = async () => {
    try {
      const saleStripData = await saleStripAPI.getActive()
      if (Array.isArray(saleStripData) && saleStripData.length > 0) {
        setSaleStrips(saleStripData)
        setCurrentSaleStripIndex(0)
      } else {
        setSaleStrips([])
      }
    } catch (error) {
      console.error('Error loading sale strips:', error)
      setSaleStrips([])
    }
  }

  // Auto-rotate sale strips
  useEffect(() => {
    if (saleStrips.length <= 1) {
      return
    }

    if (saleStripIntervalRef.current) {
      clearInterval(saleStripIntervalRef.current)
    }

    saleStripIntervalRef.current = setInterval(() => {
      setCurrentSaleStripIndex((prev) => (prev + 1) % saleStrips.length)
    }, 5000) // Rotate every 5 seconds

    return () => {
      if (saleStripIntervalRef.current) {
        clearInterval(saleStripIntervalRef.current)
      }
    }
  }, [saleStrips.length])

  // Countdown timer for current sale strip
  useEffect(() => {
    if (saleStrips.length === 0 || !saleStrips[currentSaleStripIndex]) {
      return
    }

    const currentStrip = saleStrips[currentSaleStripIndex]

    const updateCountdown = () => {
      const now = new Date().getTime()
      const endDate = new Date(currentStrip.endDate).getTime()
      const difference = endDate - now

      if (difference <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 })
        // Remove expired sale strip
        setSaleStrips(prev => prev.filter((_, index) => index !== currentSaleStripIndex))
        if (currentSaleStripIndex >= saleStrips.length - 1) {
          setCurrentSaleStripIndex(0)
        }
        return
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24))
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((difference % (1000 * 60)) / 1000)

      setCountdown({ days, hours, minutes, seconds })
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)

    return () => clearInterval(interval)
  }, [saleStrips, currentSaleStripIndex])

  if (saleStrips.length === 0 || !saleStrips[currentSaleStripIndex]) {
    return null
  }

  const currentStrip = saleStrips[currentSaleStripIndex]
  
  // Check if countdown should be shown (only if endDate exists and is in the future)
  const showCountdown = currentStrip.endDate && new Date(currentStrip.endDate).getTime() > new Date().getTime()

  // For mobile: always use scrolling animation to ensure all content (including timer) is visible
  // This prevents content from being cut off
  const shouldScroll = true

  // Render all sale strips when multiple, or duplicate single one for seamless scroll
  const stripsToRender = saleStrips.length > 1 ? saleStrips : [currentStrip]

  return (
    <div className="sale-strip sale-strip-mobile">
      <div className={`sale-strip-scroll-wrapper ${shouldScroll ? 'scrolling' : 'centered'}`}>
        <div className={`sale-strip-scroll-content ${shouldScroll ? 'animate-scroll' : ''}`}>
          {stripsToRender.map((strip, index) => {
            const stripShowCountdown = strip.endDate && new Date(strip.endDate).getTime() > new Date().getTime()
            const stripCountdown = index === currentSaleStripIndex ? countdown : { days: 0, hours: 0, minutes: 0, seconds: 0 }
            
            return (
              <div key={strip.id || index} className="sale-strip-text-content">
                <span className="sale-strip-title">{strip.title}</span>
                {strip.description && (
                  <>
                    <span className="sale-strip-separator">•</span>
                    <span className="sale-strip-description">{strip.description}</span>
                  </>
                )}
                {strip.discount && (
                  <>
                    <span className="sale-strip-separator">•</span>
                    <span className="sale-strip-discount">{strip.discount}</span>
                  </>
                )}
                {stripShowCountdown && (
                  <>
                    <span className="sale-strip-separator">•</span>
                    <span className="sale-strip-countdown-inline">
                      {String(stripCountdown.days).padStart(2, '0')}d : {String(stripCountdown.hours).padStart(2, '0')}h : {String(stripCountdown.minutes).padStart(2, '0')}m : {String(stripCountdown.seconds).padStart(2, '0')}s
                    </span>
                  </>
                )}
              </div>
            )
          })}
          {/* Duplicate for seamless loop - always duplicate for smooth scrolling */}
          {stripsToRender.map((strip, index) => {
            const stripShowCountdown = strip.endDate && new Date(strip.endDate).getTime() > new Date().getTime()
            const stripCountdown = index === currentSaleStripIndex ? countdown : { days: 0, hours: 0, minutes: 0, seconds: 0 }
            
            return (
              <div key={`duplicate-${strip.id || index}`} className="sale-strip-text-content" aria-hidden="true">
                <span className="sale-strip-title">{strip.title}</span>
                {strip.description && (
                  <>
                    <span className="sale-strip-separator">•</span>
                    <span className="sale-strip-description">{strip.description}</span>
                  </>
                )}
                {strip.discount && (
                  <>
                    <span className="sale-strip-separator">•</span>
                    <span className="sale-strip-discount">{strip.discount}</span>
                  </>
                )}
                {stripShowCountdown && (
                  <>
                    <span className="sale-strip-separator">•</span>
                    <span className="sale-strip-countdown-inline">
                      {String(stripCountdown.days).padStart(2, '0')}d : {String(stripCountdown.hours).padStart(2, '0')}h : {String(stripCountdown.minutes).padStart(2, '0')}m : {String(stripCountdown.seconds).padStart(2, '0')}s
                    </span>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default SaleStripMobile
