const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define('AuditLog', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: true, defaultValue: null },
    action: { type: DataTypes.STRING(100), allowNull: false },
    affected_type: { type: DataTypes.STRING(100), allowNull: false },
    affected_id: { type: DataTypes.INTEGER, allowNull: false },
    eco_id: { type: DataTypes.INTEGER, allowNull: true, defaultValue: null },
    old_value: { type: DataTypes.JSON, allowNull: true, defaultValue: null },
    new_value: { type: DataTypes.JSON, allowNull: true, defaultValue: null },
    smart_summary: { type: DataTypes.TEXT, allowNull: true, defaultValue: null },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  }, {
    tableName: 'audit_logs',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
  });
