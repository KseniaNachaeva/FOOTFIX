module.exports = (sequelize, DataTypes) => {
  const Status = sequelize.define('Status', {
    ID: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    Status_name: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true
    }
  }, {
    tableName: 'Status',
    timestamps: false
  });

  Status.associate = function(models) {
    Status.hasMany(models.Orders, {
      foreignKey: 'Status_ID',
      as: 'orders'
    });
  };

  return Status;
};