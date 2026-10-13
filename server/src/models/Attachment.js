const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Attachment = sequelize.define('Attachment', {
  attachment_id:       { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  task_id:             { type: DataTypes.INTEGER, allowNull: false },
  uploaded_by_user_id: { type: DataTypes.INTEGER, allowNull: false },
  file_name:           { type: DataTypes.STRING(255), allowNull: false },
  file_path:           { type: DataTypes.STRING(500), allowNull: false },
  file_type:           { type: DataTypes.STRING(50) },
  is_deleted:          { type: DataTypes.BOOLEAN, defaultValue: false },
  uploaded_at:         { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'attachments',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Attachment;
