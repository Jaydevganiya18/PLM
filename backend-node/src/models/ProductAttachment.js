const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define('ProductAttachment', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    product_version_id: { type: DataTypes.INTEGER, allowNull: false },
    file_name: { type: DataTypes.STRING(255), allowNull: false },
    file_url: { type: DataTypes.STRING(1000), allowNull: false },
    uploaded_by: { type: DataTypes.INTEGER, allowNull: false },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  }, {
    tableName: 'product_attachments',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
  });
