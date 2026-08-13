const { Sequelize } = require('sequelize');
const mysql = require('mysql2/promise');
require('dotenv').config();

const host = process.env.DB_HOST || 'localhost';
const user = process.env.DB_USER || 'root';
const password = process.env.DB_PASS || '';
const database = process.env.DB_NAME || 'jute_crm';
const port = process.env.DB_PORT || 3306;

async function ensureDatabaseExists() {
  try {
    const connection = await mysql.createConnection({
      host,
      user,
      password,
      port
    });
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\`;`);
    await connection.end();
    console.log(`Database "${database}" verified/created successfully.`);
  } catch (err) {
    console.error('Failed to ensure database exists:', err.message);
  }
}

const sequelize = new Sequelize(database, user, password, {
  host,
  port,
  dialect: 'mysql',
  logging: false, // Set to console.log to debug query details
  define: {
    timestamps: true, // Auto-add createdAt and updatedAt
  }
});

module.exports = {
  sequelize,
  ensureDatabaseExists
};
