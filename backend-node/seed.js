// =============================================================================
// backend-node/seed.js
// Creates default users for role-based login testing
// =============================================================================
const bcrypt = require('bcryptjs');
const { sequelize, User } = require('./db');

async function seed() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    await sequelize.sync({ alter: true }); // Ensure tables exist

    console.log('Database synced. Seeding users...');

    const usersToCreate = [
      { name: 'Admin User', email: 'admin@logixwaveai.com', role: 'Admin' },
      { name: 'Engineering Head', email: 'eng@logixwaveai.com', role: 'Engineering' },
      { name: 'Approver Lead', email: 'approver@logixwaveai.com', role: 'Approver' },
      { name: 'Ops Worker', email: 'ops@logixwaveai.com', role: 'Operations' }
    ];

    const passwordHash = await bcrypt.hash('password123', 10);

    for (const u of usersToCreate) {
      const exists = await User.findOne({ where: { email: u.email } });
      if (!exists) {
        await User.create({
          name: u.name,
          email: u.email,
          role: u.role,
          password: passwordHash
        });
        console.log(`Created user: ${u.email} (Role: ${u.role})`);
      } else {
        console.log(`User already exists: ${u.email}`);
      }
    }

    console.log('Seeding complete! You can now log in with the above emails and password "password123".');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding database:', err);
    process.exit(1);
  }
}

seed();
