const express = require('express');
const router = express.Router();
const { Pet } = require('../models');
const { Reservation } = require('../models');
const authMiddleware = require('../middlewares/auth-middleware.js');
const multer = require('multer');
const { Sitter } = require('../models');
const { User } = require('../models');
require('dotenv').config();
const { Op } = require('sequelize');

//예약하기 페이지 - 내 펫정보 요청 
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { user } = res.locals;
    const pets = await Pet.findAll({ where: { userId: user.userId } });

    return res.status(200).send({ pets });
  } catch {
    return res.send({ errorMessage: 'DB정보를 받아오지 못했습니다.' });
  }
});

//예약하기 페이지 - 예약등록

router.post('/regist/:sitterId', authMiddleware, async (req, res) => {
  try {
    const { user } = res.locals;
    const { sitterId } = req.params;
    let { petIds, category, reservationDate } = req.body;

    if (!petIds?.length || !category?.length || !reservationDate?.length) {
      return res.status(401).send({ errorMessage: '필수정보를 기입해주세요.' });
    }
    const sitter = await Sitter.findOne({ where: { sitterId: sitterId } });
    const noDate = sitter.noDate;
    if (!sitter) {
      return res.status(402).send({ errorMessage: '돌보미정보가 없습니다.' });
    }

    //예약 안되는 날짜 체크
    let possible_check = false;
    reservationDate.forEach((el) => {
      if (noDate.includes(el)) {
        possible_check = true;
      }
    });

    if (possible_check) {
      return res
        .status(403)
        .send({ errorMessage: '예약이 불가능한 날짜입니다.' });
    }

    //예약등록
    const reservation = await Reservation.create({
      userId: user.userId,
      sitterId,
      petId: petIds,
      reservationState: '진행중',
      category: category,
      reservationDate: reservationDate,
    });

    //돌보미 - 예약불가 기간에 추가
    reservationDate.forEach((el) => noDate.push(el));
    await Sitter.update({ noDate: noDate }, { where: { sitterId: sitterId } });
    return res.status(200).send({ msg: '예약 완료' });
  } catch {
    return res.status(400).send({ errorMessage: '요청 실패' });
  }
});

//예약보기 페이지 
router.get('/lists', authMiddleware, async (req, res) => {
  try {
    const { searchCase } = req.query;
    const { user } = res.locals;

    let searchQuery = null;
    let dataForm = null;
    let pastReservations = null;

    let progressReservations = null;
    if (searchCase === 'sitter') {
      var sitt = await Sitter.findOne({ where: { userId: user.userId } });
    }

    switch (searchCase) {
      case 'user': // 사용자탭 검색
        searchQuery = { userId: user.userId };
        dataForm = setUserFormReservation; // 보내는 데이터세팅 함수
        break;

      case 'sitter': // 돌보미탭 검색
        const sitter = await Sitter.findOne({ where: { userId: user.userId } });

        if (!sitter) {
          return res
            .status(402)
            .send({ errorMessage: '돌보미 정보가 없습니다.' });
        }

        searchQuery = { sitterId: sitter.sitterId };
        dataForm = setSitterFormReservation; // 보내는 데이터세팅 함수
        break;

      default:
        return res.status(403).send({ errorMessage: '잘못된 쿼리입니다.' });
    }

    // 진행완료, 취소완료 예약
    if (searchCase === 'user') {
      pastReservations = await Reservation.findAll({
        limit: 3,
        order: [['reservationId', 'desc']],
        where: {
          userId: user.userId,
          reservationState: { [Op.not]: '진행중' },
        },
      });
      progressReservations = await Reservation.findAll({
        where: {
          userId: user.userId,
          reservationState: '진행중',
        },
      });
    }

    if (searchCase === 'sitter') {
      pastReservations = await Reservation.findAll({
        limit: 3,
        order: [['reservationId', 'desc']],
        where: {
          sitterId: sitt.sitterId,
          reservationState: { [Op.not]: '진행중' },
        },
      });
      progressReservations = await Reservation.findAll({
        where: {
          sitterId: sitt.sitterId,
          reservationState: '진행중',
        },
      });
    }

    return res.status(200).send({
      proceedings: await dataForm(progressReservations),
      pasts: await dataForm(pastReservations),
    });
  } catch {
    return res
      .status(400)
      .send({ errorMessage: 'DB정보를 받아오지 못했습니다.' });
  }
});

//예약보기 페이지 
router.get('/lists/:reservationId', authMiddleware, async (req, res) => {
  try {
    const { user } = res.locals;
    const { reservationId } = req.params;
    const { searchCase } = req.query;
    let sitt2 = await Sitter.findOne({ where: { userId: user.userId } });
    switch (searchCase) {
      case 'user': // 사용자탭 검색
        searchQuery = { userId: user.userId };
        dataForm = setUserFormReservation;
        break;

      case 'sitter': // 돌보미탭 검색
        const sitter = await Sitter.findOne({
          where: { userId: user.userId },
        });

        if (!sitter) {
          return res
            .status(402)
            .send({ errorMessage: '돌보미 정보가 없습니다.' });
        }

        searchQuery = { sitterId: sitter.sitterId };
        dataForm = setSitterFormReservation;
        break;

      default:
        return res.status(403).send({ errorMessage: '잘못된 쿼리입니다.' });
    }

    if (searchCase === 'user') {
      var reserveDatas = await Reservation.findAll({
        limit: 3,
        order: [['reservationId', 'desc']],
        where: {
          userId: user.userId,
          reservationId: reservationId,
          reservationState: {
            [Op.not]: '진행중',
          },
          reservationId: { [Op.lt]: reservationId },
        },
      });
    }

    if (searchCase === 'sitter') {
      var reserveDatas = await Reservation.findAll({
        limit: 3,
        order: [['reservationId', 'desc']],
        where: {
          sitterId: sitt2.sitterId,
          reservationId: reservationId,
          reservationState: {
            [Op.not]: '진행중',
          },
          reservationId: { [Op.lt]: reservationId },
        },
      });
    }

    if (!reserveDatas?.length) {
      return res
        .status(401)
        .send({ errorMessage: '더이상 불러올 정보가 없습니다.' });
    }

    return res.status(200).send({
      reservations: await dataForm(reserveDatas),
    });
  } catch {
    return res
      .status(400)
      .send({ errorMessage: 'DB정보를 받아오지 못했습니다.' });
  }
});

// 예약 진행중 예약 상세보기 
router.get('/details/:reservationId', authMiddleware, async (req, res) => {
  try {
    const { reservationId } = req.params;
    const { searchCase } = req.query;

    // 예약, 공통정보 세팅
    const reservation = await Reservation.findOne({
      where: { reservationId: reservationId },
    });
    if (!reservation) {
      throw new Error();
    }

    const sitter = await Sitter.findOne({
      where: { sitterId: reservation.sitterId },
    });
    if (!sitter) {
      throw new Error();
    }

    // 각 case마다 필요한 user정보가 다릅니다.
    let user = null;

    switch (searchCase) {
      case 'user': // 신청자 입장 표기
        user = await User.findOne({ where: { userId: sitter.userId } }); //시터의 유저정보 - 전화번호 필요
        if (!user) {
          throw new Error();
        }

        return res.status(200).send({
          sitterId: reservation?.sitterId,
          category: reservation?.category,
          reservationDate: reservation?.reservationDate,
          reservationState: reservation?.reservationState,
          phoneNumber: user?.phoneNumber,
          servicePrice: sitter?.servicePrice,
          sitterName: sitter?.sitterName,
        });

      case 'sitter': // 돌보미탭 검색
        user = await User.findOne({
          where: { userId: reservation.userId },
        }); //신청자 정보 - 전화번호 필요
        if (!user) {
          throw new Error();
        }

        const detailData = {
          category: reservation?.category,
          reservationDate: reservation?.reservationDate,
          category: reservation?.category,
          reservationState: reservation?.reservationState,
          address: sitter?.address,
          phoneNumber: user?.phoneNumber,
          servicePrice: sitter?.servicePrice,
          userName: user?.userName,
        };
        // 신청자 서비스받는 반려견 정보세팅
        const pets = await Pet.findAll({
          where: {
            petId: {
              [Op.in]: reservation.petId,
            },
          },
        });

        return res.status(200).send({
          detailData,
          pets,
        });

      default:
        return res.status(403).send({ errorMessage: '잘못된 쿼리입니다.' });
    }
  } catch {
    return res
      .status(400)
      .send({ errorMessage: 'DB정보를 받아오지 못했습니다.' });
  }
});

// 예약 취소
router.put('/cancel/:reservationId', authMiddleware, async (req, res) => {
  try {
    const { reservationId } = req.params;
    const reservation = await Reservation.findOne({
      where: { reservationId: reservationId },
    });
    if (!reservation) {
      throw new Error();
    }

    //예약 상태 변경
    await Reservation.update(
      { reservationState: '취소완료' },
      { where: { reservationId: reservationId } }
    );

    //취소시 돌보미 예약불가 날짜 빼기
    const sitter = await Sitter.findOne({
      where: { sitterId: reservation.sitterId },
    });
    if (!sitter) {
      throw new Error();
    }

    const dateArray = sitter?.noDate?.filter(
      (el) => reservation.reservationDate.includes(el) === false
    );
    await Sitter.update(
      { noDate: dateArray },
      { where: { sitterId: reservation.sitterId } }
    );

    return res.status(200).send({ msg: '예약 취소 완료' });
  } catch {
    return res
      .status(400)
      .send({ errorMessage: 'DB정보를 받아오지 못했습니다.' });
  }
});

//예약 보기용 데이터 세팅 함수 - 유저탭
const setUserFormReservation = async (array) => {
  const setArray = [];

  if (!array?.length) {
    return setArray;
  }

  for (let i = 0; i < array.length; i++) {
    const sitter = await Sitter.findOne({
      where: { sitterId: array[i].sitterId },
    });
    if (!sitter) continue;

    const user = await User.findOne({ where: { userId: sitter.userId } }); //돌보미의 유저정보
    if (!user) continue;

    const diaryExist = array[i].diaryId ? true : false;

    const reservation = {
      category: array[i].category,
      reservationDate: array[i].reservationDate,
      reservationId: array[i].reservationId,
      reservationState: array[i].reservationState,
      sitterId: array[i].sitterId,
      sitterName: sitter.sitterName,
      imageUrl: sitter.imageUrl,
      address: sitter.address,
      phoneNumber: user.phoneNumber,
      diaryExist,
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

  for (let i = 0; i < array.length; i++) {
    const user = await User.findOne({ where: { userId: array[i].userId } }); //신청자 유저정보
    if (!user) continue;

    const diaryExist = array[i].diaryId ? true : false;
    const reservation = {
      category: array[i].category,
      reservationDate: array[i].reservationDate,
      reservationId: array[i].reservationId,
      reservationState: array[i].reservationState,
      sitterId: array[i].sitterId,
      userName: user.userName,
      phoneNumber: user.phoneNumber,
      diaryExist,
    };

    setArray.push(reservation);
  }

  return setArray;
};

module.exports = router;
