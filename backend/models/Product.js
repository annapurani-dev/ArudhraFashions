import { DataTypes } from 'sequelize'
import { sequelize } from '../config/db.js'

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  categoryId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'categories',
      key: 'id'
    }
  },
  subcategoryId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'subcategories',
      key: 'id'
    }
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  originalPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  onSale: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  new: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  fullDescription: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  images: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: false,
    defaultValue: []
  },
  sizes: {
    type: DataTypes.ARRAY(DataTypes.ENUM('XS', 'S', 'M', 'L', 'XL', 'XXL')),
    defaultValue: [],
    allowNull: true
  },
  colors: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  inStock: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  inventory: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  rating: {
    type: DataTypes.DECIMAL(3, 1),
    defaultValue: 0,
    validate: {
      min: 0,
      max: 5
    }
  },
  reviews: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  brand: {
    type: DataTypes.STRING,
    defaultValue: 'Arudhra Fashions'
  },
  material: {
    type: DataTypes.STRING,
    allowNull: true
  },
  care: {
    type: DataTypes.STRING,
    allowNull: true
  },
  specifications: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  shippingInfo: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'products',
  timestamps: true,
  indexes: [
    {
      fields: ['categoryId', 'subcategoryId']
    },
    {
      fields: ['price']
    },
    {
      fields: ['name']
    }
  ]
})

export default Product
