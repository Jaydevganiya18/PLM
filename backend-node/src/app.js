const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const { sequelize } = require('./db');
const { errorHandler, notFoundHandler } = require('./middleware/error');

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());
app.use(morgan('dev'));

// Uploads static path
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date() });
});

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/products', require('./routes/product.routes'));
app.use('/api/boms', require('./routes/bom.routes'));
app.use('/api/ecos', require('./routes/eco.routes'));
app.use('/api/settings', require('./routes/settings.routes'));
app.use('/api/reports', require('./routes/report.routes'));
app.use('/api/audit-logs', require('./routes/audit.routes'));
app.use('/api/pdf', require('./routes/pdf.routes'));

app.use(notFoundHandler);
app.use(errorHandler);

// Connect DB and sync tables
(async () => {
  try {
    await sequelize.authenticate();
    console.log('[DB] MySQL connected ✅');
    await sequelize.sync({ alter: true });
    console.log('[DB] Tables synced ✅');
  } catch (err) {
    console.error('[DB] Connection failed:', err.message);
    process.exit(1);
  }
})();

module.exports = app;
