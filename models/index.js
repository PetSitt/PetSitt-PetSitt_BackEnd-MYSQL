const Sequelize = require('sequelize');
const Pet = require('./pet');
const Sitter = require('./sitter');
const User = require('./user');
const Review = require('./review');
const Reservation = require('./reservation');

const env = process.env.NODE_ENV || 'development';
const config = require('../config/config')[env];
const db = {};

const sequelize = new Sequelize(config.database, config.username, config.password, config);

db.sequelize = sequelize;

db.Pet = Pet;
db.Sitter = Sitter;
db.User = User;
db.Review = Review;
db.Reservation = Reservation;

Pet.init(sequelize);
Sitter.init(sequelize);
User.init(sequelize);
Review.init(sequelize);
Reservation.init(sequelize);

Pet.associate(db);
Sitter.associate(db);
User.associate(db);
Review.associate(db);
Reservation.associate(db);

module.exports = db;
