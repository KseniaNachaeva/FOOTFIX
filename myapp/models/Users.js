module.exports = (sequelize, DataTypes) => {
  const Users = sequelize.define('Users', {
    ID: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    Role_ID: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'Role',
        key: 'ID'
      }
    },
    Full_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    Telephone: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    Email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true
    },
    Password: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      allowNull: false,
      defaultValue: 'active'
    }
  }, {
    tableName: 'Users',
    timestamps: false
  });

  Users.associate = function(models) {
    Users.belongsTo(models.Role, {
      foreignKey: 'Role_ID',
      as: 'role'
    });
    Users.hasMany(models.Orders, {
      foreignKey: 'Users_ID',
      as: 'orders'
    });
  };

  return Users;
};