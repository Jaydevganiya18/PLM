
const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define('BoM', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    parent_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
      // Self-referential FK — onDelete: SET NULL, onUpdate: CASCADE
    },
    version: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    // JSON Array: [{ name: string, qty: number, unit_cost: number }]
    components: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
      validate: {
        isValidComponents(value) {
          if (!Array.isArray(value))
            throw new Error('components must be an array');
          value.forEach((c, i) => {
            if (!c.name || typeof c.qty !== 'number' || typeof c.unit_cost !== 'number')
              throw new Error(
                `Component at index ${i} must have name (string), qty (number), unit_cost (number)`
              );
          });
        },
      },
    },
    // JSON Array: [{ name: string, time: number, work_center: string }]
    operations: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
      validate: {
        isValidOperations(value) {
          if (!Array.isArray(value))
            throw new Error('operations must be an array');
          value.forEach((op, i) => {
            if (!op.name || typeof op.time !== 'number' || !op.work_center)
              throw new Error(
                `Operation at index ${i} must have name (string), time (number), work_center (string)`
              );
          });
        },
      },
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  }, {
    tableName: 'boms',
    timestamps: true,
    hooks: {
      beforeUpdate(bom) {
        // IMMUTABILITY GUARD
        if (
          bom.is_active &&
          !bom._allowSystemUpdate &&
          (bom.changed('components') || bom.changed('operations'))
        ) {
          throw new Error(
            'IMMUTABILITY_VIOLATION: Cannot directly update an active BoM. Create an ECO instead.'
          );
        }
      },
    },
  });