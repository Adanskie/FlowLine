const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Team = sequelize.define('Team', {
  team_id:       { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  team_name:     { type: DataTypes.STRING(100), allowNull: false },
  department_id: { type: DataTypes.INTEGER, allowNull: false },
  team_lead_id:  { type: DataTypes.INTEGER },
  is_deleted:    { type: DataTypes.BOOLEAN, defaultValue: false },
}, {
  tableName: 'teams',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Team;
