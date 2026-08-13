const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Cutting = sequelize.define('Cutting', {
  id: { type: DataTypes.STRING, primaryKey: true },
  date: { type: DataTypes.STRING, allowNull: false },
  piNo: { type: DataTypes.STRING, allowNull: false }
});

module.exports = Cutting;
