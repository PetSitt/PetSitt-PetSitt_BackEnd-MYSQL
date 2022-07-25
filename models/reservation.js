const Sequelize = require('sequelize');

module.exports = class Reservation extends Sequelize.Model {
    static init(sequelize) {
        return super.init({
            reservationId: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER,
            },
            petId: {
                type:Sequelize.JSON
            },
            diaryId: {
                type: Sequelize.INTEGER
            },
            reservationState: {
                type: Sequelize.STRING
            },
            category: {
                type:Sequelize.JSON
            },
            reservationDate: {
                type:Sequelize.JSON
            }
        }, {
            sequelize,
            modelName: 'Reservation',
            tableName: 'reservations',
            charset: 'utf8mb4',
            collate: 'utf8mb4_general_ci'
        });
    }

    static associate(db) {
        Reservation.belongsTo(db.User, { foreignKey: 'userId', sourceKey: 'userId', onDelete: 'CASCADE' });
        Reservation.belongsTo(db.Sitter, { foreignKey: 'sitterId', sourceKey: 'sitterId', onDelete: 'CASCADE' });
        Reservation.hasOne(db.Diary, { foreignKey: 'reservationId', sourceKey: 'reservationId', onDelete:'CASCADE' });
        Reservation.hasOne(db.Review, { foreignKey: 'reservationId', sourceKey: 'reservationId', onDelete:'CASCADE' });
    }
};
