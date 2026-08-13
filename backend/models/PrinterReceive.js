const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PrinterReceive = sequelize.define('PrinterReceive', {
  id: { type: DataTypes.STRING, primaryKey: true },
  date: { type: DataTypes.STRING, allowNull: false },
  printerName: { type: DataTypes.STRING, allowNull: false },
  piNo: { type: DataTypes.STRING, allowNull: false },
  itemNo: { type: DataTypes.STRING, allowNull: false },
  qty: { type: DataTypes.INTEGER, allowNull: false },
  rejectionFabricator: { type: DataTypes.INTEGER, defaultValue: 0 },
  rejectionFactory: { type: DataTypes.INTEGER, defaultValue: 0 },
  rejectionRemarks: { type: DataTypes.TEXT },
  billRec: { type: DataTypes.ENUM('Yes', 'No'), defaultValue: 'No' },
  billNo: { type: DataTypes.STRING },
  billDate: { type: DataTypes.STRING },
  billFile: { type: DataTypes.STRING },
  qcCheckedBy: { type: DataTypes.STRING },
  remarks: { type: DataTypes.TEXT }
});

module.exports = PrinterReceive;
