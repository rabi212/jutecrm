const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const StitcherIssue = sequelize.define('StitcherIssue', {
  id: { type: DataTypes.STRING, primaryKey: true },
  date: { type: DataTypes.STRING, allowNull: false },
  fabricatorName: { type: DataTypes.STRING, allowNull: false },
  piNo: { type: DataTypes.STRING, allowNull: false },
  itemNo: { type: DataTypes.STRING, allowNull: false },
  qty: { type: DataTypes.INTEGER, allowNull: false },
  accessories: { type: DataTypes.STRING },
  accessoriesQty: { type: DataTypes.INTEGER },
  accessoriesColor: { type: DataTypes.STRING },
  remarks: { type: DataTypes.TEXT }
});

module.exports = StitcherIssue;
