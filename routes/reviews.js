const express = require("express");
const router = express.Router();
const {Review} = require("../schemas/review.js");
const {Sitter} = require("../schemas/sitter.js");
const {Reservation} = require("../schemas/reservation");
const authMiddleware = require("../middlewares/auth-middleware.js");
require("dotenv").config();

// 리뷰 작성 - 평균별점, 재고용률, 예약상태 변경
router.post("/:reservationId", authMiddleware, async (req, res) => {
  try {
    const { user } = res.locals;
    const { reservationId } = req.params;
    const { sitterId, reviewStar, reviewInfo } = req.body;

    // 리뷰 등록
    const review = new Review({
      userId: user._id,
      userName: user.userName,
      sitterId,
      reservationId,
      reviewStar,
      reviewInfo,
    });

    review.save();



    // 예약상태 변경
    await Reservation.updateOne({ reservationId }, { $set: { reservationState: "진행완료" } });

    const reviews = await Review.find({sitterId});

    if ( reviews?.length > 0 ) {
      const sitter = await Sitter.findById(sitterId);
      const totalReview = reviews.length + 1;

      //평균별점 계산 = 시터 리뷰별점 총합 / 총 리뷰수
      const sumStar = reviews.reduce((total, current) => total + current.reviewStar, 0);
      sitter.averageStar = ( (sumStar + reviewStar) / totalReview).toFixed(1); //소수점 첫째 자리까지

      //재고용률 계산 - 중복된 사람의 수를 세어 백분율(% 단위)로 기록합니다.
      // dup_members = 중복이 일어난 멤버(2번이상 고용한 사람만 들어감) 
      // cal_arr = 중복을 제외한 순수 멤버( 1번 이라도 고용한 사람 전체 )
      const dup_members = new Set();
      const pure_members = [user._id.toHexString()];
      reviews.forEach( (review) => {
        if (pure_members.includes(review.userId)) {
          dup_members.add(review.userId);
        } else {
          pure_members.push(review.userId);
        }
      }); 
      // (총리뷰수 + 중복이 일어난 멤버 - 순수 멤버 수) / 총리뷰수 * 100 = 재고용률
      sitter.rehireRate = ((totalReview + dup_members.size - pure_members.length) / totalReview * 100)?.toFixed(1);
      sitter.save();
    }

    return res.status(200).send({
      msg: "리뷰작성 완료"
    });

  } catch {
    return res.status(400).send({ 
      errorMessage: "DB정보를 받아오지 못했습니다." 
    });    
  }
});

router.get("/:reservationId", authMiddleware, async (req, res) => {
  try {
    const { reservationId } = req.params;

    const review = await Review.findOne({ reservationId });
    if (!review) {
      return res.status(402).send({ errorMessage: "등록된 리뷰가 없습니다." });
    }

    return res.status(200).send({
      star:       review.reviewStar,
      reviewinfo: review.reviewInfo,
    });

  } catch {
    return res.status(400).send({ errorMessage: "요청 실패" });
  }
});

module.exports = router;