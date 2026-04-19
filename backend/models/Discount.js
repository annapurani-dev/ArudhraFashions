import { DataTypes } from 'sequelize'
import { sequelize } from '../config/db.js'

const Discount = sequelize.define('Discount', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  code: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  instruction: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Instructions for applying discount (e.g., "Buy 2 Get 1 Free", "10% off on total", etc.)'
  },
  type: {
    type: DataTypes.ENUM('percentage', 'fixed', 'custom'),
    allowNull: false,
    defaultValue: 'percentage'
  },
  value: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  minOrder: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  maxDiscount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  usageLimit: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  used: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    defaultValue: 'active'
  }
}, {
  tableName: 'discounts',
  timestamps: true,
  indexes: [
    {
      fields: ['code']
    },
    {
      fields: ['status', 'startDate', 'endDate']
    }
  ]
})

export default Discount

