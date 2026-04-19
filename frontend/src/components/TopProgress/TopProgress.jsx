import React, { useEffect, useState, useRef } from 'react'
import '../../components/Loading/loading.css'

export default function TopProgress() {
  const [visible, setVisible] = useState(false)
  const [percent, setPercent] = useState(0)
  const rafRef = useRef(null)

  useEffect(() => {
    let interval = null
    const onStart = () => {
      setVisible(true)
      setPercent(4)
      // slowly increase to 80%
      interval = setInterval(() => {
        setPercent(p => Math.min(80, p + Math.random() * 6))
      }, 400)
    }

    const onDone = () => {
      clearInterval(interval)
      setPercent(100)
      setTimeout(() => {
        setVisible(false)
        setPercent(0)
      }, 300)
    }

    window.addEventListener('topbar:start', onStart)
    window.addEventListener('topbar:done', onDone)

    return () => {
      window.removeEventListener('topbar:start', onStart)
      window.removeEventListener('topbar:done', onDone)
      clearInterval(interval)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  if (!visible) return null

  return (
    <div className="top-progress-container" aria-hidden="true">
      <div
        className="top-progress-bar"
        style={{ width: `${percent}%` }}
      />
    </div>
  )
}

