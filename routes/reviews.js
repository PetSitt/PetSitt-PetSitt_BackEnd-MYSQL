const express = require("express");
const router = express.Router();

const { Sitter, Review, Reservation } = require("../models");
const authMiddleware = require("../middlewares/auth-middleware");
require("dotenv").config();

// 리뷰 작성 - 평균별점, 재고용률, 예약상태 변경
router.post("/:reservationId", authMiddleware, async (req, res) => {
  try {
    const { user } = res.locals;
    const { reservationId } = req.params;
    const { sitterId, reviewStar, reviewInfo } = req.body;

    // 리뷰 등록
    const review = new Review({
      userId: user.userEmail,
      userName: user.userName,
      sitterId,
      reservationId,
      reviewStar,
      reviewInfo,
    });
    review.save();


    // 예약상태변경
    await Reservation.update(
      { reservationState: "진행완료" },
      { where: { reservationId:reservationId } }
    );

    const reviews = await Review.findAll({ where: { sitterId: sitterId } });

    let totalCount=0;
    let total = 0;
    for(let i=0; i<reviews.length; i++){
      total = total + reviews[i].reviewStar;
      totalCount++;
    }

    if (reviews?.length > 0) {
      await Sitter.findByPk(sitterId);

      const totalReview = reviews.length + 1;

      //  평균별점 계산 = 시터 리뷰별점 총합 / 총 리뷰수
      // const sumStar = reviews.reduce(
      //   (total, current) => total + current.reviewStar,
      //   0
      // );
      // await Sitter.update(
      //   { averageStar: ((sumStar + reviewStar) / totalReview).toFixed(1) },
      //   { where: { sitterId: sitterId } }
      // );

    const averageStar = (total / totalCount).toFixed(1);
    await Sitter.update({averageStar: averageStar},{where: {sitterId: sitterId}});

      //재고용률 계산 - 중복된 사람의 수를 세어 백분율(% 단위)로 기록합니다.
      // dup_members = 중복이 일어난 멤버(2번이상 고용한 사람만 들어감)
      // cal_arr = 중복을 제외한 순수 멤버( 1번 이라도 고용한 사람 전체 )
      const dup_members = new Set();
      const pure_members = [user.userEmail];
      reviews.forEach((review) => {
        if (pure_members.includes(review.userId)) {
          dup_members.add(review.userId);
        } else {
          pure_members.push(review.userId);
        }
      }); 

      // (총리뷰수 + 중복이 일어난 멤버 - 순수 멤버 수) / 총리뷰수 * 100 = 재고용률
      await Sitter.update(
        {
          rehireRate: (
            ((totalReview + dup_members.size - pure_members.length) /
              totalReview) *
            100
          )?.toFixed(1),
        },
        { where: { sitterId:sitterId } }
      );
      

      //리뷰 카운트 추가
      // await Sitter.update(
      //   { reviewCount: 1 },
      //   { where: { sitterId:sitterId } }
      // );
      
      await Sitter.update(
        {
          reviewCount: totalCount
        },
        { where: { sitterId:sitterId } }
      );
    }

    return res.status(200).send({
      msg: "리뷰작성 완료",
    });
  } catch (err) {
    console.log(err);
    return res.status(400).send({
      errorMessage: "DB정보를 받아오지 못했습니다.",
    });
  }
});

//리뷰 상세보기
router.get("/:reservationId", authMiddleware, async (req, res) => {
  try {
    const { reservationId } = req.params;

    const review = await Review.findOne({ where: { reservationId:reservationId } });
    if (!review) {
      return res.status(402).send({ errorMessage: "등록된 리뷰가 없습니다." });
    }
    return res.status(200).send({
      star: review.reviewStar,
      reviewinfo: review.reviewInfo,
    });
  } catch {
    return res.status(400).send({ errorMessage: "요청 실패" });
  }
});


module.exports = router;

