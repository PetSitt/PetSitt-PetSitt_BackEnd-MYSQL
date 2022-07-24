const express = require("express");
const { User } = require("../models");
const { Sitter } = require("../models");
const { Room } = require("../models");
const { Chat } = require("../models");
const { Op } = require("sequelize");
const authMiddleware = require("../middlewares/auth-middleware.js");

function chatSocketRouter(io) {
  io.on("connection", (socket) => {
    console.log(`연결된 소켓 정보: ${socket.id}`);

    //검색을 위해 내 이메일로된 개인방으로 들어갑니다.
    socket.on("join_my_room", (userEmail) => {
      socket.data.userEmail = userEmail;
      socket.join(userEmail);
      console.log("joined my room: " + socket.rooms);
    });

    //메시지 전송 & DB 저장
    socket.on("send_message", async (data) => {
      try {
        console.log("send_message", data);
        const me = await User.findOne({
          where: { userEmail: socket.data?.userEmail },
        });

        //메시지 DB저장
        const chat = await Chat.create({
          roomId: data?.roomId,
          userId: me.id,
          userName: me.userName,
          chatText: data?.message,
        });

        //room 마지막채팅 업데이트
        await Room.update(
          {
            lastChat: data.message,
            lastChatAt: chat.createdAt,
          },
          {
            where: { roomId: data.roomId },
          }
        );

        //상대방의 대화목록 업데이트
        //if ( 1명 일 때) //나만있을 때 console.log(io._nsps.get('/').adapter.rooms.get('62d8f4872dcb0968c04b64c2').size);
        // const otherId =
        //   room.userId !== me.id ? room.userId : room.sitter_userId;
        // const other = await User.findbyId(otherId);
        // socket
        //   .to(other.userEmail)
        //   .emit("receive_chatList", { ...room, newMessage: true });

        //if 방에 2명일 때
        // 메시지 데이터폼 세팅
        const chat_data = {
          newMessage: false,
          userName: me.userName,
          chatText: data.message,
          createdAt: new Date(chat.createdAt).getTime(),
          me: false,
        };

        socket.to(data.roomId).emit("receive_message", chat_data);
      } catch {
        console.log("채팅오류 나서 안됬습니다.");
        socket.to(data.roomId).emit("chat_error", "채팅오류");
      }
    });

    //채팅방 나가기
    socket.on("leave_room", (roomId) => {
      console.log(`ID: ${socket.id} leave room: ${roomId}`);
      socket.leave(roomId);
    });

    //소켓연결 해제
    socket.on("disconnect", () => {
      console.log("User Disconnected", socket.id);
    });
  });

  const router = express.Router();

  //채팅 리스트 요청
  router.get("/chatList", authMiddleware, async (req, res) => {
    try {
      const { user } = res.locals;

      //클라이언트로 보낼 rooms 데이터 세팅
      const room_set = await setRoomForm(user);

      return res.status(200).send({ rooms: room_set });
    } catch {
      return res
        .status(400)
        .send({ errorMessage: "DB정보를 받아오지 못했습니다." });
    }
  });

  // 채팅방 접속
  router.get("/:roomId", authMiddleware, async (req, res) => {
    try {
      const { user } = res.locals;
      const { roomId } = req.params;

      const room = await Room.findOne({ where: { roomId } });
      if (!room) {
        return res
          .status(401)
          .send({ errorMessage: "존재하지 않는 방입니다." });
      }

      const otherId =
        room.userId !== user.id ? room.userId : room.sitter_userId;

      // 해당 room의 모든 chat 가져오기
      const set_chats = [];
      let chats = await Chat.findOne({
        where: { roomId },
        order: [["createdAt", "DESC"]],
      });

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

        for (let i = 0; i < chats.length; i++) {
          const me = chats[i].userId === user.id ? true : false;
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

      //상대방 new_delete 시키기
      // io.in(roomId).emit("new_delete");

      //해당 사람의 소켓을 roomId방에 join 시킨다.
      io.in(user.userEmail).socketsJoin(roomId);

      return res.status(200).send({
        myName: user.userName,
        chats: set_chats,
      });
    } catch {
      return res
        .status(400)
        .send({ errorMessage: "DB정보를 받아오지 못했습니다." });
    }
  });

  router.post("/test", async (req, res) => {
    const array = await io.in("62d8f4872dcb0968c04b64c2").allSockets();

    console.log(
      io._nsps.get("/").adapter.rooms.get("62d8f4872dcb0968c04b64c2").size
    );

    console.log("모든방 정보", io.of("/").adapter.rooms);

    res.send({ msg: "test complete" });
  });

  // 채팅방 존재유무 판단후 만들기
  router.post("/:sitterId", authMiddleware, async (req, res) => {
    console.log("채팅방 존재유무 시작============");
    try {
      const { user } = res.locals;
      const { sitterId } = res.params;

      // 나와 시터간의 방이 있는지 검사
      let room = await Room.findOne({
        where: {
          userId: user.id,
          sitter_userId: sitterId,
        },
      });

      console.log("방 검색 진행되었습니다: ", room?.id);

      // 새로운 방 생성하기
      if (!room) {
        console.log("방이 없어서 만들러 왔습니다.");
        const sitter = await Sitter.findOne({ where: { sitterId } });
        if (!sitter) {
          return res
            .status(401)
            .send({ errorMessage: "상대방이 존재하지 않습니다." });
        }

        room = await Room.create({
          userId: user.id,
          sitter_userId: sitter.userId,
        });
      }

      return res.send({ roomId: room.id });
    } catch {
      return res
        .status(400)
        .send({ errorMessage: "DB정보를 받아오지 못했습니다." });
    }
  });

  return router;
}

// 룸 리스트 정보 세팅
const setRoomForm = async (user) => {
  let other = null;
  let otherId = null;
  let other_sitter = null;
  let room = null;
  let imageUrl = null;
  const room_set = [];

  // 유저 속해있는 모든 room 검색
  const rooms = await Room.findAll({
    where: {
      [Op.or]: [{ userId: user.id }, { sitter_userId: user.id }],
    },
  });

  if (!rooms?.length) return null;

  for (let i = 0; i < rooms?.length; i++) {
    //초기화
    other = null;
    otherId = null;
    other_sitter = null;
    room = null;
    imageUrl =
      "https://kimguen-storage.s3.ap-northeast-2.amazonaws.com/sitterImage/default_user.jpg";

    //상대방 정보 가져오기
    otherId =
      rooms[i].userId !== user.id ? rooms[i].userId : rooms[i].sitter_userId;
    other = await User.findOne({ where: { userId: otherId } });
    if (!other) continue;

    other_sitter = await Sitter.findOne({ where: { userId: other.id } });
    if (other_sitter) imageUrl = other_sitter.imageUrl;

    //room 정보 세팅
    room = {
      newMessage: rooms[i].newMessage,
      roomId: rooms[i].id,
      userName: other.userName,
      lastChat: rooms[i].lastChat,
      lastChatAt: new Date(rooms[i].lastChatAt).getTime(),
      imageUrl,
    };

    room_set.push(room);
  }

  return room_set;
};

module.exports = chatSocketRouter;
