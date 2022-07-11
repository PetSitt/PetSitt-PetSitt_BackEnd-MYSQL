const express = require("express");
const connect_MongoDB = require("./schemas/connect_db");
const {sequelize} = require("./models");

const reviewsRouter = require("./routes/reviews.js");
const mainRouter = require("./routes/mains.js");
<<<<<<< HEAD
const cookieParser = require('cookie-parser');
=======
const testRouter = require("./routes/test_tools.js");
const mypageRouter = require("./routes/mypage");
const userRouter = require("./routes/users");
const reservationRouter = require("./routes/reservations.js");
const diaryRouter = require("./routes/diarys.js");
const cors = require('cors');
>>>>>>> 320cb04293f71e8e0cdbbc2b78c05b83fb68a56f
require("dotenv").config();

const app = express();
const port = 3000;

//connect_MongoDB(); //DB 연결

sequelize.sync()
  .then(() => {
    console.log('데이터베이스 연결 성공');
  })
  .catch((err) => {
    console.error(err);
  });

app.use(cors({
  exposedHeaders:["authorization"],
  origin: '*', //출처 허용 옵션: 테스트용 - 전부허용!
  credentials: 'true', // 사용자 인증이 필요한 리소스(쿠키..등) 접근
}));


app.use(express.json()); // json형태의 데이터를 parsing하여 사용할 수 있게 만듦.
app.use(express.urlencoded({extended:false}));
app.use(cookieParser());

<<<<<<< HEAD

=======
>>>>>>> 320cb04293f71e8e0cdbbc2b78c05b83fb68a56f
app.use((req, res, next) => {
  console.log('Request URL:', req.originalUrl, ' - ', new Date());
  next();
});
<<<<<<< HEAD
app.use("/api",[usersRouter]);
app.use("/details", [detailsRouter]);
=======

app.use("/api",[userRouter]);

>>>>>>> 320cb04293f71e8e0cdbbc2b78c05b83fb68a56f
app.use("/reviews", [reviewsRouter]);
app.use("/mains", [mainRouter]);
app.use("/mypage", [mypageRouter]);
app.use("/reservations", [reservationRouter]);
app.use("/diarys", [diaryRouter]);


app.listen(port, () => {
  console.log(port, "포트로 서버가 켜졌습니다.");
});


