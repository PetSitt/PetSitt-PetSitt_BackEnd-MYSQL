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
<<<<<<< HEAD
<<<<<<< HEAD
};
=======
};
>>>>>>> 320cb04293f71e8e0cdbbc2b78c05b83fb68a56f
=======
};
>>>>>>> b4e9707d8e18c2f92e288b63a07e4d6604718b30
