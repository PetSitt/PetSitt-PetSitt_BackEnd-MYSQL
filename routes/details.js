const express = require("express");
const router = express.Router();
const {Pet} = require("../schemas/pet.js");
const {Sitter} = require("../schemas/sitter.js");
require("dotenv").config();

//상세페이지 불러오기
router.get("/:sitterId", async(req, res) => {
  try {
    var sitter_info = await Sitter.findById(req.params.sitterId);
    var user_info   = await User.findById(sitter_info.userId);
    var pet_info    = await Pet.find({ userId: user_info._id });

    if (!sitter_info || !user_info) {
      throw new Error();
    }
  } catch {
    return res.status(400).send({msg: "DB정보를 받아오지 못했습니다."});
  }

  let pets = [];

  if (pet_info.length > 0) {
    pets = pet_info.map((el) => {
      const pet = {
        petName:  el.petName,
        petImage: el.petImage || process.env.AWS_IP + "default.jpg",
        petAge:   el.petAge,
        petType:  el.petType
      };
      return pet;
    });
  }

  res.status(200).send({
    user: {
      userName:  user_info.userName,
      userImage: user_info.userImage || process.env.AWS_IP + "default.jpg",
      address:   user_info.address,
    },
    sitter: {
      sitterId:     sitter_info._id,
      rehireRate:   sitter_info.rehireRate,
      introTitle:   sitter_info.introTitle,
      mainImageUrl: sitter_info.mainImageUrl || [process.env.AWS_IP + "default.jpg"],
      myIntro:      sitter_info.myIntro,
      careSize:     sitter_info.careSize,
      servicePrice: sitter_info.servicePrice,
      plusService:  sitter_info.plusService,
      noDate:       sitter_info.noDate,
      x:            sitter_info.location.coordinates[0] || 0, //경도
      y:            sitter_info.location.coordinates[1] || 0, //위도
    },
    pets
  });
});


module.exports = router;