const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define('EcoStage', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(200), allowNull: false, unique: true },
    sequence_no: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    approval_required: { type: DataTypes.BOOLEAN, allowNull: false },
    is_start_stage: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    is_final_stage: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    created_by: { type: DataTypes.INTEGER, allowNull: false },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE },
  }, {
    tableName: 'eco_stages',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });
