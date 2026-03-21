const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define('EcoApproval', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    eco_id: { type: DataTypes.INTEGER, allowNull: false },
    stage_id: { type: DataTypes.INTEGER, allowNull: false },
    approver_id: { type: DataTypes.INTEGER, allowNull: false },
    action: {
      type: DataTypes.ENUM('APPROVED', 'REJECTED', 'VALIDATED'),
      allowNull: false,
    },
    comment: { type: DataTypes.TEXT, allowNull: true, defaultValue: null },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  }, {
    tableName: 'eco_approvals',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
  });
