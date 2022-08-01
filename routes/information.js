const express = require('express');
const router = express.Router();
const { Pet } = require('../models');
const { Sitter } = require('../models');
const { Room } = require('../models');
const { Op } = require('sequelize');
const authMiddleware = require('../middlewares/auth-middleware');

router.get('/petcheck', authMiddleware, async (req, res) => {
  try {
    const { user } = res.locals;
    let existCheck = false;

    const pet = await Pet.findOne({ where: { userId: user.userId } });
    if (pet) {
      existCheck = true;
    }
    return res.status(200).send({ check: existCheck });
  } catch {
    return res
      .status(400)
      .send({ errorMessage: 'DB정보를 받아오지 못했습니다.' });
  }
});

router.get('/sittercheck', authMiddleware, async (req, res) => {
  try {
    const { user } = res.locals;
    let existCheck = false;

    const sitter = await Sitter.findOne({ where: { userId: user.userId } });
    if (sitter) {
      existCheck = true;
    }

    return res.status(200).send({ check: existCheck });
  } catch {
    return res
      .status(400)
      .send({ errorMessage: 'DB정보를 받아오지 못했습니다.' });
  }
});


router.get('/newcheck', authMiddleware, async (req, res) => {
  try {
    const { user } = res.locals;
    let existCheck = false;

    const room = await Room.findOne({ 
      where: {
        [Op.or]: [
          { userId: String(user.userId), userNew: true },
          { sitter_userId: String(user.userId), sitterNew: true },
        ]
      },
    });

    if (room) {
      existCheck = true;
    }

    return res.status(200).send({ check: existCheck });
  } catch {
    return res
      .status(400)
      .send({ errorMessage: 'DB정보를 받아오지 못했습니다.' });
  }
});

module.exports = router;
