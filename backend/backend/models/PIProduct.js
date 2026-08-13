const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PIProduct = sequelize.define('PIProduct', {
  itemNo: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },
  buyerName: { type: DataTypes.STRING, allowNull: false },
  qty: { type: DataTypes.INTEGER, allowNull: false },
  deliveryDate: { type: DataTypes.STRING },
  printing: { type: DataTypes.ENUM('Yes', 'No'), defaultValue: 'No' }
});

module.exports = PIProduct;
