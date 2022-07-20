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
            userId: {
                type: Sequelize.INTEGER
            },
            sitterId: {
                type: Sequelize.INTEGER
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
    }
};
