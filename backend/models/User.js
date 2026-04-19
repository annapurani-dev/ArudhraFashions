import { DataTypes } from 'sequelize'
import { sequelize } from '../config/db.js'
import bcrypt from 'bcryptjs'

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  mobile: {
    type: DataTypes.STRING(10),
    allowNull: true,
    unique: true,
    validate: {
      len: [10, 10],
      isNumeric: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [8, Infinity]
    }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  passwordResetToken: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'password_reset_token'
  },
  // Requires adding password_reset_token and password_reset_expires to the users table
  passwordResetExpires: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'password_reset_expires'
  },
  addresses: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  paymentMethods: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  wishlist: {
    type: DataTypes.ARRAY(DataTypes.UUID),
    defaultValue: []
  },
  compare: {
    type: DataTypes.ARRAY(DataTypes.UUID),
    defaultValue: []
  },
  preferences: {
    type: DataTypes.JSONB,
    defaultValue: {
      emailNotifications: true,
      smsNotifications: false,
      newsletter: false
    }
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    defaultValue: 'active'
  },
  coins: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    validate: {
      min: 0
    }
  }
}, {
  tableName: 'users',
  timestamps: true,
  hooks: {
    beforeSave: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10)
        user.password = await bcrypt.hash(user.password, salt)
      }
    }
  }
})

// Instance method to compare password
User.prototype.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password)
}

// Instance method to remove password from JSON
User.prototype.toJSON = function() {
  const values = { ...this.get() }
  delete values.password
  return values
}

export default User
