const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PO = sequelize.define('PO', {
  id: { type: DataTypes.STRING, primaryKey: true },
  date: { type: DataTypes.STRING, allowNull: false },
  supplier: { type: DataTypes.STRING, allowNull: false },
  poNo: { type: DataTypes.STRING, allowNull: false, unique: true }
});

module.exports = PO;
