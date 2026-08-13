const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Shipment = sequelize.define('Shipment', {
  id: { type: DataTypes.STRING, primaryKey: true },
  date: { type: DataTypes.STRING, allowNull: false },
  invNo: { type: DataTypes.STRING, allowNull: false },
  party: { type: DataTypes.STRING, allowNull: false },
  piNo: { type: DataTypes.STRING, allowNull: false },
  itemNo: { type: DataTypes.STRING, allowNull: false },
  qty: { type: DataTypes.INTEGER, allowNull: false }
});

module.exports = Shipment;
