import dotenv from 'dotenv'
import Category from '../models/Category.js'
import Subcategory from '../models/Subcategory.js'
import connectDB from '../config/db.js'

dotenv.config()

const categoriesData = [
  {
    name: 'Women',
    slug: 'women',
    description: 'Elegant fashion for women',
    position: 1,
    subcategories: [
      { name: 'Dresses', slug: 'dresses', position: 1 },
      { name: 'Tops', slug: 'tops', position: 2 },
      { name: 'Bottoms', slug: 'bottoms', position: 3 },
      { name: 'Outerwear', slug: 'outerwear', position: 4 },
      { name: 'Accessories', slug: 'accessories', position: 5 }
    ]
  },
  {
    name: 'Teen',
    slug: 'teen',
    description: 'Trendy fashion for teens',
    position: 2,
    subcategories: [
      { name: 'Dresses', slug: 'dresses', position: 1 },
      { name: 'Tops', slug: 'tops', position: 2 },
      { name: 'Bottoms', slug: 'bottoms', position: 3 },
      { name: 'Outerwear', slug: 'outerwear', position: 4 },
      { name: 'Accessories', slug: 'accessories', position: 5 }
    ]
  },
  {
    name: 'Girls',
    slug: 'girls',
    description: 'Beautiful fashion for little girls',
    position: 3,
    subcategories: [
      { name: 'Dresses', slug: 'dresses', position: 1 },
      { name: 'Tops', slug: 'tops', position: 2 },
      { name: 'Bottoms', slug: 'bottoms', position: 3 },
      { name: 'Outerwear', slug: 'outerwear', position: 4 },
      { name: 'Accessories', slug: 'accessories', position: 5 }
    ]
  }
]

const seedCategories = async () => {
  try {
    await connectDB()
    console.log('Seeding categories and subcategories...')

    // Clear existing data (optional - comment out if you want to keep existing)
    // await Subcategory.destroy({ where: {} })
    // await Category.destroy({ where: {} })

    const categoryMap = {}

    for (const catData of categoriesData) {
      // Check if category already exists
      let category = await Category.findOne({ where: { slug: catData.slug } })
      
      if (!category) {
        category = await Category.create({
          name: catData.name,
          slug: catData.slug,
          description: catData.description,
          position: catData.position,
          isActive: true
        })
        console.log(`Created category: ${category.name}`)
      } else {
        console.log(`Category already exists: ${category.name}`)
      }

      categoryMap[catData.name] = category

      // Create subcategories
      for (const subcatData of catData.subcategories) {
        const existingSubcat = await Subcategory.findOne({
          where: {
            categoryId: category.id,
            slug: subcatData.slug
          }
        })

        if (!existingSubcat) {
          await Subcategory.create({
            categoryId: category.id,
            name: subcatData.name,
            slug: subcatData.slug,
            position: subcatData.position,
            isActive: true
          })
          console.log(`  Created subcategory: ${subcatData.name} under ${category.name}`)
        } else {
          console.log(`  Subcategory already exists: ${subcatData.name} under ${category.name}`)
        }
      }
    }

    console.log('Categories and subcategories seeded successfully!')
    console.log('\nCategory mapping for product seeding:')
    console.log(JSON.stringify(categoryMap, null, 2))
    
    process.exit(0)
  } catch (error) {
    console.error('Error seeding categories:', error)
    process.exit(1)
  }
}

seedCategories()
