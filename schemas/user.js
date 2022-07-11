const mongoose = require("mongoose");
const UserSchema = new mongoose.Schema({
  userEmail: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  userName: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  refreshToken:{
    type: String,
   
  }
});

//UserSchema.virtual("userId").get(function () {
 // return this._id.toHexString();
//});


//UserSchema.set("toJSON", {
 // virtuals: true,
//});

//UserSchema.index({location: "2dsphere"});

UserSchema.set("toJSON", {virtuals: true,});

module.exports = mongoose.model("User", UserSchema);