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
        checkStatus:{
            type:Sequelize.JSON,
        }
        }, {
            sequelize,
            modelName: 'Diary',
            tableName: 'diaries',
            charset: 'utf8mb4',
            collate: 'utf8mb4_general_ci'
        });
    }

    static associate(db) {
        Diary.belongsTo(db.Reservation, { foreignKey: 'reservationId', sourceKey: 'reservationId', onDelete: 'CASCADE' });
        
    }
};
