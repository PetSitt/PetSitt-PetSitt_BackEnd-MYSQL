const mongoose = require("mongoose");

const petSchema = new mongoose.Schema({
  petName: {
    type: String,
    required: true,
  },
  petImage: {
    type: String,
    default: ""
  },
  petAge: {
    type: Number,
    required: true,
  },
  petWeight: {
    type: Number,
    required: true,
  },
  petSpay: {
    type: Boolean,
    default: false
  },
  petType: {
    type: String,
    required: true,
  },
  petIntro: {
    type: String,
    default: ""
  },
  userId: {
    type: String
  },
});

petSchema.virtual("petId").get(function () {
  return this._id.toHexString();
});
petSchema.set("toJSON", {
  virtuals: true,
});
module.exports = {Pet: mongoose.model('Pet', petSchema)};