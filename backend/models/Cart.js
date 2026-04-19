import { DataTypes } from 'sequelize'
import { sequelize } from '../config/db.js'

const Cart = sequelize.define('Cart', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  items: {
    type: DataTypes.JSONB,
    defaultValue: []
  }
}, {
  tableName: 'carts',
  timestamps: true
})

export default Cart
