import { DataTypes } from 'sequelize'
import { sequelize } from '../config/db.js'

const EmailTemplate = sequelize.define('EmailTemplate', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false
  },
  channel: {
    type: DataTypes.ENUM('email', 'sms'),
    defaultValue: 'email',
    allowNull: false
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: true // Subject line for email templates
  },
  body: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  variables: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  lastModified: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'email_templates',
  timestamps: true,
  indexes: [
    {
      fields: ['type']
    },
    {
      fields: ['name']
    }
  ]
})

export default EmailTemplate

