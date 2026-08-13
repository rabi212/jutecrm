const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Finisher = sequelize.define('Finisher', {
  name: { type: DataTypes.STRING, allowNull: false, unique: true },
  gstin: { type: DataTypes.STRING },
  address: { type: DataTypes.TEXT },
  contactNo: { type: DataTypes.STRING },
  status: { type: DataTypes.ENUM('Active', 'Inactive'), defaultValue: 'Active' }
});

module.exports = Finisher;
