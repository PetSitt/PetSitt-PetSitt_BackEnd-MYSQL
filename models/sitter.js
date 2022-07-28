const Sequelize = require('sequelize');
module.exports = class Sitter extends Sequelize.Model {
  static init(sequelize) {
    return super.init(
      {
        sitterId: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER,
        },
        address: {
          type: Sequelize.STRING,
          defaultValue: '',
        },
        detailAddress: {
          type: Sequelize.STRING,
          defaultValue: '',
        },
        sitterName: {
          type: Sequelize.STRING,
          defaultValue: '',
        },
        imageUrl: {
          type: Sequelize.STRING,
          defaultValue: '',
        },
        mainImageUrl: {
          type: Sequelize.STRING,
          defaultValue: '',
        },
        introTitle: {
          type: Sequelize.STRING,
          defaultValue: '',
        },
        myIntro: {
          type: Sequelize.STRING,
          defaultValue: '',
        },
        careSize: {
          type: Sequelize.JSON,
        },
        category: {
          type: Sequelize.JSON,
        },
        plusService: {
          type: Sequelize.JSON,
        },
        noDate: {
          type: Sequelize.JSON,
        },
        servicePrice: {
          type: Sequelize.INTEGER,
          defaultValue: 0,
        },
        averageStar: {
          type: Sequelize.FLOAT,
          defaultValue: 0,
        },
        region_1depth_name: {
          type: Sequelize.STRING,
          defaultValue: '',
        },
        region_2depth_name: {
          type: Sequelize.STRING,
          defaultValue: '',
        },
        region_3depth_name: {
          type: Sequelize.STRING,
          defaultValue: '',
        },
        location: {
          type: Sequelize.GEOMETRY('POINT'),
        },
        rehireRate: {
          type: Sequelize.INTEGER,
          defaultValue: 0,
        },
        zoneCode: {
          type: Sequelize.STRING,
        },
        reviewCount: {
          type: Sequelize.INTEGER,
          defaultValue: 0,
        },
      },
      {
        sequelize,
        modelName: 'Sitter',
        tableName: 'sitters',
        charset: 'utf8mb4',
        collate: 'utf8mb4_general_ci',
      }
    );
  }

  static associate(db) {
    Sitter.belongsTo(db.User, {
      foreignKey: 'userId',
      sourceKey: 'userId',
      onDelete: 'CASCADE',
    });
    Sitter.hasMany(db.Reservation, {
      foreignKey: 'sitterId',
      sourceKey: 'sitterId',
      onDelete: 'CASCADE',
    });
  }
};
