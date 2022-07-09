const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  category:{
    type: [String],
  },
  userEmail: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  hashPassword:{
    type: String,
  },
  userName: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String,
    required: true,
  }
});

UserSchema.virtual("userId").get(function () {
 return this._id.toHexString();
});

UserSchema.index({location: "2dsphere"});

UserSchema.set("toJSON", {virtuals: true,});

module.exports = mongoose.model("User", UserSchema);