import { Link } from 'react-router-dom'
import './ProductsIndex.css'

function ProductsIndexMobile({ categories, subcategoryImages }) {
  return (
    <div className="products-index-mobile">
      <div className="products-index-header-mobile">
        <h1>Categories</h1>
      </div>

      <div className="categories-list-mobile-new">
        {categories.map(cat => {
          const catSlug = cat.slug || (cat.name || '').toLowerCase()
          const subcats = cat.subcategories || []
          return (
            <div key={catSlug} className="category-section-mobile-new">
              {/* Row 1 - Category title with View All button */}
              <div className="category-header-mobile-new">
                <h2 className="category-title-mobile-new">{cat.name}</h2>
                <Link to={`/products/${catSlug}`} className="btn btn-outline btn-small view-all-btn-mobile-new">
                  View All
                </Link>
              </div>

              {/* Row 2 - Subcategories as bubble/pill boxes with images */}
              <div className="subcategories-bubbles-mobile-new">
                {subcats.length > 0 ? (
                  subcats.map(sub => {
                    const subSlug = sub.slug || (sub.name || '').toLowerCase()
                    const imageKey = `${catSlug}_${subSlug}`
                    const imageUrl = subcategoryImages[imageKey]
                    return (
                      <Link 
                        key={subSlug} 
                        to={`/products/${catSlug}/${subSlug}`} 
                        className="btn btn-outline subcategory-bubble-mobile-new"
                      >
                        <div className="subcategory-bubble-image-mobile-new">
                          {imageUrl ? (
                            <img src={imageUrl} alt={sub.name} loading="lazy" />
                          ) : (
                            <div className="subcategory-bubble-placeholder-mobile-new">
                              {sub.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <span className="subcategory-bubble-name-mobile-new">{sub.name}</span>
                      </Link>
                    )
                  })
                ) : (
                  <div className="no-subcategories-mobile-new">No subcategories</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default ProductsIndexMobile

