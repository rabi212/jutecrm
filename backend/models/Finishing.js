const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Finishing = sequelize.define('Finishing', {
  id: { type: DataTypes.STRING, primaryKey: true },
  date: { type: DataTypes.STRING, allowNull: false },
  jobworkerName: { type: DataTypes.STRING, allowNull: false },
  piNo: { type: DataTypes.STRING, allowNull: false },
  itemNo: { type: DataTypes.STRING, allowNull: false },
  qty: { type: DataTypes.INTEGER, allowNull: false },
  rejection: { type: DataTypes.INTEGER, defaultValue: 0 },
  ctnDims: { type: DataTypes.STRING },
  netWt: { type: DataTypes.DECIMAL(10, 2) },
  grossWt: { type: DataTypes.DECIMAL(10, 2) },
  pcsPerCtn: { type: DataTypes.INTEGER },
  volumeCbm: { type: DataTypes.DECIMAL(10, 4) },
  billRec: { type: DataTypes.ENUM('Yes', 'No'), defaultValue: 'No' },
  billNo: { type: DataTypes.STRING },
  billDate: { type: DataTypes.STRING },
  billFile: { type: DataTypes.STRING },
  qcCheckedBy: { type: DataTypes.STRING },
  remarks: { type: DataTypes.TEXT }
});

module.exports = Finishing;
