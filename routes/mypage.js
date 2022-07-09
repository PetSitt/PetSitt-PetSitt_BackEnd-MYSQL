const express = require("express");
const router = express.Router();
const User = require("../schemas/user.js");
const {Pet} = require("../schemas/pet.js");
const {Sitter} = require("../schemas/sitter.js");
const AWS = require('aws-sdk');
const authMiddleware = require('../middlewares/auth-middleware');
require("dotenv").config();
const multer = require('multer');
const multerS3 = require('multer-s3');
const moment = require('moment');

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

// 마이페이지 - 내프로필 조회 (테스트 ok)
router.get("/myprofile", authMiddleware, async (req, res) => {
    try{
        const { userId } = res.locals.user;
        const myprofile = await User.findOne({ _id: userId });

        res.json({ myprofile });
    }catch(error){
        console.error(error);
    }
})

// 마이페이지 - 내프로필 수정 (테스트 ok)
router.patch("/myprofile", authMiddleware, async (req, res) => {
    try{
        const { userId } = res.locals.user;
        const { userName, phoneNumber, userEmail } = req.body;

        const myprofile = await User.updateOne({_id: userId}, { $set: {userName: userName, phoneNumber: phoneNumber, userEmail: userEmail} });
        res.json({ myprofile });
    }catch(error){
        console.error(error);
    }
})

// 마이페이지 - 반려동물 프로필조회 (테스트 ok)
router.get("/petprofile/", authMiddleware, async (req, res) => {
    try{
        const { userId } = res.locals.user;
        const petprofile = await Pet.find({ userId: userId });

        res.json({ petprofile });
    }catch(error){
        console.error(error);
    }
})

// 마이페이지 - 돌보미 프로필조회 (테스트 ok)
router.get("/sitterprofile", authMiddleware, async (req, res) => {
    try{
        const { userId } = res.locals.user;
        const sitterprofile = await Sitter.findOne({ userId: userId });

        res.json({ sitterprofile });
    }catch(error){
        console.log(error)
    }
})

// 마이페이지 - 반려동물 프로필 등록 (테스트 ok)
router.post("/petprofile", authMiddleware, upload.single('petImage'), async (req, res) => {
    try{
        const { userId } = res.locals.user;
        const { petName, petAge, petWeight, petType, petSpay, petIntro } = req.body;
        const petImage = req.file.location;
        const petprofile = await Pet.create({ petName: petName, petAge: petAge, petWeight: petWeight, petType: petType, petSpay: petSpay, petIntro: petIntro, petImage: petImage, userId: userId });

        res.json({ petprofile });
    }catch(error){
        console.log(error);
    }
})

// 마이페이지 - 돌보미 등록 (테스트 ok)
router.post("/sitterprofile", authMiddleware, upload.fields([{name:'imageUrl'},{name:'mainImageUrl'}]), async (req, res) => {
    const { userId } = res.locals.user;
    const { userName, gender, address, detailAddress, introTitle, myIntro, careSize, servicePrice, plusService, noDate, x, y, region_1depth_name, region_2depth_name, region_3depth_name, category } = req.body;
    const imageUrl = req.files.imageUrl[0].location;
    const mainImageUrl = req.files.mainImageUrl[0].location;
    try{
        const createSitter =  new Sitter ({ 
            userId: userId,
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
            location: {
                type: "Point",
                coordinates:[ x, y ]
            },
            imageUrl: imageUrl,
            mainImageUrl: mainImageUrl
        });
        createSitter.save();
        console.log(createSitter.location);
        res.json({ createSitter })
    }catch(error){
        console.error(error);
    }
})

// 마이페이지 - 돌보미 프로필 삭제 (테스트 ok)
router.delete("/sitterprofile", authMiddleware, async (req, res) => {
    const { userId } = res.locals.user;
    try{
        await Sitter.deleteOne({ userId: userId });
        res.json({ result: "success" });
    }catch{
        res.json({ result: "fail" });
    }
})

// 마이페이지 - 반려동물 프로필 삭제 (테스트 ok)
router.delete("/petprofile/:petId", async (req, res) => {
    const { petId } = req.params;
    try{
        await Pet.deleteOne({ _id: petId });
        res.json({ result: "success" });
    }catch{
        res.json({ result: "fail" });
    }
})

// 반려동물 프로필 수정 (테스트 ok)
router.patch("/petprofile/:petId", upload.single('petImage'), async (req, res) => {
    try{
    const { petId } = req.params;
    const { petName, petAge, petWeight, petType, petSpay, petIntro } = req.body;
    const petImage = req.file.location;

    const petprofile = await Pet.updateOne({_id: petId}, { $set: {petName: petName, petAge: petAge, petWeight: petWeight, petType: petType, petSpay: petSpay, petIntro: petIntro, petImage: petImage} });
    res.json({ petprofile });
    }catch(error){
        console.log(error);
    }
})

module.exports = router;