const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,    
  },
  sitter_userId: {
    type: String,
    required: true,    
  },
  lastChat: {
    type: String,
    default: "",
  },
  lastChatAt: {
    type: Date,
    default: Date.now(),
  },
  newMessage: {
    type: Boolean,
    default: false,
  }
});

roomSchema.virtual("roomId").get(function () {
 return this._id.toHexString();
});

roomSchema.set("toJSON", {
 virtuals: true,
});

module.exports = { Room: mongoose.model("Room", roomSchema) };
