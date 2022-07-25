const Sequelize = require("sequelize");
module.exports = class User extends Sequelize.Model {
  static init(sequelize) {
    return super.init(
      {
        userId: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER,
        },
        userEmail: {
          type: Sequelize.STRING,
        },
        password: {
          type: Sequelize.STRING,
          defaultValue: "",
        },
        userName: {
          type: Sequelize.STRING,
          defaultValue: "",
        },
        phoneNumber: {
          type: Sequelize.STRING,
          defaultValue: "",
        },
        refreshToken: {
          type: Sequelize.STRING,
          defaultValue: "",
        },
      },
      {
        sequelize,
        modelName: "User",
        tableName: "Users",
        charset: "utf8mb4",
        collate: "utf8mb4_general_ci",
      }
    );
  }


    static associate(db) {
      User.hasMany(db.Pet, { foreignKey: 'userId', sourceKey: 'userId', onDelete:'CASCADE' });
      User.hasMany(db.Reservation, { foreignKey: 'userId', sourceKey: 'userId', onDelete:'CASCADE' });
      User.hasOne(db.Sitter, { foreignKey: 'userId', sourceKey: 'userId', onDelete:'CASCADE' });
    }

};
