const express = require("express");
const router = express.Router();
const { Pet } = require("../models");
const { Reservation } = require("../models");
const authMiddleware = require("../middlewares/auth-middleware.js");
const multer = require('multer');
const { Sitter } = require("../models");
const { User } = require("../models");
require("dotenv").config();

//예약하기 페이지 - 내 펫정보 요청 -- MYSQL 변경완료 / 프론트연결 테스트 x
router.get("/", authMiddleware, async (req, res) => {
  try{

    const { user } = res.locals;
    const pets = await Pet.findAll({ where: {userId: user.userId }});

    return res.status(200).send({
      pets
    });

  } catch {
    return res.send({ errorMessage: "DB정보를 받아오지 못했습니다." }); 
  }
});

//예약하기 페이지 - 예약등록 -- MYSQL 변경완료 / 프론트연결 테스트 x
router.post("/regist/:sitterId", authMiddleware, async (req, res) => {
  try{
    const { user } = res.locals;
    const { sitterId } = req.params;
    let {
      petIds,
      category,
      reservationDate,
    } = req.body;

    petIds = JSON.parse(petIds);
    category = JSON.parse(category);
    reservationDate = JSON.parse(reservationDate);
    
    if (!petIds?.length   ||
        !category?.length ||
        !reservationDate?.length) {
      return res.status(401).send({ errorMessage: "필수정보를 기입해주세요." }); 
    }

    const sitter = await Sitter.findOne({ where: {sitterId: sitterId } });
    const noDate = JSON.parse(sitter.noDate);
    if (!sitter) {
      return res.status(402).send({
        errorMessage: "돌보미정보가 없습니다.",
      });
    }

    //예약 안되는 날짜 체크
    let possible_check = false;
    reservationDate.forEach((el)=> {
      if (noDate.includes(el)) {
        possible_check = true;
      }
    });
    
    if (possible_check) {
      return res.status(403).send({
        errorMessage: "예약이 불가능한 날짜입니다.",
      });      
    }

    //예약등록
    const reservation = await Reservation.create({
      userId: user.id,
      sitterId,
      petId: petIds,
      reservationState: "진행중",
      category: category,
      reservationDate: reservationDate,
    });

    //돌보미 - 예약불가 기간에 추가해줍니다.
    reservationDate.forEach((el) => noDate.push(el));
    await Sitter.update({ noDate: noDate }, { where: {sitterId: sitterId } })

    return res.status(200).send({ msg: "예약 완료" });

  } catch {
    return res.status(400).send({ errorMessage: "요청 실패" }); 
  }
});


//예약보기 페이지 - 리스트 요청 - 첫로딩
router.get("/lists", authMiddleware, async (req, res) => {
  try{
    const { searchCase } = req.query;
    const { user } = res.locals;

    let searchQuery = null;
    let dataForm = null;

    switch (searchCase) {
      case 'user': // 사용자탭 검색
        searchQuery = { "userId": user.id };
        dataForm = setUserFormReservation; // 보내는 데이터세팅 함수
        break;

      case 'sitter': // 돌보미탭 검색
        const sitter = await Sitter.findOne({ userId: user._id });

        if (!sitter) {
          return res.status(402).send({ errorMessage: "돌보미 정보가 없습니다." });
        }

        searchQuery = { "sitterId": sitter.id };
        dataForm = setSitterFormReservation; // 보내는 데이터세팅 함수
        break;

      default:
        return res.status(403).send({ errorMessage: "잘못된 쿼리입니다." });
    }

    // 진행중인 예약
    const progressReservations = await Reservation.find({
      $and: [
        searchQuery, 
        { reservationState: "진행중" }
      ]
    })
    .sort({ _id: -1 });

    // 진행완료, 취소완료 예약
    const pastReservations = await Reservation.find({
      $and: [
        searchQuery, 
        { reservationState: { $ne: "진행중" } }, // "진행중을 제외하고"
      ]
    })
    .sort({ _id: -1 }) // 생성 최신순으로 정렬
    .limit(3);

    return res.status(200).send({
      proceedings: await dataForm(progressReservations),
      pasts: await dataForm(pastReservations),
    });

  } catch {
    return res.status(400).send({ errorMessage: "DB정보를 받아오지 못했습니다." }); 
  }
});


//예약보기 페이지 - 더보기 리스트 요청 - 무한스크롤
router.get("/lists/:reservationId", authMiddleware, async (req, res) => {
  try{
    const { user } = res.locals;
    const { reservationId } = req.params;
    const { searchCase } = req.query;

    switch (searchCase) {
      case 'user': // 사용자탭 검색
        searchQuery = { "userId": user.id };
        dataForm = setUserFormReservation;
        break;

      case 'sitter': // 돌보미탭 검색
        const sitter = await Sitter.findOne({ userId: user._id });

        if (!sitter) {
          return res.status(402).send({ errorMessage: "돌보미 정보가 없습니다." });
        }

        searchQuery = { "sitterId": sitter.id };
        dataForm = setSitterFormReservation;
        break;

      default:
        return res.status(403).send({ errorMessage: "잘못된 쿼리입니다." });
    }    

    const reserveDatas = await Reservation.find({
      $and: [
        { _id: { $lt: reservationId } }, //$lt를 이용해여 중복되지 않도록 구현
        searchQuery,
        { reservationState: { $ne: "진행중" } }, // "진행중을 제외하고"
      ]
    })
    .sort({ _id: -1 }) // 생성 최신순으로 정렬
    .limit(3);

    //mySql로 바꿀꺼니 join으로 구현 안함.
    if (!reserveDatas?.length) {
      return res.status(401).send({ errorMessage: "더이상 불러올 정보가 없습니다." });       
    }

    return res.status(200).send({
      reservations : await dataForm(reserveDatas),
    });

  } catch {
    return res.status(400).send({ errorMessage: "DB정보를 받아오지 못했습니다." }); 
  }
});

// 예약 진행중 예약 상세보기
router.get("/details/:reservationId", authMiddleware, async (req, res) => {
  try {
    const { reservationId } = req.params;
    const { searchCase } = req.query;

    // 예약, 공통정보 세팅
    const reservation = await Reservation.findById(reservationId);
    if (!reservation) { throw new Error(); }

    const sitter = await Sitter.findById(reservation.sitterId);
    if (!sitter) { throw new Error(); }

     // 각 case마다 필요한 user정보가 다릅니다.
    let user = null;

    switch (searchCase) {
      case 'user': // 신청자 입장 표기
        user = await User.findById(sitter.userId); //시터의 유저정보 - 전화번호 필요
        if (!user) { throw new Error(); }
    
        return res.status(200).send({
          sitterId:        reservation?.sitterId,
          category:        reservation?.category,
          reservationDate: reservation?.reservationDate,
          phoneNumber:     user?.phoneNumber,
          servicePrice:    sitter?.servicePrice,
        });
  
      case 'sitter': // 돌보미탭 검색

        user = await User.findById(reservation.userId); //신청자 정보 - 전화번호 필요
        if (!user) { throw new Error(); }

        const detailData = {
          category:        reservation?.category,
          reservationDate: reservation?.reservationDate,
          address:         sitter?.address,
          phoneNumber:     user?.phoneNumber,
          servicePrice:    sitter?.servicePrice,
        }

        // 신청자 서비스받는 반려견 정보세팅
        const pets = await Pet.find(
          { _id: { $in: reservation.petId } },
          {         
            petId:    false,
            petIntro: false,
            userId:   false,
            __v:      false,
          }
        );

        return res.status(200).send({
          detailData,
          pets
        });

      default:
        return res.status(403).send({ errorMessage: "잘못된 쿼리입니다." });
    }    

  } catch {
    return res.status(400).send({ errorMessage: "DB정보를 받아오지 못했습니다." }); 
  }
});


// 예약 취소
router.put("/cancel/:reservationId", authMiddleware, async (req, res) => {
  try {
    const { reservationId } = req.params;
    const reservation = await Reservation.findById(reservationId);
    if (!reservation) { throw new Error(); }

    //예약 상태 변경
    reservation.reservationState = "취소완료";
    reservation.save();

    //취소시 돌보미 예약불가 날짜 빼기
    const sitter = await Sitter.findById(reservation.sitterId);
    if (!sitter) { throw new Error(); }

    const dateArray = sitter?.noDate?.filter((el) => reservation.reservationDate.includes(el) === false );
    sitter.noDate = dateArray;
    sitter.save();

    return res.status(200).send({ msg: "예약 취소 완료" });

  } catch {
    return res.status(400).send({ errorMessage: "DB정보를 받아오지 못했습니다." }); 
  }
});

//예약 보기용 데이터 세팅 함수 - 유저탭
const setUserFormReservation = async (array) => {
  const setArray = [];

  if (!array?.length) {
  return setArray;
  } 

  for ( let i = 0; i < array.length; i++) {
      const sitter = await Sitter.findOne({ where : { sitterId: array[i].sitterId } })
      if (!sitter) continue;

      const user   = await User.findOne({ where: { userId: sitter.userId }}); //돌보미의 유저정보
      if (!user ) continue;

      const decode_category     = JSON.parse(array[i].category);
      const decode_reservationDate  = JSON.parse(array[i].reservationDate);

      const reservation = {
          category:         decode_category,
          reservationDate:  decode_reservationDate,
          reservationId:    array[i].id,
          reservationState: array[i].reservationState,
          sitterId:         array[i].sitterId,
          sitterName:       user.userName,
          imageUrl:         sitter.imageUrl,
          address:          sitter.address,
          phoneNumber:      user.phoneNumber,
      };

      setArray.push(reservation);
  }

  return setArray;
};

//예약 보기용 데이터 세팅 함수 - 돌보미탭
const setSitterFormReservation = async (array) => {
  const setArray = [];

  if (!array?.length) {
    return setArray;
  } 

  for ( let i = 0; i < array.length; i++) {
    const user   = await User.findOne({ where: { userId: User.userId }}); //신청자 유저정보
    if (!user ) continue;

    const decode_category     = JSON.parse(array[i].category);
    const decode_reservationDate  = JSON.parse(array[i].reservationDate);

    const reservation = {
      category:         decode_category,
      reservationDate:  decode_reservationDate,
      reservationId:    array[i].id,
      reservationState: array[i].reservationState,
      sitterId:         array[i].sitterId,
      userName:         user.userName,
      phoneNumber:      user.phoneNumber,
    };

    setArray.push(reservation);
  }
  
  return setArray;
};

module.exports = router;