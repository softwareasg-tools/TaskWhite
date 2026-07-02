const sequelize = require('../config/database');

const Organization = require('./Organization');
const User = require('./User');
const Client = require('./Client');
const TaskType = require('./TaskType');
const Task = require('./Task');
const Invitation = require('./Invitation');

// Relationships

// Organization has many Users, Clients, TaskTypes, Tasks, Invitations
Organization.hasMany(User, { foreignKey: 'organization_id' });
User.belongsTo(Organization, { foreignKey: 'organization_id' });

Organization.hasMany(Client, { foreignKey: 'organization_id' });
Client.belongsTo(Organization, { foreignKey: 'organization_id' });

Organization.hasMany(TaskType, { foreignKey: 'organization_id' });
TaskType.belongsTo(Organization, { foreignKey: 'organization_id' });

Organization.hasMany(Task, { foreignKey: 'organization_id' });
Task.belongsTo(Organization, { foreignKey: 'organization_id' });

Organization.hasMany(Invitation, { foreignKey: 'organization_id' });
Invitation.belongsTo(Organization, { foreignKey: 'organization_id' });

// Task belongs to Client, TaskType, and assigned User
Task.belongsTo(Client, { foreignKey: 'client_id' });
Client.hasMany(Task, { foreignKey: 'client_id' });

Task.belongsTo(TaskType, { foreignKey: 'task_type_id' });
TaskType.hasMany(Task, { foreignKey: 'task_type_id' });

Task.belongsTo(User, { as: 'Assignee', foreignKey: 'assigned_user_id' });
User.hasMany(Task, { foreignKey: 'assigned_user_id' });

Task.belongsTo(User, { as: 'Creator', foreignKey: 'created_by' });
User.hasMany(Task, { foreignKey: 'created_by' });

module.exports = {
  sequelize,
  Organization,
  User,
  Client,
  TaskType,
  Task,
  Invitation
};
