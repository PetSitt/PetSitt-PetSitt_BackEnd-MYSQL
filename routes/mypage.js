const express = require("express");
const router = express.Router();
const AWS = require('aws-sdk');
const authMiddleware = require('../middlewares/auth-middleware');
require("dotenv").config();
const multer = require('multer');
const multerS3 = require('multer-s3');
const moment = require('moment');
const { Op } = require("sequelize");
const { Pet } = require("../models");
const { Sitter } = require("../models");
const { User } = require("../models");

const s3 = new AWS.S3({
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    region: "ap-northeast-2"
});

const storage = multerS3({
    s3: s3,
    acl: 'public-read-write',
    bucket: process.env.MY_S3_BUCKET || "avostorage",   // s3 버킷명+경로
    key: (req, file, callback) => {
    	let dir = req.body.dir;
        let datetime = moment().format('YYYYMMDDHHmmss');
        callback(null, dir + datetime + "_" + file.originalname);  // 저장되는 파일명
    }
});

const upload = multer({ storage: storage });

// 마이페이지 - 내프로필 조회 
router.get("/myprofile", authMiddleware, async (req, res) => {
    try{
        const { user } = res.locals;
        const myprofile = user;
        res.json({ myprofile });
    }catch(error){
        console.error(error);
    }
})

// 마이페이지 - 내프로필 수정 
router.patch("/myprofile", authMiddleware, async (req, res) => {
    try{
        const { user } = res.locals;
        const { userName, phoneNumber, userEmail } = req.body;

        const myprofile = await User.update({userName: userName, phoneNumber: phoneNumber, userEmail: userEmail}, 
            { where: {userId: user.userId}} );
        res.json({ myprofile });
    }catch(error){
        console.error(error);
    }
})

// 마이페이지 - 반려동물 프로필조회
router.get("/petprofile", authMiddleware, async (req, res) => {
    try{
        const { user } = res.locals;
        const petprofile = await Pet.findAll({ where: {userId: user.userId }});

        res.json({ petprofile });
    }catch(error){
        console.error(error);
    }
})

// 마이페이지 - 돌보미 프로필조회 / 미들웨어 없이 테스트 ok
router.get("/sitterprofile", authMiddleware, async (req, res) => {
    try{
        const { user } = res.locals;
        const sitterprofile = await Sitter.findOne({ where: {userId: user.userId } });
        const careSizeArr = sitterprofile.careSize.split(",");
        const categoryArr = sitterprofile.category.split(",");
        const plusServiceArr = sitterprofile.plusService.split(",");

        
        res.json({ sitterprofile, careSizeArr, categoryArr, plusServiceArr });
    }catch(error){
        console.log(error)
    }
})

// 마이페이지 - 반려동물 프로필 등록
router.post("/petprofile", authMiddleware, upload.single('petImage'), async (req, res) => {
    try{
        const { user } = res.locals;
        const { petName, petAge, petWeight, petType, petSpay, petIntro } = req.body;
        const petImage = req.file.location;
        const petprofile = await Pet.create({ petName: petName, petAge: petAge, petWeight: petWeight, petType: petType, petSpay: petSpay, petIntro: petIntro, petImage: petImage, userId: user.userId });

        res.json({ petprofile });
    }catch(error){
        console.log(error);
    }
})

// 마이페이지 - 돌보미 등록  / 미들웨어 없이 테스트 ok
router.post("/sitterprofile", authMiddleware, upload.fields([{name:'imageUrl'},{name:'mainImageUrl'}]), async (req, res) => {
    const { user } = res.locals;
    const { sitterName, gender, address, detailAddress, introTitle, myIntro, careSize, servicePrice, plusService, noDate, x, y, region_1depth_name, region_2depth_name, region_3depth_name, category, zoneCode } = req.body;
    // const imageUrl = req.files.imageUrl[0].location;
    // const mainImageUrl = req.files.mainImageUrl[0].location;
    const location = { type: 'Point', coordinates: [x, y]};
    try{
        const createSitter =  await Sitter.create({
            userId: user.userId,
            sitterName: sitterName,
            gender: gender,
            address: address,
            detailAddress: detailAddress,
            region_1depth_name: region_1depth_name,
            region_2depth_name: region_2depth_name,
            region_3depth_name: region_3depth_name,
            introTitle: introTitle,
            myIntro: myIntro,
            careSize: careSize,
            category: category,  // 제공 가능한 서비스
            servicePrice: servicePrice, // 일당 서비스 금액
            plusService: plusService, // 추가 가능한 서비스 (배열)
            noDate: noDate,
            location: location,
            // imageUrl: imageUrl,
            // mainImageUrl: mainImageUrl,
            zoneCode: zoneCode
        });
        res.json({ createSitter })
    }catch(error){
        console.error(error);
    }
})

// 마이페이지 - 돌보미 프로필 삭제 / 미들웨어 없이 테스트 ok
router.delete("/sitterprofile", authMiddleware, async (req, res) => {
    const { user } = res.locals;
    try{
        await Sitter.destroy({ where: { userId: user.userId }});
        res.json({ result: "success" });
    }catch{
        res.json({ result: "fail" });
    }
})

// 마이페이지 - 반려동물 프로필 삭제 / 미들웨어 없이 테스트 ok
router.delete("/petprofile/:petId", async (req, res) => {
    const { petId } = req.params;
    try{
        await Pet.destroy({ where: { petId: petId }});
        res.json({ result: "success" });
    }catch{
        res.json({ result: "fail" });
    }
})

// 반려동물 프로필 수정 
router.patch("/petprofile/:petId", authMiddleware, upload.single('petImage'), async (req, res) => {
    try{
    const { petId } = req.params;
    const { petName, petAge, petWeight, petType, petSpay, petIntro } = req.body;
    const petImage = req.file.location;

    const petprofile = await Pet.update({ petName: petName, petAge: petAge, petWeight: petWeight, petType: petType, petSpay: petSpay, petIntro: petIntro, petImage: petImage },
        {where: {petId: petId}} );
    res.json({ petprofile });
    }catch(error){
        console.log(error);
    }
})

// 마이페이지 - 돌보미 프로필 수정 / 미들웨어 없이 테스트 ok 
router.patch("/sitterprofile", authMiddleware, upload.fields([{name:'imageUrl'},{name:'mainImageUrl'}]), async (req, res) => {
    try{
    const { user } = req.locals;
    const { userName, gender, address, detailAddress, introTitle, myIntro, careSize, servicePrice, plusService, noDate, x, y, region_1depth_name, region_2depth_name, region_3depth_name, category, zoneCode } = req.body;
    const imageUrl = req.files.imageUrl[0].location;
    const mainImageUrl = req.files.mainImageUrl[0].location;
    const location = { type: 'Point', coordinates: [x, y]};

    const sitterprofile = await Sitter.update({
        userId: user.userId,
        userName: userName,
        gender: gender,
        address: address,
        detailAddress: detailAddress,
        region_1depth_name: region_1depth_name,
        region_2depth_name: region_2depth_name,
        region_3depth_name: region_3depth_name,
        introTitle: introTitle,
        myIntro: myIntro,
        careSize: careSize,
        category: category,  // 제공 가능한 서비스
        servicePrice: servicePrice, // 일당 서비스 금액
        plusService: plusService, // 추가 가능한 서비스 (배열)
        noDate: noDate,
        location: location,
        imageUrl: imageUrl,
        mainImageUrl: mainImageUrl,
        zoneCode: zoneCode
    },
        {where: {userId: user.userId}} );
    res.json({ sitterprofile });
    }catch(error){
        console.log(error);
    }
})

// 마이페이지 돌보미, 펫 사진 보내주기
router.get("/info", authMiddleware, async (req, res) => {
    try{
        const { user } = res.locals;
        const sitterprofile = await Sitter.findOne({ where: {userId: user.userId } });
        const petprofile = await Pet.findAll({ where: {userId: user.userId }});
        console.log(petprofile[1].petImage);

        const sitterimageUrl = sitterprofile.imageUrl;
        const sitterMainImageUrl = sitterprofile.mainImageUrl;

        res.json({sitterimageUrl,sitterMainImageUrl, petprofile});
    }catch(error){
        console.error(error);
    }
})

module.exports = router;