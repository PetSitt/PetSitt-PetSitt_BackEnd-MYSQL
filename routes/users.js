const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../schemas/user");
const authMiddleware = require('../middlewares/auth-middleware');
const user = require("../schemas/user");
const bcrypt = require('bcrypt');
const mailer = require("../mail/passwordEmail");
require("dotenv").config();





//signup
router.post('/signup', async (req, res) => {
  try {
    const { userEmail, 
            userName, 
            password, 
            phoneNumber, 
          } = (req.body);
   // userEmail 중복확인 
      const existUsers = await User.find({
      $or: [{ userEmail }],
      });
    if (existUsers.length) {
        res.status(400).send({
        errorMessage: "중복된 아이디입니다",
      });
      return;
    };
   // const hash = await bcrypt.hash(password, 10);
      const salt = await bcrypt.genSalt(Number(process.env.SALT));
      const hashPassword = await bcrypt.hash(req.body.password, salt);
      const user = new User({
        userEmail, 
        userName, 
        password : hashPassword, 
        phoneNumber, 
      });
      await user.save();
      res.status(201).json({ message: "회원가입이 완료!"});
    }
     catch (err) {
      console.log(err);
      res.status(400).send({
        errorMessage: "요청한 데이터 형식이 올바르지 않습니다.",
      });
    }
  });




// login
router.post("/login", async (req, res) => {
  try {
    const { userEmail, password } = await (req.body);
    const user = await User.findOne({ userEmail: userEmail }).exec();
    if (!user) {
      res.status(400).send({
        errorMessage: "이메일 또는 비밀번호를 확인해주세요.",
      });
      return;
    };
    const accessToken = jwt.sign({
      userEmail: user.userEmail
    }, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: '1d'
    });
    const refreshToken = jwt.sign({
      userEmail: user.userEmail
    }, process.env.REFRESH_TOKEN_SECRET, {
      expiresIn: '10d'
    });
    res.send({
      accessToken,refreshToken,
      user: {
        userEmail: user.userEmail,
      },
    });
  } catch (error) {
    res.status(400).send({
    });
  }
});



//refreshToken check
router.post('/refresh', (req, res) => {
  if (req.cookies?.jwt) {
      // Destructuring refreshToken from cookie
      const refreshToken = req.cookies.jwt;
      // Verifying refresh token
      jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, 
      (err, decoded) => {
          if (err) {
              // Wrong Refesh Token
              return res.status(406).json({ message: 'Unauthorized 111' });
          }else {
              // Correct token we send a new access token
              const accessToken = jwt.sign({
                  userEmail: user.userEmail
              }, process.env.ACCESS_TOKEN_SECRET, {
                  expiresIn: '10m'
              });
              return res.json({ accessToken });
          };
      });} else {
      return res.status(406).json({ message: 'Unauthorized' });
  };
});




//id_check
router.get('/id_check', async (req, res) => {
  const { phoneNumber } = req.body;
  try {
    if (phoneNumber === " ") {
      res.status(400).send({
        errorMessage: "핸드폰 번호를 확인해주세요.",
      });
      return;
    }
    const user = await User.findOne({ where: { phoneNumber: phoneNumber } });
    console.log(user);
    if (!user) {
      res.status(406).send({ errorMessage: "존재하지 않는 번호입니다" });
      return;
    }
    res.send({
      user: {
        userEmail: user.userEmail,
      },
    });
  } catch (err) {
    res.status(400).json({ errorMessage: "fail" });
  }
});



//password check 
router.post('/password_check', async (req, res) => {
  const { userEmail } = req.body;
  try {
    if (userEmail === "") {
      res.status(400).send({
        errorMessage: "빈 문자열입니다."  });
      return; }
    const user = await User.findOne({ userEmail: userEmail });
    console.log(user);
    if (!user) {
      res.status(406).send({ errorMessage: "존재하지 않는 이메일입니다" });
      return; 
    }
    // 새 비밀번호 (암호화)
    const randomPassword = String(Math.floor(Math.random() * 1000000) + 100000);
    const hashPassword = await bcrypt.hash(randomPassword, 10);
    await User.update(
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


  

//usercheck 
router.get('/auth', authMiddleware, (req, res) => {
  try {
    const user = res.locals.user;
    console.log(res.locals.user);
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