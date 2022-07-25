const Sequelize = require('sequelize');
module.exports = class Diary extends Sequelize.Model {
    static init(sequelize) {
        return super.init({
          diaryId: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: Sequelize.INTEGER,
          },
          reservationId: {
            type: Sequelize.STRING,
            defaultValue:""
          },
          diaryImage: {
            type:Sequelize.JSON,
          },
          diaryInfo: {
              type: Sequelize.STRING,
              defaultValue:""
            },
            checkList:{
              type:Sequelize.JSON,
            },
            state:{
              type:Sequelize.JSON,
            },
        }, {
            sequelize,
            modelName: 'Diary',
            tableName: 'diaries',
            charset: 'utf8mb4',
            collate: 'utf8mb4_general_ci'
        });
    }

    static associate(db) {
    }
};