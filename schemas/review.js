const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  userId: { //사용자
    type: String,
    required: true,
  },
  userName: {
    type: String,
    required: true,
  },
  sitterId: { //돌보미
    type: String,
    required: true,
  },
  reservationId: { //예약아이디
    type: String,
    // required: true,    
  },
  reviewStar: {
    type: Number,
    required: true,
  },
  reviewInfo: { //1000글자 제한
    type: String,
    required: true,
  },
  reviewDate: {
    type: Date,
    default: new Date(),
    required: true,
  },
});

reviewSchema.virtual("reviewId").get(function () {
  return this._id.toHexString();
});
reviewSchema.set("toJSON", {
  virtuals: true,
});
module.exports = { Review: mongoose.model("Review", reviewSchema) };