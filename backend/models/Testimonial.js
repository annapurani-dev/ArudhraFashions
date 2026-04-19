import { DataTypes } from 'sequelize'
import { sequelize } from '../config/db.js'

const Testimonial = sequelize.define('Testimonial', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 5
    }
  },
  position: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  visible: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'testimonials',
  timestamps: true,
  indexes: [
    {
      fields: ['visible', 'position']
    }
  ]
})

export default Testimonial
