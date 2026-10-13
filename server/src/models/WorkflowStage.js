const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const WorkflowStage = sequelize.define('WorkflowStage', {
  stage_id:    { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  stage_name:  { type: DataTypes.STRING(50), allowNull: false, unique: true },
  step_order:  { type: DataTypes.INTEGER, allowNull: false, unique: true },
  is_terminal: { type: DataTypes.BOOLEAN, defaultValue: false },
}, {
  tableName: 'workflow_stages',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = WorkflowStage;
