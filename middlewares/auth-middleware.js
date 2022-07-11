const jwt = require('jsonwebtoken');
<<<<<<< HEAD
const { User } = require('../models/index');

=======
const {User} = require('../schemas/user');
>>>>>>> 320cb04293f71e8e0cdbbc2b78c05b83fb68a56f
require('dotenv').config();

module.exports = (req, res, next) => {
  // console.log(req.headers);
  const { authorization } = req.headers;

  const [tokenType, tokenValue] = (authorization || '').split(' ');

  if (!tokenValue || tokenType !== 'Bearer') {
    return res.status(401).send({
      errorMessage: '로그인 후 이용 가능합니다.',
    });
<<<<<<< HEAD
    return;
=======

>>>>>>> 320cb04293f71e8e0cdbbc2b78c05b83fb68a56f
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
