const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const User = sequelize.define('User', {
  id:                     { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  employee_id:            { type: DataTypes.INTEGER, unique: true },
  role_id:                { type: DataTypes.INTEGER },
  username:               { type: DataTypes.STRING(100), allowNull: false, unique: true },
  password:               { type: DataTypes.STRING(255), allowNull: false },
  status:                 { type: DataTypes.STRING(20), defaultValue: 'active' },
  reset_token:            { type: DataTypes.STRING(255), unique: true },
  reset_expires:          { type: DataTypes.DATE },
  failed_login_attempts:  { type: DataTypes.INTEGER, defaultValue: 0 },
  last_login:             { type: DataTypes.DATE },
  is_deleted:             { type: DataTypes.BOOLEAN, defaultValue: false },
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = User;
