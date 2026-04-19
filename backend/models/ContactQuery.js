import { DataTypes } from 'sequelize'
import { sequelize } from '../config/db.js'

const ContactQuery = sequelize.define('ContactQuery', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  mobile: {
    type: DataTypes.STRING(10),
    allowNull: true
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('new', 'in-progress', 'resolved'),
    defaultValue: 'new'
  },
  repliedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  reply: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'contact_queries',
  timestamps: true,
  indexes: [
    {
      fields: ['status']
    },
    {
      fields: ['email']
    },
    {
      fields: ['createdAt']
    }
  ]
})

export default ContactQuery

