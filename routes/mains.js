const express = require("express");
const router = express.Router();
const {Op} = require("sequelize")
const { Sitter} = require("../models");

router.post("/", async (req, res) => {
  const {x,y} = req.body;
  const sitters = await Sitter.findAll({
    where:{
      type:'Point',
          coordinates: [x, y],
      }
})
    res.send({sitters})
  });


router.post("/search", async (req, res) => {

  const {region_2depth_name,searchDate, walk, wash, prac, dayCare, boarding } = req.body;
  const sitters = await Sitter.findAll({
   where:{
      region_2depth_name:{
        [Op.eq]:region_2depth_name,
      },
      noDate:{
        [Op.notIn]:
          [searchDate],
        },
      category:{
        [Op.notIn]: [
          walk, wash, prac, dayCare, boarding,
        ]}
   }
    
    });
    // if(!sitters?.length){
    //   const sitter2 = await Sitter.findAll({
    //     where:{
    //         noDate:{
    //           [Op.notIn]:
    //             [searchDate],
    //           },
    //         category:{
    //           [Op.notIn]: [
    //             walk, wash, prac, dayCare, boarding,
    //           ]},
    //       type: 'Point',
    //       coordinates: [x, y] 
    //        }
         
    //   })
    //   return res.send({sitter2})
    // }
    res.send({sitters});
  });



module.exports = router;

