import { useState, useEffect, useRef } from 'react'
import { saleStripAPI } from '../../utils/api'

function SaleStripWeb() {
  const [saleStrips, setSaleStrips] = useState([])
  const [countdowns, setCountdowns] = useState({})

  useEffect(() => {
    loadSaleStrips()
  }, [])

  const loadSaleStrips = async () => {
    try {
      const saleStripData = await saleStripAPI.getActive()
      if (Array.isArray(saleStripData) && saleStripData.length > 0) {
        setSaleStrips(saleStripData)
      } else {
        setSaleStrips([])
      }
    } catch (error) {
      console.error('Error loading sale strips:', error)
      setSaleStrips([])
    }
  }

  // Update countdowns for all strips every second
  useEffect(() => {
    if (saleStrips.length === 0) return

    const updateCountdowns = () => {
      const newCountdowns = {}
      const now = new Date().getTime()
      
      saleStrips.forEach((strip, index) => {
        if (strip.endDate) {
          const endDate = new Date(strip.endDate).getTime()
          const difference = endDate - now
          
          if (difference > 0) {
            newCountdowns[index] = {
              days: Math.floor(difference / (1000 * 60 * 60 * 24)),
              hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
              minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
              seconds: Math.floor((difference % (1000 * 60)) / 1000)
            }
          } else {
            newCountdowns[index] = { days: 0, hours: 0, minutes: 0, seconds: 0 }
          }
        }
      })
      
      setCountdowns(newCountdowns)
    }

    updateCountdowns()
    const interval = setInterval(updateCountdowns, 1000)

    return () => clearInterval(interval)
  }, [saleStrips])

  if (saleStrips.length === 0) {
    return null
  }

  // Enable scrolling animation for all cases (even 1 or 2 strips) to match behavior
  const layoutMode = 'scrolling'

  // Render a single sale strip item
  const renderSaleStripItem = (strip, index, isDuplicate = false) => {
    const showCountdown = strip.endDate && new Date(strip.endDate).getTime() > new Date().getTime()
    const countdown = countdowns[index] || { days: 0, hours: 0, minutes: 0, seconds: 0 }

    return (
      <div key={isDuplicate ? `dup-${strip._id || strip.id || index}` : strip._id || strip.id || index} className="sale-strip-text-content">
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
        {showCountdown && (
          <>
            <span className="sale-strip-separator">•</span>
            <span className="sale-strip-countdown-inline">
              {String(countdown.days).padStart(2, '0')}d : {String(countdown.hours).padStart(2, '0')}h : {String(countdown.minutes).padStart(2, '0')}m : {String(countdown.seconds).padStart(2, '0')}s
            </span>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="sale-strip sale-strip-web">
      <div className={`sale-strip-scroll-wrapper sale-strip-layout-${layoutMode}`}>
        <div className={`sale-strip-scroll-content ${layoutMode === 'scrolling' ? 'animate-scroll' : ''}`}>
          {saleStrips.map((strip, index) => renderSaleStripItem(strip, index))}
          {/* Duplicate for seamless loop - only if scrolling */}
          {layoutMode === 'scrolling' && saleStrips.map((strip, index) => renderSaleStripItem(strip, index, true))}
        </div>
      </div>
    </div>
  )
}

export default SaleStripWeb
