import React from 'react'
import './loading.css'

function LoadingDots() {
  return (
    <span className="loading-dots" aria-hidden="true">
      <span>.</span><span>.</span><span>.</span>
    </span>
  )
}

export default function Loading({ variant = 'page', message = 'Loading...', count = 6 }) {
  if (variant === 'skeleton-grid') {
    return (
      <div className="skeleton-grid" role="status" aria-live="polite">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="skeleton-card shimmer">
            <div className="skeleton-image" />
            <div className="skeleton-lines">
              <div className="skeleton-line short" />
              <div className="skeleton-line medium" />
              <div className="skeleton-line long" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (variant === 'strip') {
    return (
      <div className="shimmer-strip-wrapper" role="status" aria-live="polite">
        <div className="shimmer-strip shimmer" />
        <div className="loading-text" style={{ marginTop: '0.75rem' }}>
          <span>{message}</span>
          <LoadingDots />
        </div>
      </div>
    )
  }

  // default: page / inline small
  return (
    <div className={`loading-block ${variant === 'small' ? 'small' : 'page'}`} role="status" aria-live="polite">
      <div className="loading-visual shimmer" />
      <div className="loading-text">
        <span>{message}</span>
        <LoadingDots />
      </div>
    </div>
  )
}

