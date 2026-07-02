const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
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
  email: {
    type: DataTypes.STRING,
    allowNull: false
  },
  password_hash: {
    type: DataTypes.STRING,
    allowNull: true // changed to true for OAuth users
  },
  google_id: {
    type: DataTypes.STRING,
    allowNull: true
  },
  microsoft_id: {
    type: DataTypes.STRING,
    allowNull: true
  },
  otp: {
    type: DataTypes.STRING,
    allowNull: true
  },
  otp_expires_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  role: {
    type: DataTypes.STRING,
    defaultValue: 'Member' // Owner, Admin, Member
  },
  email_notifications_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'Active'
  }
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = User;
