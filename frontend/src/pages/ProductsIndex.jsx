import { useState, useEffect } from 'react'
import Loading from '../components/Loading/Loading'
import { productsAPI, getImageUrl } from '../utils/api'
import { useDevice } from '../hooks/useDevice'
import ProductsIndexWeb from './ProductsIndex.web'
import ProductsIndexMobile from './ProductsIndex.mobile'
import { ProductsIndexSkeleton } from '../components/Skeletons/PageSkeletons'

function ProductsIndex() {
  const [categories, setCategories] = useState([])
  const [subcategoryImages, setSubcategoryImages] = useState({}) // key: `${catSlug}_${subSlug}` -> imageUrl
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const isMobile = useDevice()

  useEffect(() => {
    let mounted = true
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const base = import.meta.env.VITE_API_URL || (import.meta.env.MODE === 'production' ? 'https://api.arudhrafashions.com/api' : 'http://localhost:5001/api')
        const res = await fetch(`${base}/categories`)
        const data = await res.json()
        if (!mounted) return
        const cats = Array.isArray(data) ? data : []
        setCategories(cats)

        // Fetch first product image for each subcategory
        const subcategoryPromises = []
        cats.forEach(cat => {
          const catName = cat.name
          const catSlug = cat.slug || catName.toLowerCase()
          const subcats = cat.subcategories || []
          
          subcats.forEach(sub => {
            const subName = sub.name
            const subSlug = sub.slug || subName.toLowerCase()
            // Fetch 1 product from this subcategory to get its image
            subcategoryPromises.push(
              productsAPI.getAll({ category: catName, subcategory: subName, limit: 1 })
                .then(resp => {
                  const product = resp.products?.[0]
                  const imageUrl = product ? getImageUrl(product.images?.[0] || product.image || '') : ''
                  return { 
                    key: `${catSlug}_${subSlug}`, 
                    imageUrl,
                    catSlug,
                    subSlug,
                    subName
                  }
                })
                .catch(() => ({ 
                  key: `${catSlug}_${subSlug}`, 
                  imageUrl: '',
                  catSlug,
                  subSlug,
                  subName
                }))
            )
          })
        })

        const subcategoryResults = await Promise.all(subcategoryPromises)
        if (!mounted) return
        
        const imgMap = {}
        subcategoryResults.forEach(result => {
          imgMap[result.key] = result.imageUrl
        })
        setSubcategoryImages(imgMap)
      } catch (err) {
        console.error('Failed to load categories or previews:', err)
        if (!mounted) return
        setError('Failed to load categories')
      } finally {
        if (!mounted) return
        setLoading(false)
      }
    }

    fetchData()
    return () => { mounted = false }
  }, [])

  if (loading) return <div className="products-index-page"><div className="container"><ProductsIndexSkeleton /></div></div>
  if (error) return <div className="products-index-page"><div className="container"><p className="error-message">{error}</p></div></div>

  return isMobile ? (
    <ProductsIndexMobile categories={categories} subcategoryImages={subcategoryImages} />
  ) : (
    <ProductsIndexWeb categories={categories} subcategoryImages={subcategoryImages} />
  )
}

export default ProductsIndex

