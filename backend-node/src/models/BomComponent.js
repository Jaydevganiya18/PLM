const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define('BomComponent', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    bom_version_id: { type: DataTypes.INTEGER, allowNull: false },
    line_no: { type: DataTypes.INTEGER, allowNull: false },
    component_product_id: { type: DataTypes.INTEGER, allowNull: false },
    quantity: { type: DataTypes.DECIMAL(12, 4), allowNull: false },
    uom: { type: DataTypes.STRING(50), allowNull: false },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  }, {
    tableName: 'bom_components',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [{ unique: true, fields: ['bom_version_id', 'line_no'] }],
  });
