module.exports = (sequelize, DataTypes) => {
  const Services = sequelize.define('Services', {
    ID: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    Service_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    Price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    Description: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'Services',
    timestamps: false
  });

  Services.associate = function(models) {
    Services.belongsToMany(models.Orders, {
      through: models.Order_services,
      foreignKey: 'Services_ID',
      otherKey: 'Orders_ID',
      as: 'orders'
    });
  };

  return Services;
};