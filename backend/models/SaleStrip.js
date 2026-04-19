import { DataTypes } from 'sequelize'
import { sequelize } from '../config/db.js'

const SaleStrip = sequelize.define('SaleStrip', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  discount: {
    type: DataTypes.STRING,
    allowNull: true // e.g., "50% OFF", "FLAT ₹500 OFF"
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  backgroundColor: {
    type: DataTypes.STRING,
    defaultValue: '#ff0000'
  },
  textColor: {
    type: DataTypes.STRING,
    defaultValue: '#ffffff'
  },
  visible: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'sale_strips',
  timestamps: true,
  indexes: [
    {
      fields: ['visible', 'startDate', 'endDate']
    }
  ]
})

export default SaleStrip
