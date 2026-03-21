const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define('ProductVersion', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    product_id: { type: DataTypes.INTEGER, allowNull: false },
    version_no: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING(300), allowNull: false },
    sale_price: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    cost_price: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    effective_date: { type: DataTypes.DATE, allowNull: true, defaultValue: null },
    status: {
      type: DataTypes.ENUM('ACTIVE', 'ARCHIVED'),
      allowNull: false,
      defaultValue: 'ACTIVE',
    },
    created_via_eco_id: { type: DataTypes.INTEGER, allowNull: true, defaultValue: null },
    created_by: { type: DataTypes.INTEGER, allowNull: false },
    archived_at: { type: DataTypes.DATE, allowNull: true, defaultValue: null },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  }, {
    tableName: 'product_versions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [{ unique: true, fields: ['product_id', 'version_no'] }],
  });
