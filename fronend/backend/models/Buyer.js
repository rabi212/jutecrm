const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Buyer = sequelize.define('Buyer', {
  name: { type: DataTypes.STRING, allowNull: false, unique: true },
  taxRegNo: { type: DataTypes.STRING },
  address: { type: DataTypes.TEXT },
  contactDetails: { type: DataTypes.STRING },
  status: { type: DataTypes.ENUM('Active', 'Inactive'), defaultValue: 'Active' }
});

module.exports = Buyer;
