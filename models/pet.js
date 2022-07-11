const Sequelize = require('sequelize');

module.exports = class Pet extends Sequelize.Model {
    static init(sequelize) {
        return super.init({
            petImage: {
                type: Sequelize.STRING
            },
            petAge: {
                type: Sequelize.INTEGER
            },
            petWeight: {
                type: Sequelize.INTEGER
            },
            petSpay: {
                type: Sequelize.BOOLEAN
            },
            petType: {
                type: Sequelize.STRING
            },
            petIntro: {
                type: Sequelize.STRING
            },
            userId: {
                type: Sequelize.STRING
            }
        }, {
            sequelize,
            modelName: 'Pet',
            tableName: 'pets',
            charset: 'utf8mb4',
            collate: 'utf8mb4_general_ci'
        });
    }

    static associate(db) {
    }
};