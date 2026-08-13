const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CuttingItem = sequelize.define('CuttingItem', {
  cutterName: { type: DataTypes.STRING },
  itemNo: { type: DataTypes.STRING },
  qty: { type: DataTypes.INTEGER },
  rawMaterial: { type: DataTypes.STRING },
  rawMaterialColor: { type: DataTypes.STRING },
  rawMaterialUsed: { type: DataTypes.INTEGER },
  rawMaterialRejection: { type: DataTypes.INTEGER },
  billRec: { type: DataTypes.ENUM('Yes', 'No'), defaultValue: 'No' },
  billNo: { type: DataTypes.STRING },
  billDate: { type: DataTypes.STRING },
  billFile: { type: DataTypes.STRING },
  remarks: { type: DataTypes.TEXT }
});

module.exports = CuttingItem;
