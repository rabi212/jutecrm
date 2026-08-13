const { sequelize } = require('./config/database');
const { Customer } = require('./models');

async function run() {
  await sequelize.authenticate();
  const customers = await Customer.findAll();
  console.log(JSON.stringify(customers, null, 2));
  process.exit(0);
}

run().catch(console.error);
