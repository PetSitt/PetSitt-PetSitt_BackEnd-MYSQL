<<<<<<< HEAD
'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.json')[env];
const db = {};

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});
=======
const Sequelize = require('sequelize');
const Pet = require('./pet');
const Sitter = require('./sitter');

const env = process.env.NODE_ENV || 'development';
const config = require('../config/config')[env];
const db = {};

const sequelize = new Sequelize(config.database, config.username, config.password, config);
>>>>>>> 320cb04293f71e8e0cdbbc2b78c05b83fb68a56f

db.sequelize = sequelize;
db.Sequelize = Sequelize;

<<<<<<< HEAD
=======
db.Pet = Pet;
db.Sitter = Sitter;

Pet.init(sequelize);
Sitter.init(sequelize);

Pet.associate(db);
Sitter.associate(db);

>>>>>>> 320cb04293f71e8e0cdbbc2b78c05b83fb68a56f
module.exports = db;
