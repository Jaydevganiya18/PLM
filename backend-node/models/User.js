// =============================================================================
// backend-node/models/User.js
// =============================================================================
const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('Engineering', 'Approver', 'Operations', 'Admin'),
      allowNull: false,
      defaultValue: 'Engineering',
    },
  }, {
    tableName: 'users',
    timestamps: true,
  });