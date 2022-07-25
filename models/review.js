const Sequelize = require("sequelize");
module.exports = class Review extends Sequelize.Model {
  static init(sequelize) {
    return super.init(
      {
        reviewId:{
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: Sequelize.INTEGER,
         },
          userId: {
          type: Sequelize.INTEGER,
         },
          sitterId: {
            type: Sequelize.INTEGER,
         },
          userName: {
            type: Sequelize.STRING,
          },
          reservationId: { //예약아이디
            type: Sequelize.STRING,
          },
          reviewStar: {
            type: Sequelize.FLOAT, //소수점까지 나타냄
            defaultValue: 0,
          },
          reviewInfo: { //1000글자 제한
            type: Sequelize.STRING,
            defaultValue: "",
          },
          reviewDate: {
            type: Sequelize.DATE,
            defaultValue:  Sequelize.NOW,
          },
      },
      {
        sequelize,
        modelName: "Review",
        tableName: "reviews",
        charset: "utf8mb4",
        collate: "utf8mb4_general_ci",
      }
    );
  }
  static associate(db) {}
};
