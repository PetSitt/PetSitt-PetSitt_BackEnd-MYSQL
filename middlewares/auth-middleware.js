const jwt = require('jsonwebtoken');
const { User } = require('../models/index');

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
    return;
  }
  try {
    const { userEmail }  = jwt.verify(tokenValue, process.env.ACCESS_TOKEN_SECRET);
    User.findOne({where: {userEmail: userEmail}}).then((user) => {
        res.locals.user = user;
        console.log(user);
        next();
      });
  } catch (err) {
    res.status(401).send({
      errorMessage: '로그인 후 이용 가능합니다.2',
    });
  }
};