
const { Sequelize } = require('sequelize');
require('dotenv').config();

// Parse DATABASE_URL if individual vars not set
// Expected format: mysql://USER:PASS@HOST:PORT/DBNAME
function parseDatabaseUrl(url) {
  try {
    const u = new URL(url);
    return {
      database: u.pathname.replace('/', ''),
      username: u.username,
      password: u.password,
      host: u.hostname,
      port: parseInt(u.port) || 3306,
    };
  } catch {
    return null;
  }
}

let dbConfig;
if (process.env.DB_NAME) {
  dbConfig = {
    database: process.env.DB_NAME,
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
  };
} else {
  dbConfig = parseDatabaseUrl(process.env.DATABASE_URL) || {
    database: 'plm_db',
    username: 'root',
    password: '',
    host: 'localhost',
    port: 3306,
  };
}

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
  }
);

// ── Import Models ──────────────────────────────────────────────────────────────
const User               = require('./models/User')(sequelize);
const Product            = require('./models/Product')(sequelize);
const ProductVersion     = require('./models/ProductVersion')(sequelize);
const ProductAttachment  = require('./models/ProductAttachment')(sequelize);
const Bom                = require('./models/Bom')(sequelize);
const BomVersion         = require('./models/BomVersion')(sequelize);
const BomComponent       = require('./models/BomComponent')(sequelize);
const BomOperation       = require('./models/BomOperation')(sequelize);
const EcoStage           = require('./models/EcoStage')(sequelize);
const ApprovalRule       = require('./models/ApprovalRule')(sequelize);
const Eco                = require('./models/Eco')(sequelize);
const EcoApproval        = require('./models/EcoApproval')(sequelize);
const EcoStageHistory    = require('./models/EcoStageHistory')(sequelize);
const AuditLog           = require('./models/AuditLog')(sequelize);

// ── Associations ───────────────────────────────────────────────────────────────

// User → Product (creator)
User.hasMany(Product, { foreignKey: 'created_by', as: 'created_products' });
Product.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// Product → ProductVersion (one-to-many: all versions)
Product.hasMany(ProductVersion, { foreignKey: 'product_id', as: 'versions' });
ProductVersion.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

// Product → ProductVersion (current_version - using separate FK)
Product.belongsTo(ProductVersion, { foreignKey: 'current_version_id', as: 'current_version', constraints: false });

// User → ProductVersion (creator)
User.hasMany(ProductVersion, { foreignKey: 'created_by', as: 'created_product_versions' });
ProductVersion.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// Eco → ProductVersion (created via)
Eco.hasMany(ProductVersion, { foreignKey: 'created_via_eco_id', as: 'created_product_versions' });
ProductVersion.belongsTo(Eco, { foreignKey: 'created_via_eco_id', as: 'created_via_eco' });

// ProductVersion → ProductAttachment
ProductVersion.hasMany(ProductAttachment, { foreignKey: 'product_version_id', as: 'attachments' });
ProductAttachment.belongsTo(ProductVersion, { foreignKey: 'product_version_id', as: 'product_version' });

// User → ProductAttachment (uploader)
User.hasMany(ProductAttachment, { foreignKey: 'uploaded_by', as: 'uploaded_attachments' });
ProductAttachment.belongsTo(User, { foreignKey: 'uploaded_by', as: 'uploader' });

// Product → Bom
Product.hasMany(Bom, { foreignKey: 'product_id', as: 'boms' });
Bom.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

// User → Bom (creator)
User.hasMany(Bom, { foreignKey: 'created_by', as: 'created_boms' });
Bom.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// Bom → BomVersion (one-to-many: all versions)
Bom.hasMany(BomVersion, { foreignKey: 'bom_id', as: 'versions' });
BomVersion.belongsTo(Bom, { foreignKey: 'bom_id', as: 'bom' });

// Bom → BomVersion (current_version)
Bom.belongsTo(BomVersion, { foreignKey: 'current_version_id', as: 'current_version', constraints: false });

// User → BomVersion (creator)
User.hasMany(BomVersion, { foreignKey: 'created_by', as: 'created_bom_versions' });
BomVersion.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// Eco → BomVersion (created via)
Eco.hasMany(BomVersion, { foreignKey: 'created_via_eco_id', as: 'created_bom_versions' });
BomVersion.belongsTo(Eco, { foreignKey: 'created_via_eco_id', as: 'created_via_eco' });

// BomVersion → BomComponent
BomVersion.hasMany(BomComponent, { foreignKey: 'bom_version_id', as: 'components' });
BomComponent.belongsTo(BomVersion, { foreignKey: 'bom_version_id', as: 'bom_version' });

// Product → BomComponent (component product)
Product.hasMany(BomComponent, { foreignKey: 'component_product_id', as: 'used_in_bom_components' });
BomComponent.belongsTo(Product, { foreignKey: 'component_product_id', as: 'component_product' });

// BomVersion → BomOperation
BomVersion.hasMany(BomOperation, { foreignKey: 'bom_version_id', as: 'operations' });
BomOperation.belongsTo(BomVersion, { foreignKey: 'bom_version_id', as: 'bom_version' });

// User → EcoStage (creator)
User.hasMany(EcoStage, { foreignKey: 'created_by', as: 'created_eco_stages' });
EcoStage.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// EcoStage → ApprovalRule
EcoStage.hasMany(ApprovalRule, { foreignKey: 'stage_id', as: 'approval_rules' });
ApprovalRule.belongsTo(EcoStage, { foreignKey: 'stage_id', as: 'stage' });

// Product → Eco
Product.hasMany(Eco, { foreignKey: 'product_id', as: 'ecos' });
Eco.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

// Bom → Eco
Bom.hasMany(Eco, { foreignKey: 'bom_id', as: 'ecos' });
Eco.belongsTo(Bom, { foreignKey: 'bom_id', as: 'bom' });

// User → Eco (requester)
User.hasMany(Eco, { foreignKey: 'requested_by', as: 'requested_ecos' });
Eco.belongsTo(User, { foreignKey: 'requested_by', as: 'requester' });

// EcoStage → Eco (current stage)
EcoStage.hasMany(Eco, { foreignKey: 'current_stage_id', as: 'ecos' });
Eco.belongsTo(EcoStage, { foreignKey: 'current_stage_id', as: 'current_stage' });

// ProductVersion → Eco (source version)
ProductVersion.hasMany(Eco, { foreignKey: 'source_product_version_id', as: 'ecos_as_source' });
Eco.belongsTo(ProductVersion, { foreignKey: 'source_product_version_id', as: 'source_product_version' });

// BomVersion → Eco (source version)
BomVersion.hasMany(Eco, { foreignKey: 'source_bom_version_id', as: 'ecos_as_source' });
Eco.belongsTo(BomVersion, { foreignKey: 'source_bom_version_id', as: 'source_bom_version' });

// Eco → EcoApproval
Eco.hasMany(EcoApproval, { foreignKey: 'eco_id', as: 'approvals' });
EcoApproval.belongsTo(Eco, { foreignKey: 'eco_id', as: 'eco' });

// EcoStage → EcoApproval
EcoStage.hasMany(EcoApproval, { foreignKey: 'stage_id', as: 'eco_approvals' });
EcoApproval.belongsTo(EcoStage, { foreignKey: 'stage_id', as: 'stage' });

// User → EcoApproval (approver)
User.hasMany(EcoApproval, { foreignKey: 'approver_id', as: 'eco_approvals' });
EcoApproval.belongsTo(User, { foreignKey: 'approver_id', as: 'approver' });

// Eco → EcoStageHistory
Eco.hasMany(EcoStageHistory, { foreignKey: 'eco_id', as: 'stage_history' });
EcoStageHistory.belongsTo(Eco, { foreignKey: 'eco_id', as: 'eco' });

// EcoStage → EcoStageHistory (from/to)
EcoStage.hasMany(EcoStageHistory, { foreignKey: 'from_stage_id', as: 'history_from' });
EcoStageHistory.belongsTo(EcoStage, { foreignKey: 'from_stage_id', as: 'from_stage' });

EcoStage.hasMany(EcoStageHistory, { foreignKey: 'to_stage_id', as: 'history_to' });
EcoStageHistory.belongsTo(EcoStage, { foreignKey: 'to_stage_id', as: 'to_stage' });

// User → EcoStageHistory (actor)
User.hasMany(EcoStageHistory, { foreignKey: 'acted_by', as: 'eco_stage_history' });
EcoStageHistory.belongsTo(User, { foreignKey: 'acted_by', as: 'actor' });

// User → AuditLog
User.hasMany(AuditLog, { foreignKey: 'user_id', as: 'audit_logs' });
AuditLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Eco → AuditLog
Eco.hasMany(AuditLog, { foreignKey: 'eco_id', as: 'audit_logs' });
AuditLog.belongsTo(Eco, { foreignKey: 'eco_id', as: 'eco' });

// ─────────────────────────────────────────────────────────────────────────────
module.exports = {
  sequelize,
  User, Product, ProductVersion, ProductAttachment,
  Bom, BomVersion, BomComponent, BomOperation,
  EcoStage, ApprovalRule, Eco, EcoApproval, EcoStageHistory,
  AuditLog,
};
