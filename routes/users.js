const express = require("express");
const router = express.Router();
const { Op } = require("sequelize");
const jwt = require("jsonwebtoken");
const { User } = require("../models");
const authMiddleware = require('../middlewares/auth-middleware');
const bcrypt = require('bcrypt');
const nodemailer = require("nodemailer");
const mailer = require("../mail/passwordEmail");
const cookieParser = require('cookie-parser');
require("dotenv").config();



//signup 회원가입
router.post('/signup', async (req, res) => {
  try {
    const { userEmail, 
            userName, 
            password, 
            phoneNumber, 
          } = (req.body);
    const refreshToken= "";
   // userEmail 중복확인 
      const existUsers = await User.findAll({
         where: {
           [Op.or]: [{userEmail}, {phoneNumber}]
         }
      });
  if (existUsers.length) {
        res.status(400).send({
        errorMessage: "중복된 아이디 혹은 핸드폰 번호 입니다",
      });
      return;
    };
      const salt = await bcrypt.genSalt(Number(process.env.SALT));
      const hashPassword = await bcrypt.hash(password, salt);
      await User.create({
        userEmail, 
        userName, 
        password : hashPassword, 
        phoneNumber, 
        refreshToken,
      });
      res.status(201).json({ message: "회원가입이 완료!"});
      //res.status(201).send({ message: "회원가입이 완료!" });
    }
     catch (err) {
      console.log(err);
      res.status(400).send({
        errorMessage: "요청한 데이터 형식이 올바르지 않습니다.",
      });
    }
  });



// login 로그인 
router.post("/login", async (req, res) => {
  try {
    const { userEmail, password } = await (req.body);
    const user = await User.findOne({ where: {userEmail: userEmail} });
    if (!user) {
      res.status(400).send({
        errorMessage: "이메일 또는 비밀번호를 확인해주세요.",
      });
      return;
    };
    if(user){
    let passwordIsValid = bcrypt.compareSync(
      password, user.password
    );
    if (!passwordIsValid) {
      return res.status(401).send({
        accessToken: null,
        message: "이메일 또는 비밀번호를 확인해주세요",
      });
    }}
    const accessToken = jwt.sign({
      userEmail: user.userEmail
    }, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: '10d'
    });
    const refreshToken = jwt.sign({
      userEmail: user.userEmail
    }, process.env.REFRESH_TOKEN_SECRET, {
      expiresIn: '10d'
    });
    console.log(refreshToken)
      await user.update({ refreshToken }, { where: { userEmail: user.userEmail } });
    res.cookie('refreshToken', refreshToken, {
       httpOnly: true,
       sameSite: "none",
       secure: true,
     });
     return res.status(200).send({message: "로그인 성공", accessToken: accessToken, refreshToken:refreshToken});
  } catch (error) {
    res.status(400).send({message: "이메일 또는 비밀번호를 확인해주세요 " });
  }
});



//refreshToken check  리프레시토큰 재발급
/*router.post('/refresh', async(req, res) => {
  const refreshToken = req.headers.cookie
  console.log(refreshToken)
  if (!refreshToken) {
    return res.status(401).json({ errorMessage: "토큰 검증실패1" });
  }
     // Verifying refresh token
     const user = await User.findAll({ where: { refreshToken } });
    try {
      if (!user) {
        return res.status(401).json({ errorMessage: "토큰 검증실패2" });
      } else {
        jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, data) => {
          console.log(refreshToken)
          if (err) {
            return res.status(401).send({ errorMessage: "토큰 검증실패3" });
          } else {
            const accessToken = jwt.sign({
              userEmail: refreshToken.userEmail
            }, process.env.ACCESS_TOKEN_SECRET, {
              expiresIn: '10m'
            });
            return res.status(200).send({ message: "토큰 재발급 완료.",  
            accessToken: accessToken, refreshToken:refreshToken });
          }
        });
      }
    } catch (err) {
      if (err) {
        console.log(err);
        return res.status(401).send({ errorMessage: "토큰 검증실패4" });
      }
    }
  });*/

  
  //refreshToken check 로컬에서 테스트완료
router.post('/refresh', (req, res) => {
  if (req.cookies?.jwt) {
    // Destructuring refreshToken from cookie
    const refreshToken = req.cookies.jwt;
    // Verifying refresh token
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, 
    (err, decoded) => {
          if (err) {
              // Wrong Refesh Token
              return res.status(406).json({ message: '리프레시 토큰 오류' });
          } else {
              // Correct token we send a new access token
              const user = { userEmail: refreshToken.userEmail }
              const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: '60s'
              });
              return res.json({ accessToken });
        };
      }); } else {
      return res.status(406).json({ message: '토큰 발급 불가' });
  }});





//id_check  유저 아이디찾기 
router.post('/id_check', async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    if (phoneNumber === undefined) {
      res.status(400).send({
        errorMessage: "핸드폰 번호를 확인해주세요.",
      });
      return;
    }
    const user = await User.findOne({where: { phoneNumber: phoneNumber }});
    console.log(phoneNumber)
    console.log(user);
    if (!user) {
      res.status(406).send({ errorMessage: "존재하지 않는 번호입니다" });
      return;
    } else {
      return res.status(200).send({message :" 이메일 확인" , userEmail:user.userEmail});
  }}catch (err) {
    res.status(400).json({ errorMessage: "fail" });
  }
});



//password check  유저 비밀번호 찾기 
router.post('/password_check', async (req, res) => {
  const { userEmail } = req.body;
  try {
    if (userEmail === undefined) {
      res.status(400).send({
        errorMessage: "이메일을 확인해 주세요."  });
      return; }
    const user = await User.findOne({where: { userEmail } });
    console.log(user);
    if (!user) {
      res.status(406).send({ errorMessage: "존재하지 않는 이메일입니다" });
      return; 
    }
    // 새 비밀번호 (암호화)
    const randomPassword = String(Math.floor(Math.random() * 1000000) + 100000);
    const hashPassword = await bcrypt.hash(randomPassword, 10);
    await user.update(
      { password: hashPassword },
      { where: { userEmail: userEmail } }
    );
    let emailParam = {
      toEmail: userEmail, // 수신할 이메일
      subject: "petsitter 임시 비밀번호 메일발송", // 메일 제목
      text: `${user.userName} 회원님! 임시 비밀번호는 ${randomPassword} 입니다`, // 메일 내용
    };
    console.log(user.userName)
    mailer.sendGmail(emailParam);
    res.send({ result: true });
  } catch (err) {
    res.status(400).json({ errorMessage: "fail" });
  }});




//usercheck 유저정보조회
router.get('/auth', authMiddleware, (req, res) => {
  try {
    const { user } = res.locals ;
    res.status(200).send({
      user
    });
  } catch (error) {
    console.log(error);
    res.status(401).send({
      errormessage: '사용자 정보를 가져오지 못하였습니다.',
    });
  }
});


module.exports = router;