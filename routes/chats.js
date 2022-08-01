const express = require('express');
const { User } = require('../models');
const { Sitter } = require('../models');
const { Room } = require('../models');
const { Chat } = require('../models');
const { Op } = require('sequelize');
const authMiddleware = require('../middlewares/auth-middleware.js');

let clients = [];
const headers = {
  'Content-Type': 'text/event-stream',
  'Connection': 'keep-alive',
  'Cache-Control': 'no-cache',
  'Access-Control-Allow-Origin': '*'
};

function chatSocketRouter(io) {
  io.on('connection', (socket) => {
    
    socket.on('join_room', (roomId) => {
      socket.join(`${roomId}`);
    });

    //메시지 전송 & DB 저장
    socket.on('send_message', async (data) => {
      try {
        const me = await User.findOne({
          where: { userEmail: data.userEmail },
        });

        const room = await Room.findOne({ where: { roomId: data.roomId } });
        let other = null;
        let userNew = false;
        let sitterNew = false;
        let otherPos = null;

        // 예외 처리 - 연결이 끊겼을 경우 대비
        socket.join(`${room.roomId}`);

        // 상대방의 정보 세팅
        if (room.userId === String(me.userId)) {
          other = await User.findOne({ where: { userId: room.sitter_userId } });    
          otherPos = 'sitter';

        } else {
          other = await User.findOne({ where: { userId: room.userId } });
          otherPos = 'user';
        }

        //메시지 DB저장
        const chat = await Chat.create({
          roomId: data.roomId,
          userId: me.userId,
          userName: me.userName,
          chatText: data.message,
        });

        //상대방에게 메시지 보내기
        const sockets = await io.in(`${data.roomId}`).fetchSockets();

        if (sockets?.length === 2) {
          const chat_data = {
            newMessage: false,
            userName: me.userName,
            chatText: data.message,
            createdAt: new Date(chat.createdAt).getTime(),
            me: false,
          };

          socket.to(`${data.roomId}`).emit('receive_message', chat_data);

        } else if (sockets?.length === 1) {
          const room_data = {
            newMessage: true,
            roomId: data.roomId,
            lastText: data.message,
            lastChatAt: new Date(chat.createdAt).getTime(),
          };

          //other가 접속해 있다면 보냅니다 - server-sent-Event
          clients.forEach(client => {
            if (client.userEmail === other.userEmail) {
              client.res.write(`data: ${JSON.stringify(room_data)}\n\n`);
            }
          });

          //chatList 업데이트용 세팅
          otherPos === 'user' ? userNew = true : sitterNew = true;
        }

        //room 마지막채팅 업데이트
        await Room.update (
          {
            lastChat: data.message,
            lastChatAt: chat.createdAt,
            userNew,
            sitterNew,
          },
          { where: { roomId: data.roomId } }
        );

      } catch {
      }
    });

    //소켓연결 해제
    socket.on('disconnect', () => {
      console.log('User Disconnected', socket.id);
    });
  });

  const router = express.Router();
  
  //Server-Sent-Event 연결
  router.get('/sse/:userEmail', async (req, res) => {
    try {
      // 접속하는 순서대로 이메일 등록
      const { userEmail } = req.params;
      const me = await User.findOne({ where: { userEmail } });

      // 헤더 세팅
      res.writeHead(200, headers);

      //접속시 메뉴바 new표기 확인
      const newMessage = await Room.findOne({ 
          where: {
            [Op.or]: [
              { userId: String(me.userId), userNew: true },
              { sitter_userId: String(me.userId), sitterNew: true },
            ]
          },
      });

      console.log("SSE연결:", userEmail);

      let room_data = {
        newMessage: false,
        roomId: null,
        lastText: null,
        lastChatAt: null,
      };

      // 룸 중에 new가 있으면 true 보냄
      if (newMessage) room_data.newMessage = true;
      res.write(`data: ${JSON.stringify(room_data)}\n\n`);

      // 새로운 연결 저장
      clients.push({ userEmail, res });

      res.on('close', () => {
        clients = clients.filter(client => client.userEmail !== userEmail);
      });

    } catch {
      return res
        .status(400)
        .send({ errorMessage: "SSE등록 오류" });
    }
  });

  //채팅 리스트 요청
  router.get('/chatList', authMiddleware, async (req, res) => {
    try {
      const { user } = res.locals;

      //클라이언트로 보낼 rooms 데이터 세팅
      const rooms = await setRoomForm(user);

      return res.status(200).send({ rooms });
    } catch {
      return res
        .status(400)
        .send({ errorMessage: 'DB정보를 받아오지 못했습니다.' });
    }
  });

  // 채팅방 접속
  router.get('/:roomId/:socketId', authMiddleware, async (req, res) => {
    try {
      const { user } = res.locals;
      const { roomId, socketId } = req.params;

      const room = await Room.findOne({ where: { roomId } });
      if (!room) {
        return res
          .status(401)
          .send({ errorMessage: '존재하지 않는 방입니다.' });
      }

      //보낸 socketId로 채팅방으로 들어감
      io.in(socketId).socketsJoin(`${room.roomId}`);

      //room의 new로 된 부분 false로 바꿔주기
      const myPos = room.userId === String(user.userId) ? 'user' : 'sitter';

      if (myPos === 'user' && room.userNew === true) {
        await Room.update(
          { userNew: false }, 
          { where: { roomId: room.roomId } }
        );
      } else if (myPos === 'sitter' && room.sitterNew === true) {
        await Room.update(
          { sitterNew: false }, 
          { where: { roomId: room.roomId } }
        );        
      }

      // 해당 room의 모든 chat 가져오기
      const set_chats = [];
      let chats = await Chat.findAll({
        where: { roomId },
        order: [['createdAt', 'ASC']],
      });

      if (chats?.length) {
        for (let i = 0; i < chats.length; i++) {
          const me = chats[i].userId === String(user.userId) ? true : false;
          const chat = {
            newMessage: me ? chats[i].newMessage : false,
            roomId: chats[i].roomId,
            userName: chats[i].userName,
            chatText: chats[i].chatText,
            createdAt: new Date(chats[i].createdAt).getTime(),
            me,
          };

          set_chats.push(chat);
        }
      }

      return res.status(200).send({
        myName: user.userName,
        chats: set_chats,
      });
    } catch {
      return res
        .status(400)
        .send({ errorMessage: 'DB정보를 받아오지 못했습니다.' });
    }
  });

  // 채팅방 존재유무 판단 후 만들기
  router.post('/:sitterId', authMiddleware, async (req, res) => {
    try {
      const { user } = res.locals;
      const { sitterId } = req.params;

      const sitter = await Sitter.findOne({ where: { sitterId } });
      if (!sitter) {
        return res
          .status(401)
          .send({ errorMessage: '상대방이 존재하지 않습니다.' });
      }

      // 나와 시터간의 방이 있는지 검사하고 없으면 생성
      const [room, created] = await Room.findOrCreate({
        where: {
          userId: String(user.userId),
          sitter_userId: sitter.userId,
        },
        defaults: {
          userId: user.userId,
          sitter_userId: sitter.userId,
        },
      });

      return res.send({ roomId: room.roomId });
    } catch {
      return res
        .status(400)
        .send({ errorMessage: 'DB정보를 받아오지 못했습니다.' });
    }
  });

  return router;
}

// 룸 리스트 정보 세팅
const setRoomForm = async (user) => {
  //유저 속해있는 모든 room 검색
  const rooms = await Room.findAll({
    where: {
      [Op.or]: [{ userId: user.userId }, { sitter_userId: user.userId }],
    },
  });

  if (!rooms?.length) return null;

  let other = null;
  let otherId = null;
  let other_sitter = null;
  let other_state = null;
  let room = null;
  let userName = "";
  let imageUrl = null;
  const room_set = [];

  for (let i = 0; i < rooms?.length; i++) {
    //초기화
    other = null;
    otherId = null;
    other_sitter = null;
    room = null;
    userName = "";
    imageUrl =
      'https://kimguen-storage.s3.ap-northeast-2.amazonaws.com/sitterImage/default_user.jpg';

    //내가 시터인지 사용자인지 판단
    if (rooms[i].userId === String(user.userId)) {
      otherId = rooms[i].sitter_userId;
      other_state = 'sitter';
    } else {
      otherId = rooms[i].userId;
      other_state = 'user';
    }

    //상대방의 정보 가져오기
    other = await User.findOne({ where: { userId: otherId } });
    if (!other) continue;

    if ( other_state === 'sitter') {
      other_sitter = await Sitter.findOne({
        where: { userId: String(other.userId) },
      });

      userName = other_sitter.sitterName;
      imageUrl = other_sitter.imageUrl;
    } else {
      userName = other.userName;
    }

    // 채팅방 리스트에 new 만들기
    const newThing = other_state === 'user' ? rooms[i].sitterNew : rooms[i].userNew;

    // room 정보 세팅
    room = {
      roomId: rooms[i].roomId,
      userName,
      lastChat: rooms[i].lastChat,
      lastChatAt: new Date(rooms[i].lastChatAt).getTime(),
      imageUrl,
      newMessage: newThing,
    };
    room_set.push(room);
  }

  return room_set;
};

module.exports = chatSocketRouter;
