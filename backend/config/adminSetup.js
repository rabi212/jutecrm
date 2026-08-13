const { User } = require('../models');

async function ensureDefaultAdmin() {
  try {
    const adminCount = await User.count({ where: { role: 'admin' } });
    if (adminCount === 0) {
      await User.create({
        email: 'admin@jutecrm.com',
        password: 'admin',
        role: 'admin'
      });
      console.log('Default admin user verified/created successfully (admin@jutecrm.com / admin).');
    }
  } catch (err) {
    console.error('Failed to verify default admin user:', err.message);
  }
}

module.exports = { ensureDefaultAdmin };
