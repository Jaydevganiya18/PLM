const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define('Eco', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    eco_number: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    title: { type: DataTypes.STRING(300), allowNull: false },
    eco_type: { type: DataTypes.ENUM('PRODUCT', 'BOM'), allowNull: false },
    product_id: { type: DataTypes.INTEGER, allowNull: false },
    bom_id: { type: DataTypes.INTEGER, allowNull: true, defaultValue: null },
    source_product_version_id: { type: DataTypes.INTEGER, allowNull: true, defaultValue: null },
    source_bom_version_id: { type: DataTypes.INTEGER, allowNull: true, defaultValue: null },
    original_snapshot: { type: DataTypes.JSON, allowNull: true, defaultValue: null },
    proposed_changes: { type: DataTypes.JSON, allowNull: true, defaultValue: null },
    current_stage_id: { type: DataTypes.INTEGER, allowNull: true, defaultValue: null },
    status: {
      type: DataTypes.ENUM('DRAFT', 'IN_PROGRESS', 'REJECTED', 'APPLIED', 'CANCELLED'),
      allowNull: false,
      defaultValue: 'DRAFT',
    },
    version_update: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    rejection_reason: { type: DataTypes.TEXT, allowNull: true, defaultValue: null },
    effective_date: { type: DataTypes.DATE, allowNull: true, defaultValue: null },
    requested_by: { type: DataTypes.INTEGER, allowNull: false },
    started_at: { type: DataTypes.DATE, allowNull: true, defaultValue: null },
    submitted_at: { type: DataTypes.DATE, allowNull: true, defaultValue: null },
    approved_at: { type: DataTypes.DATE, allowNull: true, defaultValue: null },
    applied_at: { type: DataTypes.DATE, allowNull: true, defaultValue: null },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE },
  }, {
    tableName: 'ecos',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });
