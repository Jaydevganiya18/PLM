const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define('BomOperation', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    bom_version_id: { type: DataTypes.INTEGER, allowNull: false },
    line_no: { type: DataTypes.INTEGER, allowNull: false },
    operation_name: { type: DataTypes.STRING(200), allowNull: false },
    work_center: { type: DataTypes.STRING(200), allowNull: false },
    duration_minutes: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  }, {
    tableName: 'bom_operations',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [{ unique: true, fields: ['bom_version_id', 'line_no'] }],
  });
