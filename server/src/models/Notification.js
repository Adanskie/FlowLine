const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Notification = sequelize.define('Notification', {
  notification_id:   { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id:           { type: DataTypes.INTEGER, allowNull: false },
  sender_user_id:    { type: DataTypes.INTEGER },
  notification_type: { type: DataTypes.STRING(50), allowNull: false },
  reference_id:      { type: DataTypes.INTEGER },
  title:             { type: DataTypes.STRING(255), allowNull: false },
  message:           { type: DataTypes.TEXT, allowNull: false },
  is_read:           { type: DataTypes.BOOLEAN, defaultValue: false },
}, {
  tableName: 'notifications',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Notification;
