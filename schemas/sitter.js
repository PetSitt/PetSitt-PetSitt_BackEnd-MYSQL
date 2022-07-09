const mongoose = require("mongoose");

const SitterSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  address: {
    type: String,
    default: ""
  },
  detailAddress: {
    type: String,
    default: ""
  },
  imageUrl: {
    type: String,
    default: ""
  },
  mainImageUrl: {
    type: String,
    default: ""
  },
  introTitle: {
    type: String,
    default: ""
  },
  myIntro: {
    type: String,
    default: ""
  },
  careSize: {
    type: Array,
    default: []
  },
  category:{
    type: Array,
    default: []
  },
  servicePrice: {
    type: Number,
    default: 0,
  },
  plusService: {
    type: Array,
    default: []
  },
  noDate: {
    type: Array,
    default: []
  },
  averageStar:{
    type: Number,
    // required: true,
  },
  region_1depth_name: { // 도, 시 
    type: String,
    default: ""
  },
  region_2depth_name: { // 시, 군, 구 (시 가 2번에 내려올때도 있습니다. 규모에 따라 달라요)
    type: String,
    default: ""
  },
  region_3depth_name: { // 동, 리
    type: String,
    default: ""
  },  
  location: { //Point [ longitude, latitude ]  경도 위도 순서
    type: {
      type: String,
      default: "Point"
    },
    coordinates: {
      type: [Number]
    }
  },
  rehireRate: {
    type: Number,
    default: 0,
  }
});

SitterSchema.virtual("sitterId").get(function () {
  return this._id.toHexString();
});
SitterSchema.set("toJSON", {
  virtuals: true,
});
SitterSchema.index({location: "2dsphere"});

module.exports = { Sitter: mongoose.model("Sitter", SitterSchema) };