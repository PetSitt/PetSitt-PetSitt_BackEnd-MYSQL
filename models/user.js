'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  User.init({
<<<<<<< HEAD
    userId: {
      primaryKey: true,
      type: DataTypes.INTEGER,
    },
    email: DataTypes.STRING,
    nickname: DataTypes.STRING,
    password: DataTypes.STRING
=======
    id: {
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
    type: DataTypes.INTEGER,
  },
  userEmail: {
    type: DataTypes.STRING
  },
  password: {
    type: DataTypes.STRING
  },
  userName: {
    type: DataTypes.STRING
  },
  phoneNumber: {
    type: DataTypes.STRING
  },
  refreshToken: {
  allowNull: true,
   type: DataTypes.STRING
  },
  createdAt: {
    allowNull: false,
    type: DataTypes.DATE
  },
  updatedAt: {
    allowNull: false,
    type: DataTypes.DATE
  }
>>>>>>> 66cb0d1b38835e3251fc10012c0eb0b42f62b78e
  }, {
    sequelize,
    modelName: 'User',
  });
  return User;
<<<<<<< HEAD
};
=======
};

>>>>>>> 66cb0d1b38835e3251fc10012c0eb0b42f62b78e
