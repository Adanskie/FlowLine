const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Task = sequelize.define('Task', {
  task_id:             { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  stage_id:            { type: DataTypes.INTEGER, allowNull: false },
  task_title:          { type: DataTypes.STRING(255), allowNull: false },
  task_description:    { type: DataTypes.TEXT },
  priority_id:         { type: DataTypes.INTEGER, allowNull: false },
  start_date:          { type: DataTypes.DATE },
  due_date:            { type: DataTypes.DATE, allowNull: false },
  created_by_user_id:  { type: DataTypes.INTEGER, allowNull: false },
  updated_by_user_id:  { type: DataTypes.INTEGER },
  is_deleted:          { type: DataTypes.BOOLEAN, defaultValue: false },
}, {
  tableName: 'tasks',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Task;
