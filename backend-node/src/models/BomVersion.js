const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define('BomVersion', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    bom_id: { type: DataTypes.INTEGER, allowNull: false },
    version_no: { type: DataTypes.INTEGER, allowNull: false },
    status: {
      type: DataTypes.ENUM('ACTIVE', 'ARCHIVED'),
      allowNull: false,
      defaultValue: 'ACTIVE',
    },
    effective_date: { type: DataTypes.DATE, allowNull: true, defaultValue: null },
    created_via_eco_id: { type: DataTypes.INTEGER, allowNull: true, defaultValue: null },
    created_by: { type: DataTypes.INTEGER, allowNull: false },
    archived_at: { type: DataTypes.DATE, allowNull: true, defaultValue: null },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  }, {
    tableName: 'bom_versions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [{ unique: true, fields: ['bom_id', 'version_no'] }],
  });
