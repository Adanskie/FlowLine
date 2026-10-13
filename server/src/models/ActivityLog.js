const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const ActivityLog = sequelize.define('ActivityLog', {
  log_id:         { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id:        { type: DataTypes.INTEGER, allowNull: false },
  action_type:    { type: DataTypes.STRING(50), allowNull: false },
  table_affected: { type: DataTypes.STRING(50) },
  record_id:      { type: DataTypes.INTEGER },
  description:    { type: DataTypes.TEXT },
}, {
  tableName: 'activity_logs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = ActivityLog;
