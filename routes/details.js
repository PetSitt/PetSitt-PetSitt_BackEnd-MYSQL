const express = require('express');
const router = express.Router();
const { Sitter } = require('../models');
const { Review } = require('../models');
const { Pet } = require('../models');
const { User } = require('../models');
const { Op } = require('sequelize');
require('dotenv').config();

//상세페이지 불러오기
router.get('/:sitterId', async (req, res) => {
  try {
    var sitter_info = await Sitter.findOne({
      where: { sitterId: req.params.sitterId },
    });
    var user_info = await User.findOne({
      where: { userId: sitter_info.userId },
    });
    var pet_info = await Pet.findAll({ where: { userId: user_info.userId } });

    if (!sitter_info || !user_info) {
      throw new Error();
    }
  } catch {
    return res.status(400).send({ msg: 'DB정보를 받아오지 못했습니다.' });
  }

  let pets = [];

  if (pet_info.length > 0) {
    pets = pet_info.map((el) => {
      const pet = {
        petName: el.petName,
        petImage: el.petImage || process.env.AWS_IP + 'default.jpg',
        petAge: el.petAge,
        petType: el.petType,
      };
      return pet;
    });
  }

  return res.status(200).send({
    sitter: {
      sitterId: sitter_info.sitterId,
      sitterName: sitter_info.sitterName,
      rehireRate: sitter_info.rehireRate,
      averageStar: sitter_info.averageStar,
      introTitle: sitter_info.introTitle,
      address: sitter_info.address,
      imageUrl: sitter_info.imageUrl || process.env.AWS_IP + 'default.jpg',
      mainImageUrl:
        sitter_info.mainImageUrl || process.env.AWS_IP + 'default.jpg',
      myIntro: sitter_info.myIntro,
      category: sitter_info.category,
      careSize: sitter_info.careSize,
      servicePrice: sitter_info.servicePrice,
      plusService: sitter_info.plusService,
      noDate: sitter_info.noDate,
      x: sitter_info.location.coordinates[0] || 0, //경도
      y: sitter_info.location.coordinates[1] || 0, //위도
      reviewCount: sitter_info.reviewCount,
    },
    pets: pet_info,
  });
});

// 상세보기 페이지 
router.post('/reviews/:sitterId', async (req, res) => {
  try {
    const { reviewId } = req.body;
    const { sitterId } = req.params;

    if (reviewId === 0) {
      var reviews = await Review.findAll({
        limit: 3,
        order: [['reviewId', 'desc']],
        where: {
          sitterId: sitterId,
        },
      });
    } else {
      var reviews = await Review.findAll({
        limit: 3,
        order: [['reviewId', 'desc']],
        where: {
          sitterId: sitterId,
          reviewId: { [Op.lt]: reviewId },
        },
      });
    }

    return res.status(200).send({ reviews });
  } catch (err) {
    return res.status(400).send('DB정보를 받아오지 못했습니다.');
  }
});

module.exports = router;
