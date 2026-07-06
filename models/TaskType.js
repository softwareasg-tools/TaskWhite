const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TaskType = sequelize.define('TaskType', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  organization_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  auto_delete_days: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  tableName: 'task_types',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = TaskType;
