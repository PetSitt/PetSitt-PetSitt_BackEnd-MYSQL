const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const authMiddleware = require('../middlewares/auth-middleware');
const bcrypt = require('bcrypt');
const mailer = require('../mail/passwordEmail');
require('dotenv').config();


//signup 회원가입
router.post('/signup', async (req, res) => {
  try {
    const { userEmail, userName, password, phoneNumber } = req.body;

    const refreshToken = '';
    if (!userEmail || !userName || !password || !phoneNumber || phoneNumber === '') {
      return res.status(400).send({ errorMessage: '필수 항목을 모두 입력해주세요!' });
    }

    //userEmail ot phoneNumber 중복확인
    const existUserEmail = await User.findOne({ where: { userEmail } });
    if (existUserEmail) {
      return res.status(400).send({ errorMessage: '이미 가입된 이메일 주소 입니다.' });
    }

    const existPhoneNumber = await User.findOne({ where: { phoneNumber } });
    if (existPhoneNumber) {
      return res.status(400).send({ errorMessage: '이미 가입된 핸드폰 번호 입니다!' });
    }

    const salt = await bcrypt.genSalt(Number(process.env.SALT));
    const hashPassword = await bcrypt.hash(password, salt);

    //유저 생성
    await User.create({
      userEmail,
      userName,
      password: hashPassword,
      phoneNumber,
      refreshToken,
    });

    return res.status(201).json({ message: '회원가입이 완료되었습니다!' });
  } catch {
    return res.status(400).send({ errorMessage: '요청한 데이터 형식이 올바르지 않습니다.' });
  }
});

// login 로그인
router.post('/login', async (req, res) => {
  try {
    const { userEmail, password } = await req.body;
    const user = await User.findOne({ where: { userEmail: userEmail } });
    if (!user) {
      return res.status(400).send({ errorMessage: '가입된 이메일 주소가 아닙니다 다시 확인해주세요.' });
    }

    const passwordIsValid = bcrypt.compareSync(password, user.password);
    if (!passwordIsValid) {
      return res.status(401).send({ accessToken: null, message: '비밀번호를 다시 확인해주세요!' });
    }
    
    const accessToken = jwt.sign(
      { userEmail: user.userEmail },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: '1m' },
    );

    const refreshToken = jwt.sign(
      { userEmail: user.userEmail },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: '1d' },
    );

    await user.update(
      { refreshToken },
      { where: { userEmail: user.userEmail } }
    );

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      sameSite: 'none',
      secure: true,
    });

    return res.status(200).send({
      message: '로그인 성공',
      accessToken: accessToken,
      refreshToken: refreshToken,
    });
  } catch (error) {
    return res.status(400).send({ message: '이메일 또는 비밀번호를 확인해주세요 ' });
  }
});

//refreshToken check 리프레시 토큰 확인 / accessToken 재발급
router.post('/refresh', (req, res) => {
  try {
    // Destructuring refreshToken from cookie
    const refreshToken = req.body.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ errorMessage: '리프레쉬 토큰이 없습니다.' });
    }

    // Verifying refresh token
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
      // Wrong Refesh Token
      if (err) {
        return res.status(406).json({ message: '리프레시 토큰 오류' });
      } 

      // Correct token we send a new access token
      const accessToken = jwt.sign(
        { userEmail: user.userEmail },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: '100m' },
      );

      return res.json({
        ok: true,
        message: 'accessToken 재발급 성공!',
        accessToken: accessToken,
      });
    });

  } catch {
    return res.status(406).json({ message: '토큰 발급 불가' });
  }
});

//id_check  유저 아이디찾기
router.post('/id_check', async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber) {
      return res.status(400).send({ errorMessage: '핸드폰 번호를 다시 확인해주세요.' });
    }

    const user = await User.findOne({ where: { phoneNumber: phoneNumber } });
    if (!user) {
      return res.status(406).send({ errorMessage: '가입시 사용된 핸드폰 번호가 아닙니다.' });
    }

    return res.status(200).send({ message: '가입시 사용된 이메일 주소 입니다!', userEmail: user.userEmail });
  } catch (err) {
    return res.status(400).json({ errorMessage: 'fail' });
  }
});

//password check  유저 비밀번호 찾기
router.post('/password_check', async (req, res) => {
  try {
    const { userEmail } = req.body;
    if (!userEmail) {
      return res.status(400).send({ errorMessage: '이메일을 다시 확인해 주세요.' });
    }

    const user = await User.findOne({ where: { userEmail } });
    if (!user) {
      res.status(406).send({ errorMessage: '존재하지 않는 이메일입니다' });
      return;
    }

    // 새 비밀번호 (암호화)
    const hashPassword = await bcrypt.hash(randomPassword, 10);
    await user.update(
      { password: hashPassword },
      { where: { userEmail: userEmail } }
    );

    const randomPassword = String(Math.floor(Math.random() * 1000000) + 100000);
    const emailParam = {
      toEmail: userEmail, // 수신할 이메일
      subject: 'petsitter 임시 비밀번호 메일발송', // 메일 제목
      text: `${user.userName} 회원님! 임시 비밀번호는 ${randomPassword} 입니다`, // 메일 내용
    };

    mailer.sendGmail(emailParam);

    return res.send({ result: true });
  } catch (err) {
    return res.status(400).json({ errorMessage: 'fail' });
  }
});

//user_info_check 유저정보조회
router.get('/auth', authMiddleware, (req, res) => {
  try {
    const { user } = res.locals;

    return res.status(200).send({ user });
  } catch {
    return res.status(401).send({ errormessage: '사용자 정보를 가져오지 못하였습니다.' });
  }
});

//kakao login  소셜로그인
router.post('/auth/kakao', async (req, res) => {
  try {
    const { userEmail, userName } = req.body;

    // 해당 이메일이 DB에 없는 경우 new User로 등록
    let user = await User.findOne({ where: { userEmail: userEmail } });
    if (!user) {
      user = await User.create({ userEmail, userName });
    }

    const token = jwt.sign(
      { userEmail: user.userEmail }, 
      process.env.ACCESS_TOKEN_SECRET, 
      { expiresIn: '6h' }
    );

    return res.send({ result: true, token: token });
  } catch {
    return res.status(400).send({ errormessage: '사용자 정보를 가져오지 못하였습니다.' });
  }
});

module.exports = router;
