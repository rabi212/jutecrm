const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PI = sequelize.define('PI', {
  id: { type: DataTypes.STRING, primaryKey: true },
  date: { type: DataTypes.STRING, allowNull: false },
  piNo: { type: DataTypes.STRING, allowNull: false, unique: true }
});

module.exports = PI;
