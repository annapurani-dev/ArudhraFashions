import { Link } from 'react-router-dom'
import './ProductsIndex.css'

function ProductsIndexWeb({ categories, subcategoryImages }) {
  return (
    <div className="products-index-web">
      <div className="products-index-header">
        <h1>Categories</h1>
      </div>

      <div className="categories-list-web-new">
        {categories.map(cat => {
          const catSlug = cat.slug || (cat.name || '').toLowerCase()
          const subcats = cat.subcategories || []
          return (
            <div key={catSlug} className="category-section-web-new">
              {/* Row 1 - Category title with View All button */}
              <div className="category-header-web-new">
                <h2 className="category-title-web-new">{cat.name}</h2>
                <Link to={`/products/${catSlug}`} className="btn btn-outline btn-small view-all-btn-web-new">
                  View All
                </Link>
              </div>

              {/* Row 2 - Subcategories as bubble/pill boxes with images */}
              <div className="subcategories-bubbles-web-new">
                {subcats.length > 0 ? (
                  subcats.map(sub => {
                    const subSlug = sub.slug || (sub.name || '').toLowerCase()
                    const imageKey = `${catSlug}_${subSlug}`
                    const imageUrl = subcategoryImages[imageKey]
                    return (
                      <Link 
                        key={subSlug} 
                        to={`/products/${catSlug}/${subSlug}`} 
                        className="btn btn-outline subcategory-bubble-web-new"
                      >
                        <div className="subcategory-bubble-image-web-new">
                          {imageUrl ? (
                            <img src={imageUrl} alt={sub.name} loading="lazy" />
                          ) : (
                            <div className="subcategory-bubble-placeholder-web-new">
                              {sub.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <span className="subcategory-bubble-name-web-new">{sub.name}</span>
                      </Link>
                    )
                  })
                ) : (
                  <div className="no-subcategories-web-new">No subcategories</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default ProductsIndexWeb

