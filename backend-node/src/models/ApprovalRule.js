const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define('ApprovalRule', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    stage_id: { type: DataTypes.INTEGER, allowNull: false },
    approver_role: {
      type: DataTypes.ENUM('ADMIN', 'APPROVER'),
      allowNull: false,
    },
    min_approvals: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE },
  }, {
    tableName: 'approval_rules',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });
