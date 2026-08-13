const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ReceiptItem = sequelize.define('ReceiptItem', {
  name: { type: DataTypes.STRING, allowNull: false },
  color: { type: DataTypes.STRING },
  qty: { type: DataTypes.INTEGER, allowNull: false },
  unit: { type: DataTypes.STRING }
});

module.exports = ReceiptItem;
