module.exports = (sequelize, DataTypes) => {
  const Order_services = sequelize.define('Order_services', {
    Orders_ID: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      references: {
        model: 'Orders',
        key: 'ID'
      }
    },
    Services_ID: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      references: {
        model: 'Services',
        key: 'ID'
      }
    },
    Quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    Price_per_unit: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    }
  }, {
    tableName: 'Order_services',
    timestamps: false
  });

  return Order_services;
};