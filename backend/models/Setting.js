import { DataTypes } from 'sequelize'
import { sequelize } from '../config/db.js'

const Setting = sequelize.define('Setting', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  key: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  value: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('string', 'number', 'boolean', 'json'),
    defaultValue: 'string'
  },
  category: {
    type: DataTypes.ENUM('store', 'shipping', 'tax', 'payment', 'contact', 'general'),
    defaultValue: 'general'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'settings',
  timestamps: true,
  indexes: [
    {
      fields: ['key']
    },
    {
      fields: ['category', 'key']
    }
  ]
})

export default Setting

