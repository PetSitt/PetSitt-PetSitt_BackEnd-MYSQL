const mongoose = require("mongoose");
const { Types: { ObjectId } } = mongoose.Schema;

const reservationSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  sitterId: {
    type: String,
    required: true
  },
  petId: {
    type: Array,
    default: [],
  },
  category: {
    type: Array,
    required: true,
  },
  reservationDate: {
    type: Array,
    required: true,
  },
  diaryImage: {
    type: Array,
    default:[],
  },
  diaryInfo: {
    type: String,
    default: ""
  },
  checkList: {
    type: Array,
    default: []
  },
});

reservationSchema.virtual("reservationId").get(function () {
  return this._id.toHexString();
});
reservationSchema.set("toJSON", {
  virtuals: true,
});

module.exports = { Reservation: mongoose.model("Reservation", reservationSchema) };