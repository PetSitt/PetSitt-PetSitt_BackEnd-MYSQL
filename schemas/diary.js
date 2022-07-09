const mongoose = require("mongoose");

const diarySchema = new mongoose.Schema({
  reservationId: {
    type: String,
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
    list: {
      type: Array,
      default: [],
    },
    state: {
      type: Array,
      default: [],
    }
  },
});

diarySchema.virtual("diaryId").get(function () {
  return this._id.toHexString();
});
diarySchema.set("toJSON", {
  virtuals: true,
});

module.exports = { Diary: mongoose.model("Diary", diarySchema) };