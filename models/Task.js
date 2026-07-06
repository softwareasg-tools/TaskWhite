const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Task = sequelize.define('Task', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  organization_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  client_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  task_type_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  assigned_user_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  show_name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  episode_name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  due_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  priority: {
    type: DataTypes.STRING,
    defaultValue: 'Normal' // Normal, High
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'Assigned' // Assigned, In Progress, Completed, Overdue
  },
  tags: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const val = this.getDataValue('tags');
      return val ? JSON.parse(val) : [];
    },
    set(val) {
      this.setDataValue('tags', val ? JSON.stringify(val) : JSON.stringify([]));
    }
  },
  deleted_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  completed_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'tasks',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Task;
