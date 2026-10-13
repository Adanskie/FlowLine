const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Position = sequelize.define('Position', {
  position_id:   { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  position_name: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  description:   { type: DataTypes.STRING(255) },
}, {
  tableName: 'positions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Position;
