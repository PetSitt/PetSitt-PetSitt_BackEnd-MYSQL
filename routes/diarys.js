const express = require("express");
const router = express.Router();
const moment = require('moment');
const AWS = require('aws-sdk');
const multer = require('multer');
const multerS3    = require('multer-s3');
const { Diary }   = require("../schemas/diary.js");
const { Reservation } = require("../schemas/reservation.js");
const authMiddleware = require("../middlewares/auth-middleware.js");
require("dotenv").config();

const s3 = new AWS.S3({
  accessKeyId: process.env.S3_ACCESS_KEY_ID,
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  region: "ap-northeast-2"
});

const storage = multerS3({
  s3: s3,
  acl: 'public-read-write',
  bucket: process.env.MY_S3_BUCKET || "kimguen-storage",
  key: (req, file, callback) => {
    if (file) {
      const datetime = moment().format('YYYYMMDDHHmmss');
      callback(null, datetime + "_" + file.originalname);  // 저장되는 파일명
    }
  }
});

const uploadS3 = multer({ storage: storage });

//돌봄일지 등록
router.post("/:reservationId", authMiddleware, uploadS3.array('diaryImage'), async (req, res) => {
  try {
    const { reservationId } = req.params;
    const { 
      checkList, 
      checkState, 
      diaryInfo 
    } = req.body;

    const fileArray = req.files;    

    // 배열을 json parsing 한다.
    const decode_checkList  = JSON.parse(checkList);
    const decode_checkState = JSON.parse(checkState);

    // 체크리스트, 돌봄일지 글 등록
    const diary = new Diary({ reservationId });
    if (decode_checkList?.length)   diary.checkList.list = decode_checkList;
    if (decode_checkState?.length)  diary.checkList.state = decode_checkState;
    if (diaryInfo)  diary.diaryInfo = diaryInfo;

    // 저장할 이미지가 있을 경우
    if (req.files) {
      const diaryImage = [];

      for (let i = 0; i < fileArray.length; i++) {
        diaryImage.push(fileArray[i].location);        
      }

      diary.diaryImage = diaryImage;
    }

    diary.save();
    // 예약에 돌봄일지 추가
    await Reservation.updateOne({ reservationId }, { $set: { diaryId: diary.id } });

    return res.status(200).send({
      msg: "돌봄일지 등록 성공" 
    });    
  } catch {
    return res.status(400).send({
      errorMessage: "DB정보를 받아오지 못했습니다." 
    });    
  };
});

//돌봄일지 수정
router.put("/:reservationId", authMiddleware, uploadS3.array('addImage'), async (req, res) => {
  try {
    const { reservationId } = req.params;
    const {
      checkList, 
      checkState, 
      deleteImage,
      diaryInfo,
    } = req.body;

    const diary = await Diary.findOne({ reservationId });
    if (!diary) { throw new Error(); }

    const fileArray = req.files;    

    // 배열을 json parsing 한다.
    const decode_checkList    = JSON.parse(checkList);
    const decode_checkState   = JSON.parse(checkState);
    const decode_deleteImage  = JSON.parse(deleteImage);

    // 변경 내용이 있을 경우
    if (decode_checkList?.length)   diary.checkList = decode_checkList;
    if (decode_checkState?.length)  diary.checkList = decode_checkState;
    if (diaryInfo)  diary.diaryInfo = diaryInfo;

    // 저장할 이미지가 있을 경우
    if (req.files?.length) {
      for (let i = 0; i < fileArray.length; i++) {
        diary.diaryImage.push(fileArray[i].location);        
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
        Bucket: process.env.MY_S3_BUCKET_DELETE || "kimguen-storage",
        Delete: {
          Objects: deleteObject,
          Quiet: false,
        },
      };

      //s3에서 삭제
      await s3.deleteObjects(options, (err, data) => {
          if (err) console.log( "삭제 실패: ", err);
          else console.log("삭제성공: ", data);
        }
      );
      
      //DB 에서도 삭제
      diary.diaryImage = diary.diaryImage.filter((el) => {
        if (decode_deleteImage.includes(el)) {
          return false;
        }
        return true;
      });
    }

    diary.save();

    return res.status(200).send({ 
      msg: "돌봄일지 수정 성공" 
    });    

  } catch {
    return res.status(400).send({ 
      errorMessage: "DB정보를 받아오지 못했습니다." 
    });    
  };
});


//돌봄일지 요청
router.get("/:reservationId", authMiddleware, async (req, res) => {
  try {
    const { reservationId } = req.params;
    const diary = await Diary.findOne({ reservationId });
    if (!diary) { throw new Error(); }

    return res.status(200).send({ 
      diaryImage: diary.diaryImage,
      diaryInfo:  diary.diaryInfo,
      checkList:  diary.checkList.list,
      checkState: diary.checkList.state,
    });
  } catch {
    return res.status(400).send({ 
      errorMessage: "DB정보를 받아오지 못했습니다." 
    });    
  };
});

module.exports = router;