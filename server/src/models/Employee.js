const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Employee = sequelize.define('Employee', {
  employee_id:       { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  department_id:     { type: DataTypes.INTEGER },
  position_id:       { type: DataTypes.INTEGER },
  supervisor_id:     { type: DataTypes.INTEGER },
  team_id:           { type: DataTypes.INTEGER },
  first_name:        { type: DataTypes.STRING(100), allowNull: false },
  last_name:         { type: DataTypes.STRING(100), allowNull: false },
  email:             { type: DataTypes.STRING(150), allowNull: false, unique: true },
  phone:             { type: DataTypes.STRING(50) },
  employment_type:   { type: DataTypes.STRING(50) },
  emergency_contact: { type: DataTypes.STRING(255) },
  profile_photo_url: { type: DataTypes.STRING(255) },
  hire_date:         { type: DataTypes.DATE },
  status:            { type: DataTypes.STRING(20), defaultValue: 'Active' },
  is_deleted:        { type: DataTypes.BOOLEAN, defaultValue: false },
}, {
  tableName: 'employees',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Employee;
