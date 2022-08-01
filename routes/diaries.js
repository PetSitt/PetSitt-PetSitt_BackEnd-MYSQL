const express = require('express');
const router = express.Router();
const moment = require('moment');
const AWS = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3-transform');
const sharp = require("sharp");
const { Diary } = require('../models');
const { Reservation } = require('../models');
const authMiddleware = require('../middlewares/auth-middleware');
require('dotenv').config();

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
            case 'diaryImage':
            case 'addImage':
                cb(null, sharp().resize({ width: 105 }).withMetadata());
              break;
            default: 
                cb(null, sharp().resize({ width: 105 }).withMetadata());
              break;
          }
        }
      },
    },
  ]
});

const uploadS3 = multer({ storage: storage });

//돌봄일지 등록
router.post(
  '/:reservationId',
  authMiddleware,
  uploadS3.array('diaryImage'),
  async (req, res) => {
    try {
      const { reservationId } = req.params;

      const { checkList, checkStatus, diaryInfo } = req.body;
      const fileArray = req.files;
      const decode_checkList = JSON.parse(checkList);
      const decode_checkStatus = JSON.parse(checkStatus);

      // 체크리스트, 돌봄일지 글 등록
      const diary = await Diary.create({ reservationId });
      if (decode_checkList?.length) diary.checkList = decode_checkList;
      if (decode_checkStatus?.length) diary.checkStatus = decode_checkStatus;
      if (diaryInfo) diary.diaryInfo = diaryInfo;

      // 저장할 이미지가 있을 경우
      if (req.files) {
        const diaryImage = [];

        for (let i = 0; i < fileArray.length; i++) {
          diaryImage.push(fileArray[i].transforms[0].location);
        }
        diary.diaryImage = diaryImage;
      }

      await diary.save();
      // 예약에 돌봄일지 추가
      await Reservation.update(
        { diaryId: diary.diaryId },
        { where: { reservationId: reservationId } }
      );

      return res.status(200).send({
        msg: '돌봄일지 등록 성공',
      });
    } catch {
      return res.status(400).send({
        errorMessage: 'DB정보를 받아오지 못했습니다.',
      });
    }
  }
);

//돌봄일지 수정
router.put(
  '/:reservationId',
  authMiddleware,
  uploadS3.array('addImage'),
  async (req, res) => {
    try {
      const { reservationId } = req.params;
      const { checkList, checkStatus, deleteImage, diaryInfo } = req.body;

      const diary = await Diary.findOne({ where: { reservationId } });
      if (!diary) {
        throw new Error();
      }

      const fileArray = req.files;
      const decode_checkList = JSON.parse(checkList);
      const decode_checkStatus = JSON.parse(checkStatus);
      const decode_deleteImage = JSON.parse(deleteImage);

      // 변경 내용이 있을 경우
      if (decode_checkList?.length) diary.checkList = decode_checkList;
      if (decode_checkStatus?.length) diary.checkStatus = decode_checkStatus;
      if (diaryInfo) diary.diaryInfo = diaryInfo;

      // 저장할 이미지가 있을 경우
      if (req.files?.length) {
        for (let i = 0; i < fileArray.length; i++) {
          diary.diaryImage.push(fileArray[i].transforms[0].location);
        }
      }

      // 삭제할 이미지가 있을 경우
      if (decode_deleteImage?.length) {
        //삭제할 오브젝트 세팅
        const deleteObject = decode_deleteImage.map((el) => {
          const fileName = 'petSitt/' + el.split('/')[4];
          return { Key: fileName };
        });

        const options = {
          Bucket: process.env.MY_S3_BUCKET_DELETE || 'kimguen-storage',
          Delete: {
            Objects: deleteObject,
            Quiet: false,
          },
        };

        //s3에서 삭제
        s3.deleteObjects(options, (err, data) => {
          if (err) console.log('삭제 실패: ', err);
          else console.log('삭제성공: ', data);
        });
        //DB 에서도 삭제
        diary.diaryImage = diary.diaryImage.filter((el) => {
          if (decode_deleteImage.includes(el)) {
            return false;
          }
          return true;
        });
      }
      updateImage = diary.diaryImage;
      await Diary.update(
        { diaryImage: updateImage },
        { where: { reservationId: reservationId } }
      );
      await diary.save();
      return res.status(200).send({
        msg: '돌봄일지 수정 성공',
      });
    } catch {
      return res.status(400).send({ msg: 'DB정보를 받아오지 못했습니다.' });
    }
  }
);

//돌봄일지 요청
router.get('/:reservationId', authMiddleware, async (req, res) => {
  try {
    const { reservationId } = req.params;

    const diary = await Diary.findOne({ where: { reservationId } });
    if (!diary) {
      return res.status(400).send({ msg: '등록된 돌봄일지가 없습니다..' });
    }

    return res.status(200).send({
      diaryImage: diary.diaryImage,
      diaryInfo: diary.diaryInfo,
      checkList: diary.checkList,
      checkStatus: diary.checkStatus,
    });
  } catch {
    return res.status(400).send({ msg: 'DB정보를 받아오지 못했습니다.' });
  }
});

module.exports = router;
