// =============================================================================
// backend-node/db.js
// Sequelize MySQL Connection + All Models + All Associations
// =============================================================================
const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME     || 'plm_db',
  process.env.DB_USER     || 'root',
  process.env.DB_PASS     || '',
  {
    host:    process.env.DB_HOST || 'localhost',
    port:    process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
    define: { timestamps: true },
  }
);

// ── Import Models ─────────────────────────────────────────────────────────────
const User     = require('./models/User')(sequelize);
const Product  = require('./models/Product')(sequelize);
const BoM      = require('./models/BoM')(sequelize);
const ECO      = require('./models/ECO')(sequelize);
const AuditLog = require('./models/AuditLog')(sequelize);

// ── Associations ──────────────────────────────────────────────────────────────

// Product self-referential (version lineage)
Product.hasMany(Product, { foreignKey: 'parent_id', as: 'childVersions' });
Product.belongsTo(Product, { foreignKey: 'parent_id', as: 'parentProduct' });

// Product → BoM
Product.hasMany(BoM, { foreignKey: 'product_id', as: 'boms' });
BoM.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

// BoM self-referential (version lineage)
BoM.hasMany(BoM, { foreignKey: 'parent_id', as: 'childVersions' });
BoM.belongsTo(BoM, { foreignKey: 'parent_id', as: 'parentBoM' });

// User → ECO (two separate associations, different aliases)
User.hasMany(ECO, { foreignKey: 'created_by', as: 'createdECOs' });
ECO.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

User.hasMany(ECO, { foreignKey: 'approved_by', as: 'approvedECOs' });
ECO.belongsTo(User, { foreignKey: 'approved_by', as: 'approver' });

// ECO → Product
ECO.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
Product.hasMany(ECO, { foreignKey: 'product_id', as: 'ecos' });

// ECO → BoM
ECO.belongsTo(BoM, { foreignKey: 'bom_id', as: 'bom' });
BoM.hasMany(ECO, { foreignKey: 'bom_id', as: 'ecos' });

// User → AuditLog
User.hasMany(AuditLog, { foreignKey: 'user_id', as: 'auditLogs' });
AuditLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// ─────────────────────────────────────────────────────────────────────────────
module.exports = { sequelize, User, Product, BoM, ECO, AuditLog };