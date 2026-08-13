const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const POItem = sequelize.define('POItem', {
  name: { type: DataTypes.STRING, allowNull: false },
  color: { type: DataTypes.STRING },
  qty: { type: DataTypes.INTEGER, allowNull: false },
  unit: { type: DataTypes.STRING, defaultValue: 'KG' },
  rate: { type: DataTypes.DECIMAL(10, 2) }
});

module.exports = POItem;
