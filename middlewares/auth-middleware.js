const jwt = require('jsonwebtoken');
const User = require('../schemas/user');
require('dotenv').config();

module.exports = (req, res, next) => {
  // console.log(req.headers);
  const { authorization } = req.headers;

  const [tokenType, tokenValue] = (authorization || '').split(' ');
  // console.log(authorization);
  if (!tokenValue || tokenType !== 'Bearer') {
    return res.status(401).send({
      errorMessage: '로그인 후 이용 가능합니다.',
    });
  }
  try {
    const { userEmail }  = jwt.verify(tokenValue, process.env.ACCESS_TOKEN_SECRET);
    User.findOne({userEmail: userEmail}).exec().then((user) => {
        res.locals.user = user;
        // console.log(user);
        next();
        if (!user) {
          res.status(400).send({
            errorMessage: '회원가입이 필요합니다',
          });
        }
      });
  } catch (err) {
    res.status(401).send({
      errorMessage: '로그인 후 이용 가능합니다.2',
    });
  }
};