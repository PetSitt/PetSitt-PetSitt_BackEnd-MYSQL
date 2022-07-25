const Sequelize = require("sequelize");

module.exports = class Chat extends Sequelize.Model {
  static init(sequelize) {
    return super.init(
      {
        chatId: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER,
        },
        roomId: {
          allowNull: false,
          type: Sequelize.STRING,
        },
        userId: {
          allowNull: false,
          type: Sequelize.STRING,
        },
        userName: {
          allowNull: false,
          type: Sequelize.STRING,
        },
        chatText: {
          allowNull: false,
          type: Sequelize.STRING,
          defaultValue: "",
        },
        createdAt: {
          allowNull: false,
          type: Sequelize.DATE,
          defaultValue: Sequelize.NOW,
        },
        newMessage: {
          type: Sequelize.BOOLEAN,
          defaultValue: true,
        },
      },
      {
        sequelize,
        modelName: "Chat",
        tableName: "chats",
        charset: "utf8mb4",
        collate: "utf8mb4_general_ci",
      }
    );
  }

  static associate(db) {}
};
