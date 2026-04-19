import { DataTypes } from 'sequelize'
import { sequelize } from '../config/db.js'

const CouponUsage = sequelize.define('CouponUsage', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  couponId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'coupons',
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  orderId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  usedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'coupon_usage',
  timestamps: true,
  indexes: [
    {
      fields: ['couponId', 'userId']
    },
    {
      fields: ['orderId']
    }
  ]
})

export default CouponUsage

