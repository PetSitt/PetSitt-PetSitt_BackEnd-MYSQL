const express = require("express");
const router = express.Router();
const {User} = require("../schemas/user.js");
const {Pet} = require("../schemas/pet.js");
const {Sitter} = require("../schemas/sitter.js");
const location_info = require("../static/location_test.js");
const bcrypt = require('bcrypt');
require("dotenv").config();

/*
* 더미데이터 넣기 사용방법
* 원하는 DB에 연결 후 
* /adduser 사용후
* /addpet, /addsitter 순서 상관없이 1번씩 api접근하시면 됩니다!
*/


//테스트용 유저 넣는 api입니다.
router.post("/adduser", async (req, res) => {

  const salt = await bcrypt.genSalt(Number(process.env.SALT));
  const hashPassword = await bcrypt.hash("1234qwer!", salt);

  const createNum = 20; //생성 명수

  const uname  = ["형근", "승완", "정현", "아름", "윤호", "하연", "정민", "가은"];
  const ufirst = ["김", "이", "박", "차", "유", "서", "남궁", "우", "최", "소"];

  for (let i = 0; i < createNum; i++) {
    const user =  new User ({ 
      userEmail:   `test${i}@email.com`,
      password:    hashPassword,
      userName:    r_arr_val(ufirst) + r_arr_val(uname),
      phoneNumber: "010-1234-1234",
    });

    user.save();
  }

  res.send({
    msg: "성공",
  });
});

//유저 생성이후에 실행하면 자동으로 펫정보 넣어요.
router.post("/addpet", async (req, res) => {
  const users = await User.find({});

  const pet_select = ["진돗개"  , "치와와"   , "불도그"  , "포메라니안", "푸들",
                      "리트리버", "핏불테리어", "닥스훈트", "시바견"   , "시추",
                      "비글"    , "말티즈"   , "차우차우", "보더콜리"  , "웰시코기"];

  const pet_name  = ["호떡", "찰떡", "코코", "보리", "콩이",
                     "초코", "루나", "여름", "가을", "겨울",
                     "봄이"];

  const pet_first = ["김", "이", "박"];

  const pet_intro = ["는 많이 예뻐요",
                     "는 화가 많아요",
                     "는 강해요",
                     "는 산책을 최고로 좋아합니다.",
                     "는 간식을 좋아해요"];

  if (users.length) {
    users.map((user, index) => {
      const petName  = r_arr_val(pet_first) + r_arr_val(pet_name);
      const petType  = r_arr_val(pet_select);
      const petIntro = petName + r_arr_val(pet_intro);

      const pet =  new Pet ({ 
        petName,
        petType,
        petIntro,
        petImage:  process.env.AWS_IP + petType+ ".jpg",
        petAge:    r_num() % 15,
        petWeight: r_num() % 20,
        petSpay:   r(),
        userId:    user._id.toString()
      });
    
      pet.save();
    });
  }
  res.send({msg: "성공"});
});

//유저 생성이후 정보 넣기
router.post("/addsitter", async (req, res) => {
  const users = await User.find({});

  const title_text = ["사랑으로 돌봐드리겠습니다.❤️",
                      "경험과 노하우로 안전한 시팅😉",
                      "정성을 다해 사랑으로 돌봐드려요.",
                      "프로산책러 인사드립니다.",
                      "내아이를 돌보듯 따뜻하고 편안하게",
                      "사랑과 안락함이 넘치는 집",
                      "안전 최우선 돌보미!",
                      "편안한 가족처럼~",
                      "밍꾸와 함께하는 보금자리👭"];

  const r_house = ["house1.jpg",
                 "house2.jpg",
                 "house3.jpeg",
                 "house4.jpeg"];


  if (users.length > 0) {
    users.map((user, index) => {

      const sitter = new Sitter({
        userId:       user._id.toString(),
        imageUrl:     process.env.AWS_IP + "default.jpg",
        mainImageUrl: process.env.AWS_IP + r_arr_val(r_house),
        introTitle:   r_arr_val(title_text),
        myIntro:      `인트로확인용_${index}`,
        careSize:     [r()?true:false, r()?true:false, r()?true:false],
        category:     r_category(),
        servicePrice: (r_num() %10 *10000) + (r_num() % 10 * 1000),
        plusService:  r_plusService(),
        noDate:       r_date(),
        averageStar:  r_num() % 5 + 0.5*(r_num() % 2),
        address:            location_info[index].address,
        detailAddress:      location_info[index].detailAddress,
        region_1depth_name: location_info[index].region_1depth_name,
        region_2depth_name: location_info[index].region_2depth_name,
        region_3depth_name: location_info[index].region_3depth_name,
        location: {
          type: "Point",
          coordinates: [
            location_info[index].x,
            location_info[index].y
          ],
        },
        rehireRate:   r_num() % 100
      });

      sitter.save();
    });
  }

  res.send({msg:"성공"});
});


router.get("/find", async (req, res) => {

  const users = await User.find({
    location : {
      $nearSphere : {
          $geometry : {
              type: "Point",
              coordinates: [126.8990639, 33.4397954]
          },
          $maxDistance : 100000,
      }
  }
  });

  console.log(users);

  res.send({
    msg:"성공"
  });
});


const r_num = () => {
  return Math.floor(Math.random() * 10000);
};

const r = () => {
  return r_num() % 2;
};

const r_arr_val = (arr) => {
  return arr[r_num() % arr.length];
};

const r_date = () => { // 기본형참고 - 2022/06/29
  const arr_date = [];

  for (let i = 0; i < r_num() % 4 + 3; i++) {
    let temp = (r_num() % 3) + `${i}`;

    arr_date.push(`2022/07/${temp}`);
  }

  return arr_date;
};

const r_category = () => {
  const category = ["산책", "목욕, 모발 관리", "훈련", "데이 케어", "1박 케어"];

  const return_arr = [];

  for (let i = 0; i < r_num() % category.length + 1; i++) {
    let temp = r_arr_val(category);

    if (return_arr.includes(temp)) {
      i--;
      continue;
    }

    return_arr.push(temp);
  }
  return return_arr;
};

const r_plusService = () => {
  const plusService = ["집앞 픽업 가능", 
                           "응급 처치",
                           "장기 예약 가능",
                           "퍼피 케어",
                           "노견 케어",
                           "실내놀이",
                           "마당있음"];

  const return_arr = [];

  for (let i = 0; i < r_num() % plusService.length + 1; i++) {
    let temp = r_arr_val(plusService);

    if (return_arr.includes(temp)) {
      i--;
      continue;
    }

    return_arr.push(temp);
  }

  return return_arr;
};

module.exports = router;