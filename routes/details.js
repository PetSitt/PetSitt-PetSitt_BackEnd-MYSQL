// const express = require("express");
// const router = express.Router();
// const {User} = require("../schemas/user.js");
// const {Pet} = require("../schemas/pet.js");
// const {Sitter} = require("../schemas/sitter.js");
// require("dotenv").config();

<<<<<<< HEAD
// //상세페이지 불러오기
// router.get("/:sitterId", async(req, res) => {
//   try {
//     var sitter_info = await Sitter.findById(req.params.sitterId);
//     var user_info   = await User.findById(sitter_info.userId);
//     var pet_info    = await Pet.find(
//       { userId: user_info._id },
//       {
//         petName:    true,
//         petImage:   true,
//         petAge:     true,
//         petType:    true,
//         petWeight:  false,
//         petSpay:    false,
//         petIntro:   false,
//         userId:     false,
//       });
=======
//상세페이지 불러오기
router.get("/:sitterId", async(req, res) => {
  try {
    var sitter_info = await Sitter.findById(req.params.sitterId);
    var user_info   = await User.findById(sitter_info.userId);
    var pet_info    = await Pet.find(
      { userId: user_info._id, },
      {
        petName:    true,
        petImage:   true,
        petAge:     true,
        petType:    true,
        petId:      true,
      });
>>>>>>> 4ceab9f933bf4e4a813de60a4d2cbbdb526bbffa

//     if (!sitter_info || !user_info) {
//       throw new Error();
//     }
//   } catch {
//     return res.status(400).send({msg: "DB정보를 받아오지 못했습니다."});
//   }

<<<<<<< HEAD
//   return res.status(200).send({
//     user: {
//       userName:  user_info.userName,
//       userImage: user_info.userImage || process.env.AWS_IP + "default.jpg",
//     },
//     sitter: {
//       sitterId:     sitter_info._id,
//       rehireRate:   sitter_info.rehireRate,
//       introTitle:   sitter_info.introTitle,
//       address:      sitter_info.address,
//       mainImageUrl: sitter_info.mainImageUrl || process.env.AWS_IP + "default.jpg",
//       myIntro:      sitter_info.myIntro,
//       careSize:     sitter_info.careSize,
//       servicePrice: sitter_info.servicePrice,
//       plusService:  sitter_info.plusService,
//       noDate:       sitter_info.noDate,
//       x:            sitter_info.location.coordinates[0] || 0, //경도
//       y:            sitter_info.location.coordinates[1] || 0, //위도
//     },
//     pets: pet_info,
//   });
// });
=======
  return res.status(200).send({
    user: {
      userName:  user_info.userName,
      userImage: user_info.userImage || process.env.AWS_IP + "default.jpg",
    },
    sitter: {
      sitterId:     sitter_info._id,
      rehireRate:   sitter_info.rehireRate,
      averageStar:  sitter_info.averageStar,
      introTitle:   sitter_info.introTitle,
      address:      sitter_info.address,
      mainImageUrl: sitter_info.mainImageUrl || process.env.AWS_IP + "default.jpg",
      myIntro:      sitter_info.myIntro,
      category:     sitter_info.category,
      careSize:     sitter_info.careSize,
      servicePrice: sitter_info.servicePrice,
      plusService:  sitter_info.plusService,
      noDate:       sitter_info.noDate,
      x:            sitter_info.location.coordinates[0] || 0, //경도
      y:            sitter_info.location.coordinates[1] || 0, //위도
    },
    pets: pet_info,
  });
});
>>>>>>> 4ceab9f933bf4e4a813de60a4d2cbbdb526bbffa


// //상세보기 페이지 댓글요청 입니다. 무한스크롤 기능
// router.get("/reviews/:sitterId", async (req, res) => {
//   try {
//     const { reviewId } = req.body;
//     const { sitterId } = req.params;

<<<<<<< HEAD
//     // $lte: reviewId 를 사용하여 현재 로딩된 리뷰와 중복되지않도록 보냅니다.
//     const reviews = await Review.find(
//       {
//         _id:{ $lte: reviewId },
//         sitterId
//       }, 
//       {
//         userId:     false,
//         userName:   true,        
//         sitterId:   false,
//         reservationId: false,        
//         reviewStar: true,
//         reviewInfo: true,
//         reviewDate: true,
//       }
//     )
//     .sort({_id: -1})
//     .limit(3);
=======
    let searchQuery = null;

    if ( reviewId === 0 ) {
      searchQuery = { "sitterId": sitterId };
    } else {
      searchQuery = { "_id":{ $lt: reviewId }, "sitterId": sitterId };
    }

    // $lt: reviewId 를 사용하여 현재 로딩된 리뷰와 중복되지않도록 보냅니다.
    const reviews = await Review.find(
      searchQuery, 
      {
        userName:   true,             
        reviewStar: true,
        reviewInfo: true,
        reviewDate: true,
      }
    )
    .sort({_id: -1})
    .limit(3);
>>>>>>> 4ceab9f933bf4e4a813de60a4d2cbbdb526bbffa

//     return res.status(200).send({
//       reviews,
//     });

<<<<<<< HEAD
//   } catch (err) {
//     return res.status(400).send("DB정보를 받아오지 못했습니다.");
//   }
// });
// module.exports = router;
=======
  } catch (err) {
    return res.status(400).send("DB정보를 받아오지 못했습니다.");
  }
});

module.exports = router;
>>>>>>> 4ceab9f933bf4e4a813de60a4d2cbbdb526bbffa
