const Sequelize = require('sequelize');

module.exports = class Pet extends Sequelize.Model {
    static init(sequelize) {
        return super.init({
            petId: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER,
            },
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
            petName:{
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
        Pet.belongsTo(db.User, { foreignKey: 'userId', sourceKey: 'userId', onDelete: 'CASCADE' });
    }
};
