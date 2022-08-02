const express = require('express');
const router = express.Router();
const AWS = require('aws-sdk');
const authMiddleware = require('../middlewares/auth-middleware');
require('dotenv').config();
const multer = require('multer');
const multerS3 = require('multer-s3-transform');
const sharp = require("sharp");
const moment = require('moment');
const { Op } = require('sequelize');
const { Pet } = require('../models');
const { Sitter } = require('../models');
const { User } = require('../models');
const bcrypt = require('bcrypt');

const s3 = new AWS.S3({
  accessKeyId: process.env.S3_ACCESS_KEY_ID,
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  region: 'ap-northeast-2',
});

const storage = multerS3({
  s3: s3,
  acl: 'public-read-write',
  bucket: process.env.MY_S3_BUCKET || 'kimguen-storage/petSitt', // s3 버킷명+경로
  contentType: multerS3.AUTO_CONTENT_TYPE,
  shouldTransform: true,
  transforms: [
    {
      key: (req, file, callback) => {
        const dir = req.body.dir;
        const datetime = moment().format('YYYYMMDDHHmmss');
        callback(null, dir + datetime + '_' + file.originalname); // 저장되는 파일명
      },
      transform: function (req, file, cb) {
        if (file) {
          switch(file.fieldname) {
            case 'petImage':
                cb(null, sharp().resize({ width: 120 }).withMetadata());
              break;
            case 'imageUrl':
                cb(null, sharp().resize({ width: 160 }).withMetadata());
              break;
            case 'mainImageUrl':
                cb(null, sharp().resize({ width: 500 }).withMetadata());
              break;
            default: 
                cb(null, sharp().resize({ width: 200 }).withMetadata());
              break;
          }
        }
      },
    },
  ]
});

const upload = multer({ storage: storage });

// 마이페이지 - 내프로필 조회 
router.get('/myprofile', authMiddleware, async (req, res) => {
  try {
    const { user } = res.locals;
    const myprofile = user;

    res.json({ myprofile });
  } catch {
    return res
      .status(400)
      .send({ errorMessage: 'DB정보를 받아오지 못했습니다.' });
  }
});

// 마이페이지 - 내프로필 수정
router.patch('/myprofile', authMiddleware, async (req, res) => {
  try {
    const { user } = res.locals;
    const { userName, phoneNumber, userEmail } = req.body;
    const myprofile = await User.update(
      {
        userName: userName,
        phoneNumber: phoneNumber,
        userEmail: userEmail,
      },
      { where: { userId: user.userId } }
    );
    res.json({ myprofile });
  } catch {
    return res
      .status(400)
      .send({ errorMessage: 'DB정보를 받아오지 못했습니다.' });
  }
});

// 마이페이지 - 반려동물 프로필조회 
router.get('/petprofile', authMiddleware, async (req, res) => {
  try {
    const { user } = res.locals;
    const petprofile = await Pet.findAll({ where: { userId: user.userId } });

    res.json({ petprofile });
  } catch {
    return res
      .status(400)
      .send({ errorMessage: 'DB정보를 받아오지 못했습니다.' });
  }
});

// 마이페이지 - 돌보미 프로필조회
router.get('/sitterprofile', authMiddleware, async (req, res) => {
  try {
    const { user } = res.locals;

    const sitter = await Sitter.findOne({ where: { userId: user.userId } });
    if (!sitter) {
      return res.status(200).send({ sitterprofile: null, isError: true });
    }

    return res.json({ sitterprofile: sitter });

  } catch {
    return res
      .status(400)
      .send({ errorMessage: 'DB정보를 받아오지 못했습니다.' });
  }
});

router.post(
  '/petprofile',
  authMiddleware,
  upload.single('petImage'),
  async (req, res) => {
    try {
      const { user } = res.locals;
      const { petName, petAge, petWeight, petType, petSpay, petIntro } =
        req.body;
      if (req.file != undefined) {
        const petImage = req.file.transforms[0].location;
        const petprofile = await Pet.create({
          petName: petName,
          petAge: petAge,
          petWeight: petWeight,
          petType: petType,
          petSpay: petSpay,
          petIntro: petIntro,
          petImage: petImage,
          userId: user.userId,
        });
        res.json({ petprofile });
      } else {
        const petprofile = await Pet.create({
          petName: petName,
          petAge: petAge,
          petWeight: petWeight,
          petType: petType,
          petSpay: petSpay,
          petIntro: petIntro,
          userId: user.userId,
        });
        res.json({ petprofile });
      }
    } catch {
      return res
        .status(400)
        .send({ errorMessage: 'DB정보를 받아오지 못했습니다.' });
    }
  }
);

// 마이페이지 - 돌보미 등록 
router.post(
  '/sitterprofile',
  authMiddleware,
  upload.fields([{ name: 'imageUrl' }, { name: 'mainImageUrl' }]),
  async (req, res) => {
    try {
      const { user } = res.locals;
      const {
        sitterName,
        address,
        detailAddress,
        introTitle,
        myIntro,
        careSize,
        servicePrice,
        plusService,
        noDate,
        region_1depth_name,
        region_2depth_name,
        region_3depth_name,
        category,
        zoneCode,
      } = req.body;

      const decode_careSize = JSON.parse(careSize);
      let decode_noDate = JSON.parse(noDate);
      const decode_category = JSON.parse(category);
      const decode_plusService = JSON.parse(plusService);

      let { x, y } = req.body;
      if (x === 'undefined' || y === 'undefined' || !x || !y) {
        x = 0;
        y = 0;
      }
      const location = { type: 'Point', coordinates: [x, y] };
      const createSitter = await Sitter.create({
        userId: user.userId,
        sitterName: sitterName,
        address: address,
        detailAddress: detailAddress,
        region_1depth_name: region_1depth_name,
        region_2depth_name: region_2depth_name,
        region_3depth_name: region_3depth_name,
        introTitle: introTitle,
        myIntro: myIntro,
        careSize: decode_careSize,
        category: decode_category, // 제공 가능한 서비스
        servicePrice: servicePrice, // 일당 서비스 금액
        plusService: decode_plusService, // 추가 가능한 서비스 (배열)
        noDate: decode_noDate,
        zoneCode: zoneCode,
        location: location,
      });
      if (req.files.imageUrl != undefined) {
        const imageUrl 
          = req.files.imageUrl[0].transforms[0].location;
        await Sitter.update(
          { imageUrl: imageUrl },
          { where: { userId: user.userId } }
        );
      }
      if (req.files.mainImageUrl != undefined) {
        const mainImageUrl 
          = req.files.mainImageUrl[0].transforms[0].location;
        await Sitter.update(
          { mainImageUrl: mainImageUrl },
          { where: { userId: user.userId } }
        );
      }
      res.json({ createSitter });
    } catch {
      return res
        .status(400)
        .send({ errorMessage: 'DB정보를 받아오지 못했습니다.' });
    }
  }
);

// 마이페이지 - 돌보미 프로필 삭제 
router.delete('/sitterprofile', authMiddleware, async (req, res) => {
  const { user } = res.locals;
  try {
    const sitter = await Sitter.findOne({ where: { userId: user.userId } });
    if (sitter.imageUrl) {
      const delFile = sitter.imageUrl.substr(56);
      const delParams = {
        Bucket: process.env.MY_S3_BUCKET_DELETE || 'kimguen-storage',
        Key: delFile,
      };
      s3.deleteObject(delParams, function (error, data) {
        if (error) {
          console.log('err: ', error, error.stack);
        } else {
          console.log(data, ' 정상 삭제 되었습니다.');
        }
      });
    }

    if (sitter.mainImageUrl) {
      const delFile2 = sitter.mainImageUrl.substr(56);
      const delParams2 = {
        Bucket: process.env.MY_S3_BUCKET_DELETE || 'kimguen-storage',
        Key: delFile2,
      };
      s3.deleteObject(delParams2, function (error, data) {
        if (error) {
          console.log('err: ', error, error.stack);
        } else {
          console.log(data, ' 정상 삭제 되었습니다.');
        }
      });
    }

    await Sitter.destroy({ where: { userId: user.userId } });
    res.json({ result: 'success' });
  } catch {
    return res.status(400).send({ result: 'fail' });
  }
});

// 마이페이지 - 반려동물 프로필 삭제 
router.delete('/petprofile/:petId', async (req, res) => {
  const { petId } = req.params;
  try {
    const pet = await Pet.findOne({ where: { petId: petId } });
    if (pet.petImage) {
      const delFile = pet.petImage.substr(56);

      const delParams = {
        Bucket: process.env.MY_S3_BUCKET_DELETE || 'kimguen-storage',
        Key: delFile,
      };
      s3.deleteObject(delParams, function (error, data) {
        if (error) {
          console.log('err: ', error, error.stack);
        } else {
          console.log(data, ' 정상 삭제 되었습니다.');
        }
      });
    }

    await Pet.destroy({ where: { petId: petId } });
    res.json({ result: 'success' });
  } catch {
    return res.status(400).send({ result: 'fail' });
  }
});

// 반려동물 프로필 수정 
router.patch(
  '/petprofile/:petId',
  authMiddleware,
  upload.single('petImage'),
  async (req, res) => {
    try {
      const { petId } = req.params;
      const { petName, petAge, petWeight, petType, petSpay, petIntro } =
        req.body;
      const pet = await Pet.findOne({ where: { petId: petId } });
      if (req.file != undefined) {
        if (pet.petImage) {
          const delFile = pet.petImage.substr(56);
          const delParams = {
            Bucket: process.env.MY_S3_BUCKET_DELETE || 'kimguen-storage',
            Key: delFile,
          };
          s3.deleteObject(delParams, function (error, data) {
            if (error) {
              console.log('err: ', error, error.stack);
            } else {
              console.log(data, ' 정상 삭제 되었습니다.');
            }
          });
        }
        const petImage = req.file.transforms[0].location;
        await Pet.update(
          {
            petName: petName,
            petAge: petAge,
            petWeight: petWeight,
            petType: petType,
            petSpay: petSpay,
            petIntro: petIntro,
            petImage: petImage,
          },
          { where: { petId: petId } }
        );
      } else {
        await Pet.update(
          {
            petName: petName,
            petAge: petAge,
            petWeight: petWeight,
            petType: petType,
            petSpay: petSpay,
            petIntro: petIntro,
          },
          { where: { petId: petId } }
        );
      }

      return res.json({ result: 'success' });
    } catch {
      return res
        .status(400)
        .send({ errorMessage: 'DB정보를 받아오지 못했습니다.' });
    }
  }
);

// 마이페이지 - 돌보미 프로필 수정 
router.patch(
  '/sitterprofile',
  authMiddleware,
  upload.fields([{ name: 'imageUrl' }, { name: 'mainImageUrl' }]),
  async (req, res) => {
    const { user } = res.locals;
    try {
      const {
        x,
        y,
        sitterName,
        address,
        detailAddress,
        introTitle,
        myIntro,
        careSize,
        servicePrice,
        plusService,
        noDate,
        region_1depth_name,
        region_2depth_name,
        region_3depth_name,
        category,
        zoneCode,
      } = req.body;

      const decode_careSize = JSON.parse(careSize);
      let decode_noDate = JSON.parse(noDate);
      const decode_category = JSON.parse(category);
      const decode_plusService = JSON.parse(plusService);

      const sitter = await Sitter.findOne({
        where: { userId: user.userId },
      });
      const sitterprofile = await Sitter.update(
        {
          userId: user.userId,
          sitterName: sitterName,
          address: address,
          detailAddress: detailAddress,
          region_1depth_name: region_1depth_name,
          region_2depth_name: region_2depth_name,
          region_3depth_name: region_3depth_name,
          introTitle: introTitle,
          myIntro: myIntro,
          careSize: decode_careSize,
          category: decode_category, 
          servicePrice: servicePrice, 
          plusService: decode_plusService,
          noDate: decode_noDate,
          zoneCode: zoneCode,
        },
        {
          where: {
            userId: user.userId,
          },
        }
      );

      if (x !== 'undefined') {
        const location = { type: 'Point', coordinates: [x, y] };
        await Sitter.update(
          {
            location: location,
          },
          { where: { userId: user.userId } }
        );
      }

      if (req.files.imageUrl != undefined) {
        if (sitter.imageUrl) {
          const delFile = sitter.imageUrl.substr(56);
          const delParams = {
            Bucket: process.env.MY_S3_BUCKET_DELETE || 'kimguen-storage',
            Key: delFile,
          };

          s3.deleteObject(delParams, function (error, data) {
            if (error) {
              console.log('err: ', error, error.stack);
            } else {
              console.log(data, ' 정상 삭제 되었습니다.');
            }
          });
        }

        const imageUrl = req.files.imageUrl[0].transforms[0].location;

        await Sitter.update(
          {
            imageUrl: imageUrl,
          },
          { where: { userId: user.userId } }
        );
      }
      if (req.files.mainImageUrl != undefined) {
        if (sitter.mainImageUrl) {
          const delFile = sitter.mainImageUrl.substr(56);
          const delParams = {
            Bucket: process.env.MY_S3_BUCKET_DELETE || 'kimguen-storage',
            Key: delFile,
          };

          s3.deleteObject(delParams, function (error, data) {
            if (error) {
              console.log('err: ', error, error.stack);
            } else {
              console.log(data, ' 정상 삭제 되었습니다.');
            }
          });
        }
        const mainImageUrl = req.files.mainImageUrl[0].location;

        await Sitter.update(
          {
            mainImageUrl: mainImageUrl,
          },
          { where: { userId: user.userId } }
        );
      }
      res.json({ sitterprofile });
    } catch {
      return res
        .status(400)
        .send({ errorMessage: 'DB정보를 받아오지 못했습니다.' });
    }
  }
);

// 마이페이지 돌보미, 펫 사진 보내주기
router.get('/info', authMiddleware, async (req, res) => {
  try {
    const { user } = res.locals;
    const sitterprofile = await Sitter.findOne({
      where: { userId: user.userId },
    });
    const petprofile = await Pet.findAll({ where: { userId: user.userId } });
    const petImage = petprofile.map((petprofile) => petprofile.petImage);

    const sitterimageUrl = sitterprofile.imageUrl;
    const sitterMainImageUrl = sitterprofile.mainImageUrl;

    res.json({ sitterimageUrl, sitterMainImageUrl, petImage });
  } catch {
    return res
      .status(400)
      .send({ errorMessage: 'DB정보를 받아오지 못했습니다.' });
  }
});


//비밀번호 변경
router.put('/password_change', authMiddleware, async (req, res) => {
  try {
    const { user } = res.locals;
    let { password, newPassword } = req.body;

    const salt = await bcrypt.genSalt(Number(process.env.SALT));
    const newHash = bcrypt.hashSync(newPassword, salt);
    //비밀번호 일치 확인
    const hashed = bcrypt.compareSync(password, user.password);
    if (!hashed) {
      return res
        .status(401)
        .send({ errorMessage: '비밀번호가 일치하지 않습니다.' });
    }
    await User.update(
      { password: newHash },
      { where: { userEmail: user.userEmail } }
    );
    return res.status(200).send({ message: '비밀번호 변경 성공!' });
  } catch {
    return res.status(400).send({ errorMessage: '비밀번호 변경 실패' });
  }
});

module.exports = router;
