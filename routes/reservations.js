const express = require("express");
const router = express.Router();
const {User} = require("../schemas/user");
const {Pet} = require("../schemas/pet");
const {Review} = require("../schemas/review");
const {Reservation} = require("../schemas/reservation");
require("dotenv").config();

//예약하기 첫페이지, 내 펫정보 요청
router.get("/", /*authMiddleware,*/async (req, res) => {
  //const user = res.locals.user; 
  const pets = await Pet.find({/*userId: user._id*/});

  res.status(200).send({
    msg: "성공"
  });
});


module.exports = router;