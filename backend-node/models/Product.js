// =============================================================================
// backend-node/models/Product.js
// =============================================================================
const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define('Product', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    parent_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
      // Self-referential FK — defined in db.js associations
      // onDelete: SET NULL | onUpdate: CASCADE
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    sale_price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0.00,
    },
    cost_price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0.00,
    },
    image_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    version: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  }, {
    tableName: 'products',
    timestamps: true,
    hooks: {
      beforeUpdate(product) {
        // IMMUTABILITY GUARD
        // Only ECO approval controller sets _allowSystemUpdate = true
        if (
          product.is_active &&
          !product._allowSystemUpdate &&
          (
            product.changed('name')       ||
            product.changed('sale_price') ||
            product.changed('cost_price')
          )
        ) {
          throw new Error(
            'IMMUTABILITY_VIOLATION: Cannot directly update an active Product. Create an ECO instead.'
          );
        }
      },
    },
  });