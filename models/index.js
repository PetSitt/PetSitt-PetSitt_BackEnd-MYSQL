const Sequelize = require("sequelize");
const Pet = require("./pet");
const Sitter = require("./sitter");
const User = require("./user");
const Reservation = require("./reservation");
const Room = require("./room");
const Chat = require("./chat");

const env = process.env.NODE_ENV || "development";
const config = require("../config/config")[env];
const db = {};

const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  config
);

db.sequelize = sequelize;
db.Sequelize = Sequelize;

db.Pet = Pet;
db.Sitter = Sitter;
db.User = User;
db.Reservation = Reservation;
db.Room = Room;
db.Chat = Chat;

Pet.init(sequelize);
Sitter.init(sequelize);
User.init(sequelize);
Reservation.init(sequelize);
Room.init(sequelize);
Chat.init(sequelize);

Pet.associate(db);
Sitter.associate(db);
User.associate(db);
Reservation.associate(db);
Room.associate(db);
Chat.associate(db);

module.exports = db;
