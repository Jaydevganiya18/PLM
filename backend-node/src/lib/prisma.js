// This file replaces src/lib/prisma.js
// It re-exports the Sequelize db module so all controllers that previously
// imported from '../lib/prisma' now get the Sequelize models.
module.exports = require('../db');
