import { Link } from 'react-router-dom'
import { useState } from 'react'

function ProductThumb({ product, size = 72, label = '', forceFile = null }) {
  const productId = product?._id || product?.id
  const categoryNameRaw = (product?.category?.name || label || 'placeholder').trim()
  const categoryName = categoryNameRaw.replace(/\s+/g, ' ')

  // explicit filename mapping for known categories
  const mapping = {
    'Saree': ['Saree1.jpg', 'Saree2.jpg', 'Saree3.jpg'],
    'Chudidar': ['Chudidar1.png', 'Chudidar2.png', 'Chudidar3.png'],
    'Western Wear': ['Western Wear1.png', 'Western Wear2.png', 'Western Wear3.png']
  }

  const files = mapping[categoryName] || [`${categoryName}1.png`, `${categoryName}2.png`, `${categoryName}3.png`]
  const candidates = files.map(f => `/placeholder/${f}`)

  // deterministic pick based on product id
  const hash = productId ? Array.from(productId).reduce((s, c) => s + c.charCodeAt(0), 0) : Date.now()
  const startIdx = hash % candidates.length
  const initialSrc = forceFile ? `/placeholder/${forceFile}` : (candidates[startIdx] || candidates[0])

  const [src, setSrc] = useState(initialSrc)
  const [attempt, setAttempt] = useState(0)

  const makePlaceholderDataUrl = (letters, w = 120, h = 140) => {
    const bg = '#f6f3f2'
    const color = '#6b4b4b'
    const fontSize = Math.round(w / 2.8)
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'><rect width='100%' height='100%' fill='${bg}' rx='8' ry='8'/><text x='50%' y='50%' font-family='Arial, Helvetica, sans-serif' font-size='${fontSize}' fill='${color}' dominant-baseline='middle' text-anchor='middle'>${letters || ''}</text></svg>`
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
  }

  const initials = (() => {
    const text = product?.name || label || ''
    if (!text) return ''
    const parts = text.split(' ').filter(Boolean)
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase()
  })()

  // (no debug logs)

  const imgStyle = {
    width: size,
    height: Math.round(size * 1.25),
    objectFit: 'cover',
    borderRadius: 6,
    boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
    display: 'inline-block',
    background: '#f6f3f2',
    color: '#6b4b4b',
    fontWeight: 600,
    fontSize: Math.round(size / 2.7),
    lineHeight: `${Math.round(size * 1.25)}px`,
    textAlign: 'center'
  }
  const handleImgError = () => {
    // If a specific forceFile was provided, don't cycle — directly fallback to data URL
    if (forceFile) {
      setSrc(makePlaceholderDataUrl(initials, Math.round(size * 0.9), Math.round(size * 1.1)))
      return
    }
    // try next candidate
    const next = attempt + 1
    if (next < candidates.length) {
      const nextIdx = (startIdx + next) % candidates.length
      setSrc(candidates[nextIdx])
      setAttempt(next)
      return
    }
    // fallback to data url placeholder
    setSrc(makePlaceholderDataUrl(initials, Math.round(size * 0.9), Math.round(size * 1.1)))
  }

  return (
    <Link to={productId ? `/product/${productId}` : '#'} className="product-thumb-compact" title={product?.name || label} style={{ display: 'inline-block' }}>
      <img src={src} alt={product?.name || label} style={imgStyle} loading="lazy" onError={handleImgError} />
    </Link>
  )
}

export default ProductThumb

