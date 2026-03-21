// =============================================================================
// backend-node/models/ECO.js
// =============================================================================
const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define('ECO', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    title: {
      type: DataTypes.STRING(300),
      allowNull: false,
      validate: { notEmpty: true },
    },
    type: {
      type: DataTypes.ENUM('Product', 'BoM'),
      allowNull: false,
    },

    // ── Polymorphic-style FKs ─────────────────────────────────────────────
    // RULE: If type='Product' → product_id NOT NULL, bom_id NULL
    //       If type='BoM'     → bom_id NOT NULL, product_id NULL
    // Enforced in controller — MySQL can't do conditional FK constraints
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
    },
    bom_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
    },

    // Snapshot of target at ECO creation time
    // Used for diff view — independent of future target changes
    original_snapshot: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {},
    },

    // Changes to apply on approval
    // Product: { name?, sale_price?, cost_price?, image_url? }
    // BoM:     { components?, operations? }
    proposed_changes: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {},
    },

    stage: {
      type: DataTypes.ENUM('New', 'Approval', 'Done', 'Rejected'),
      allowNull: false,
      defaultValue: 'New',
    },

    version_update: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },

    // ── User FKs (two separate — use explicit aliases in db.js) ──────────
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    approved_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
    },
    approved_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },

    rejection_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },

    // Set to true when Engineering acknowledges anomaly warning
    risk_acknowledged: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    risk_acknowledged_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },

    effective_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      defaultValue: null,
    },
  }, {
    tableName: 'ecos',
    timestamps: true,
  });