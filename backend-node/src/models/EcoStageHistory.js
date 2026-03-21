const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define('EcoStageHistory', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    eco_id: { type: DataTypes.INTEGER, allowNull: false },
    from_stage_id: { type: DataTypes.INTEGER, allowNull: true, defaultValue: null },
    to_stage_id: { type: DataTypes.INTEGER, allowNull: true, defaultValue: null },
    action: { type: DataTypes.STRING(100), allowNull: false },
    acted_by: { type: DataTypes.INTEGER, allowNull: false },
    comment: { type: DataTypes.TEXT, allowNull: true, defaultValue: null },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  }, {
    tableName: 'eco_stage_history',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
  });
