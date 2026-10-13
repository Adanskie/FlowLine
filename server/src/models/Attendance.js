const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Attendance = sequelize.define('Attendance', {
  attendance_id:     { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  employee_id:       { type: DataTypes.INTEGER, allowNull: false },
  date:              { type: DataTypes.DATEONLY, allowNull: false },
  time_in:           { type: DataTypes.STRING(10) },
  time_out:          { type: DataTypes.STRING(10) },
  attendance_status: { type: DataTypes.STRING(20), defaultValue: 'Present' },
}, {
  tableName: 'attendance',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Attendance;
