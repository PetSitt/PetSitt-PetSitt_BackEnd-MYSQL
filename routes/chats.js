const express = require('express');
const { User } = require('../models');
const { Sitter } = require('../models');
const { Room } = require('../models');
const { Chat } = require('../models');
const { Op } = require('sequelize');
const authMiddleware = require('../middlewares/auth-middleware.js');

function chatSocketRouter(io) {
  io.on('connection', (socket) => {
    console.log(`연결된 소켓 정보: ${socket.id}`);

    //검색을 위해 내 이메일로된 개인방으로 들어갑니다.
    socket.on('join_my_room', (userEmail) => {
      socket.data.userEmail = userEmail;
      socket.join(userEmail);

      console.log('joined my room: ', socket.rooms);
    });

    //메시지 전송 & DB 저장
    socket.on('send_message', async (data) => {
      try {
        console.log('send_message', data);

        socket.data.userEmail = data.userEmail;
        socket.join(data.userEmail);
        const me = await User.findOne({
          where: { userEmail: data.userEmail },
        });

        //메시지 DB저장
        const chat = await Chat.create({
          roomId: data?.roomId,
          userId: me.userId,
          userName: me.userName,
          chatText: data?.message,
        });

        //room 마지막채팅 업데이트
        await Room.update(
          {
            lastChat: data.message,
            lastChatAt: chat.createdAt,
          },
          { where: { roomId: data.roomId } }
        );

        //상대방의 대화목록 업데이트
        const sockets = await io.in(`${data.roomId}`).fetchSockets();

        if (sockets?.length === 2) {
          console.log(`(${data.roomId}) 채팅방에 두 명 있어요!`);
          const chat_data = {
            newMessage: false,
            userName: me.userName,
            chatText: data.message,
            createdAt: new Date(chat.createdAt).getTime(),
            me: false,
          };

          socket.to(`${data.roomId}`).emit('receive_message', chat_data);
        } else if (sockets?.length === 1) {
          console.log(`(${data.roomId}) 채팅방에 혼자에요...`);
          // const room = await Room.findOne({ where: { roomId: data.roomId } });
          // const otherId = room.userId !== String(me.userId) ? room.userId : room.sitter_userId;
          // const other = await User.findOne({ where: { userId: otherId } });

          const room_data = {
            newMessage: true,
            roomId: data.roomId,
            lastText: data.message,
            lastChatAt: new Date(chat.createdAt).getTime(),
          };

          //상대방의 채팅리스트를 최신화
          socket.to(other.userEmail).emit('receive_chatList', room_data);
        }
      } catch {
        console.log('채팅오류 나서 안됬습니다.');
        socket.to(data.roomId).emit('chat_error', '채팅오류');
      }
    });

    //채팅방 나가기
    socket.on('leave_room', (roomId) => {
      console.log(`ID: ${socket.id} leave room: ${roomId}`);
      socket.leave(roomId);
    });

    //소켓연결 해제
    socket.on('disconnect', () => {
      console.log('User Disconnected', socket.id);
    });
  });

  const router = express.Router();

  //채팅 리스트 요청

  router.get('/chatList/:socketId', authMiddleware, async (req, res) => {
    try {
      const { user } = res.locals;
      const { socketId } = req.params;

      //보낸 socketId로 자신의 이메일로 된 방으로 들어감
      io.in(socketId).socketsJoin(user.userEmail);

      //클라이언트로 보낼 rooms 데이터 세팅
      const room_set = await setRoomForm(user);

      return res.status(200).send({ rooms: room_set });
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

      //보낸 socketId로 자신의 이메일로 된 방으로 들어감
      io.in(socketId).socketsJoin(user.userEmail);

      const room = await Room.findOne({ where: { roomId } });
      if (!room) {
        return res
          .status(401)
          .send({ errorMessage: '존재하지 않는 방입니다.' });
      }

      const otherId =
        room.userId !== String(user.userId) ? room.userId : room.sitter_userId;

      // 해당 room의 모든 chat 가져오기
      const set_chats = [];
      let chats = await Chat.findAll({
        where: { roomId },

        order: [['createdAt', 'ASC']],
      });

      console.log('채팅 갯수:', chats?.length);

      if (chats?.length) {
        //채팅방 접속순간 내가 확인하게 되기 때문에 상대방의 newMessage는 모두 false 처리
        await Chat.update(
          { newMessage: false },
          {
            where: {
              userId: otherId,
              roomId,
            },
          }
        );

        //상대방 new_delete 시키기
        io.in(`${roomId}`).emit('new_delete');

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

      console.log('세팅된 개수:', set_chats.length);

      //해당 사람의 소켓을 roomId방에 join 시킨다.
      io.in(user.userEmail).socketsJoin(`${roomId}`);
      console.log(`join Room: ${roomId}`);

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

  router.post('/test', async (req, res) => {
    console.log('--------------------------');
    if (io.sockets) {
      console.log(io.sockets.adapter.rooms);
      const sockets = await io.in('50').fetchSockets();
      console.log(sockets?.length);
    } else {
      console.log('소켓이 없습니다.');
    }
    console.log('--------------------------');

    res.send({ msg: 'test complete' });
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

      // 나와 시터간의 방이 있는지 검사
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

      if (created) {
        console.log('방이 없어서 만들었습니다.', room.roomId);
        //new_room
      }

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
  let imageUrl = null;
  const room_set = [];

  for (let i = 0; i < rooms?.length; i++) {
    //초기화
    other = null;
    otherId = null;
    other_sitter = null;
    room = null;
    imageUrl =
      'https://kimguen-storage.s3.ap-northeast-2.amazonaws.com/sitterImage/default_user.jpg';

    //내가 시터인지 사용자인지 판단
    if (rooms[i].userId !== String(user.userId)) {
      otherId = rooms[i].userId;
      other_state = 'user';
    } else {
      otherId = rooms[i].sitter_userId;
      other_state = 'sitter';
    }

    //상대방의 정보 가져오기

    other = await User.findOne({ where: { userId: otherId } });
    if (!other) continue;

    other_sitter = await Sitter.findOne({
      where: { userId: String(other.userId) },
    });
    if (other_sitter) imageUrl = other_sitter.imageUrl;

    // 채팅방 리스트에 new 만들기
    const newThing =
      other_state === 'user' ? rooms[i].userNew : rooms[i].sitterNew;

    //room 정보 세팅
    room = {
      roomId: rooms[i].roomId,
      userName: other.userName,
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
