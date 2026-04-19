import { DataTypes } from 'sequelize'
import { sequelize } from '../config/db.js'

const PushSubscription = sequelize.define('PushSubscription', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  adminId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'admins',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  endpoint: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  keys: {
    type: DataTypes.JSON,
    allowNull: false
  },
  deviceInfo: {
    type: DataTypes.JSON,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'push_subscriptions',
  timestamps: true
})

export default PushSubscription