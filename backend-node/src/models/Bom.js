const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define('Bom', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    bom_code: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    product_id: { type: DataTypes.INTEGER, allowNull: false },
    status: {
      type: DataTypes.ENUM('ACTIVE', 'ARCHIVED'),
      allowNull: false,
      defaultValue: 'ACTIVE',
    },
    current_version_id: { type: DataTypes.INTEGER, allowNull: true, defaultValue: null },
    created_by: { type: DataTypes.INTEGER, allowNull: false },
    archived_at: { type: DataTypes.DATE, allowNull: true, defaultValue: null },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE },
  }, {
    tableName: 'boms',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });
