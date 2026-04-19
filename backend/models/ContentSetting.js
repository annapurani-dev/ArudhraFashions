import { DataTypes } from 'sequelize'
import { sequelize } from '../config/db.js'

const ContentSetting = sequelize.define('ContentSetting', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  section: {
    type: DataTypes.STRING,
    allowNull: false
  },
  key: {
    type: DataTypes.STRING,
    allowNull: false
  },
  value: {
    type: DataTypes.TEXT,
    allowNull: false
  }
}, {
  tableName: 'content_settings',
  timestamps: true,
  indexes: [
    {
      fields: ['section', 'key'],
      unique: true
    }
  ]
})

export default ContentSetting

