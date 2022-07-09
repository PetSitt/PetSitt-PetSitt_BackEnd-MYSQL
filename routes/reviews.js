const express = require("express");
const router = express.Router();
const {User} = require("../schemas/user");
const {Pet} = require("../schemas/pet");
const {Review} = require("../schemas/review");
require("dotenv").config();


//상세보기 페이지 댓글요청 입니다. 무한스크롤 기능
router.get("/:sitterId", async (req, res) => {
  try {
    const {reviewId} = req.body;
    var reviews = await Review.find({
      _id:{$lte:reviewId},
      sitterId: req.params.sitterId
    })
    .sort({_id: -1})
    .limit(3); //검색된 것중 3개
  } catch (err) {
    res.status(400).send("DB정보를 받아오지 못했습니다.");
  }

  if (reviews.length > 0) {
    reviews = reviews.map((el) => {
      const review = {
        userName:   el.userName,
        userImage:  el.userImage,
        reviewStar: el.reviewStar,
        reviewInfo: el.reviewInfo,
        reviewDate: el.reviewDate
      }
      return review;
    });
  }

  res.status(200).send({
    reviews
  });
});


module.exports = router;