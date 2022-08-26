const express = require('express');
const { sequelize } = require('./models');

const reviewsRouter = require('./routes/reviews');
const mainsRouter = require('./routes/mains');
const cookieParser = require('cookie-parser');
const mypagesRouter = require('./routes/mypages');
const usersRouter = require('./routes/users');
const reservationRouter = require('./routes/reservations.js');
const diariesRouter = require('./routes/diaries');
const detailsRouter = require('./routes/details.js');
const informationRouter = require('./routes/information.js');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const port = 3000;
const server = http.createServer(app);
const io = require('socket.io')(server, {
  cors: {
    origin: '*',
  },
});

const chatRouter = require('./routes/chats.js')(io);

sequelize
  .sync()
  .then(() => {
    console.log('데이터베이스 연결 성공');
  })
  .catch((err) => {
    console.error(err);
  });

app.use(
  cors({
    exposedHeaders: ['authorization'],
    origin: '*', 
    credentials: 'true', 
  })
);

app.use(express.json()); 
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(helmet());

app.use((req, res, next) => {
  console.log(`Req: [${req.method}] -`, req.originalUrl, ' - ', new Date());
  next();
});

app.use('/api', [usersRouter]);
app.use('/details', [detailsRouter]);
app.use('/reviews', [reviewsRouter]);
app.use('/mains', [mainsRouter]);
app.use('/mypages', [mypagesRouter]);
app.use('/reservations', [reservationRouter]);
app.use('/diaries', [diariesRouter]);
app.use('/chats', [chatRouter]);
app.use('/informations', [informationRouter]);

server.listen(port, () => {
  console.log(port, '포트로 서버가 켜졌습니다.');
});
