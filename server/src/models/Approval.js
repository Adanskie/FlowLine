const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Approval = sequelize.define('Approval', {
  approval_id:      { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  task_id:          { type: DataTypes.INTEGER, allowNull: false },
  approver_user_id: { type: DataTypes.INTEGER, allowNull: false },
  approval_status:  { type: DataTypes.STRING(20), allowNull: false },
  remarks:          { type: DataTypes.TEXT },
  requested_at:     { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  approval_date:    { type: DataTypes.DATE },
}, {
  tableName: 'approvals',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Approval;
