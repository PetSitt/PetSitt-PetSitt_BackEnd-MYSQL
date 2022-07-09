const Sequelize = require('sequelize');

module.exports = class Sitter extends Sequelize.Model {
    static init(sequelize) {
        return super.init({
            userId: {
                type: Sequelize.STRING
            },
            address: {
              type: Sequelize.STRING,
              defaultValue:""
            },
            detailAddress:{
              type: Sequelize.STRING,
              defaultValue:""
            },
            imageUrl:{
              type: Sequelize.STRING,
              defaultValue:""
            },
            mainImageUrl:{
              type: Sequelize.STRING,
              defaultValue:""
            },
            introTitle:{
              type: Sequelize.STRING,
              defaultValue:""
            },
            myIntro:{
              type: Sequelize.STRING,
              defaultValue:""
            },
            careSize: {
              type:Sequelize.JSON,
            },
            category: {
              type:Sequelize.JSON,
            },
            plusService: {
              type:Sequelize.JSON,
            },
            noDate: {
              type:Sequelize.JSON,
            },
            sevicePrice: {
              type: Sequelize.INTEGER,
              defaultValue:0
            },
            averageStar: {
              type: Sequelize.INTEGER,
              defaultValue:0
            },
            region_1depth_name:{
              type: Sequelize.STRING,
              defaultValue:""
            },
            region_2depth_name:{
              type: Sequelize.STRING,
              defaultValue:""
            },
            region_3depth_name:{
              type: Sequelize.STRING,
              defaultValue:""
            },
            location: {
<<<<<<< HEAD
<<<<<<< HEAD
              type:Sequelize.GEOMETRY('POINT')
            },
=======
              type: Sequelize.GEOMETRY('POINT')
            },
            
>>>>>>> 320cb04293f71e8e0cdbbc2b78c05b83fb68a56f
=======
              type:Sequelize.GEOMETRY('POINT')
            },
>>>>>>> b4e9707d8e18c2f92e288b63a07e4d6604718b30
            rehireRate: {
              type: Sequelize.INTEGER,
              defaultValue:0
            },
            zoneCode: {
              type: Sequelize.STRING,
<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> b4e9707d8e18c2f92e288b63a07e4d6604718b30
            },
            userName: {
              type: Sequelize.STRING,
            },
            gender: {
              type: Sequelize.STRING,
<<<<<<< HEAD
=======
>>>>>>> 320cb04293f71e8e0cdbbc2b78c05b83fb68a56f
=======
>>>>>>> b4e9707d8e18c2f92e288b63a07e4d6604718b30
            }
        }, {
            sequelize,
            modelName: 'Sitter',
            tableName: 'sitters',
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
