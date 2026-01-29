module.exports = (sequelize, DataTypes) => {
  const Role = sequelize.define('Role', {
    ID: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    Role_name: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true
    }
  }, {
    tableName: 'Role',
    timestamps: false
  });

  Role.associate = function(models) {
    Role.hasMany(models.Users, {
      foreignKey: 'Role_ID',
      as: 'users'
    });
  };

  return Role;
};