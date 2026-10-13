const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const TaskAssignment = sequelize.define('TaskAssignment', {
  assignment_id:       { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  task_id:             { type: DataTypes.INTEGER, allowNull: false },
  employee_id:         { type: DataTypes.INTEGER, allowNull: false },
  assigned_by_user_id: { type: DataTypes.INTEGER, allowNull: false },
  assigned_at:         { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'task_assignments',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = TaskAssignment;
