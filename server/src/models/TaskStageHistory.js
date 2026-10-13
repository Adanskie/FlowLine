const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const TaskStageHistory = sequelize.define('TaskStageHistory', {
  history_id:         { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  task_id:            { type: DataTypes.INTEGER, allowNull: false },
  changed_by_user_id: { type: DataTypes.INTEGER, allowNull: false },
  old_stage_id:       { type: DataTypes.INTEGER },
  new_stage_id:       { type: DataTypes.INTEGER, allowNull: false },
  remarks:            { type: DataTypes.TEXT },
  changed_at:         { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'task_stage_history',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = TaskStageHistory;
