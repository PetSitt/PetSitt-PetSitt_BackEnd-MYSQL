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
    required: true,
  },
  diaryId: {
    type: String,
    default: "",    
  },
  reservationState: {
    type: String,
    required: true,
  },
  category: {
    type: Array,
    required: true,
  },
  reservationDate: {
    type: Array,
    required: true,
  },
});

reservationSchema.virtual("reservationId").get(function () {
  return this._id.toHexString();
});
reservationSchema.set("toJSON", {
  virtuals: true,
});

module.exports = { Reservation: mongoose.model("Reservation", reservationSchema) };