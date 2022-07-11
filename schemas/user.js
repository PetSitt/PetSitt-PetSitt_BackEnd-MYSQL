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

UserSchema.virtual("userId").get(function () {
 return this._id.toHexString();
});

<<<<<<< HEAD
UserSchema.index({location: "2dsphere"});

UserSchema.set("toJSON", {virtuals: true,});

module.exports = mongoose.model("User", UserSchema);
=======
UserSchema.set("toJSON", {
 virtuals: true,
});

module.exports = { User: mongoose.model("User", UserSchema) };
>>>>>>> 320cb04293f71e8e0cdbbc2b78c05b83fb68a56f
