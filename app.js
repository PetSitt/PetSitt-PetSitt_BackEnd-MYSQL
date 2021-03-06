const express = require("express");
const {sequelize} = require("./models");

const reviewsRouter = require("./routes/reviews.js");
const mainsRouter = require("./routes/mains.js");
const cookieParser = require('cookie-parser');
const mypagesRouter = require("./routes/mypages");
const usersRouter = require("./routes/users");
const reservationsRouter = require("./routes/reservations");
const diariesRouter = require("./routes/diaries");
const detailsRouter = require("./routes/details");
const cors = require('cors');
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

app.use((req, res, next) => {
  console.log('Request URL:', req.originalUrl, ' - ', new Date());
  next();
});
app.use("/api",[usersRouter]);
app.use("/details", [detailsRouter]);
app.use("/reviews", [reviewsRouter]);
app.use("/mains", [mainsRouter]);
app.use("/mypages", [mypagesRouter]);
app.use("/reservations", [reservationsRouter]);
app.use("/diaries", [diariesRouter]);


app.listen(port, () => {
  console.log(port, "포트로 서버가 켜졌습니다.");
});


