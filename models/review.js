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
          type: Sequelize.STRING,
         },
        sitterId: {
          type: Sequelize.STRING,
        },
        userName: {
          type: Sequelize.STRING,
        },
        reviewStar: {
          type: Sequelize.FLOAT, //소수점까지 나타냄
        },
        reviewInfo: { //1000글자 제한
          type: Sequelize.STRING,
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
  static associate(db) {
    Review.belongsTo(db.Reservation, { foreignKey: 'reservationId', sourceKey: 'reservationId', onDelete: 'CASCADE' });
  }
};

