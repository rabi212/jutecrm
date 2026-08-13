const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const RawMaterial = sequelize.define('RawMaterial', {
  name: { type: DataTypes.STRING, allowNull: false, unique: true },
  color: { type: DataTypes.STRING },
  uom: { type: DataTypes.STRING, defaultValue: 'KG' },
  status: { type: DataTypes.ENUM('Active', 'Inactive'), defaultValue: 'Active' }
});

module.exports = RawMaterial;
