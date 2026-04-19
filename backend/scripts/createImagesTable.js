import dotenv from 'dotenv'
dotenv.config()

import { sequelize } from '../config/db.js'

const run = async () => {
  try {
    const queryInterface = sequelize.getQueryInterface()
    // Check if table exists
    const tableNames = await queryInterface.showAllTables()
    if (tableNames.includes('images')) {
      console.log('Table "images" already exists — skipping creation.')
      process.exit(0)
    }

    await queryInterface.createTable('images', {
      id: {
        type: 'UUID',
        allowNull: false,
        primaryKey: true
      },
      filename: {
        type: 'VARCHAR(255)',
        allowNull: true
      },
      "mimeType": {
        type: 'VARCHAR(100)',
        allowNull: false
      },
      size: {
        type: 'INTEGER',
        allowNull: true
      },
      data: {
        type: 'BYTEA',
        allowNull: false
      },
      "createdAt": {
        type: 'TIMESTAMP WITH TIME ZONE',
        allowNull: false,
        defaultValue: sequelize.literal('NOW()')
      },
      "updatedAt": {
        type: 'TIMESTAMP WITH TIME ZONE',
        allowNull: false,
        defaultValue: sequelize.literal('NOW()')
      }
    })

    console.log('Created table "images" successfully.')
    process.exit(0)
  } catch (error) {
    console.error('Failed to create images table:', error)
    process.exit(1)
  }
}

run()

