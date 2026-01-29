module.exports = (sequelize, DataTypes) => {
  const Orders = sequelize.define('Orders', {
    ID: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    Users_ID: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'ID'
      }
    },
    Status_ID: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'Status',
        key: 'ID'
      }
    },
    Date_of_creation: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    Total_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    }
  }, {
    tableName: 'Orders',
    timestamps: false
  });

  Orders.associate = function(models) {
    Orders.belongsTo(models.Users, {
      foreignKey: 'Users_ID',
      as: 'user'
    });
    Orders.belongsTo(models.Status, {
      foreignKey: 'Status_ID',
      as: 'status'
    });
    Orders.belongsToMany(models.Services, {
      through: models.Order_services,
      foreignKey: 'Orders_ID',
      otherKey: 'Services_ID',
      as: 'services'
    });
  };

  return Orders;
};