const express = require("express");
const router = express.Router();
const {Op} = require("sequelize")
const { Sitter,sequelize} = require("../models");

router.post("/", async (req, res) => {
<<<<<<< HEAD
  const {x,y} = req.body;
  const sitters = await Sitter.findAll({
    location :{
       type: 'Point',
       coordinates: [x, y] 
      }
})
    res.send({sitters})
=======
  const {x,y, walk, wash, prac, dayCare, boarding} = req.body;
  const sitters = await Sitter.find({
    location: {
      $nearSphere: {
        $geometry: {
          type: "Point",
          coordinates: [x, y],
        },
        $maxDistance: 10000000,
      },
    },
    category:{
      $nin: [
        walk, wash, prac, dayCare, boarding,
      ]}
    ,
  })
  res.send({
    sitters,
>>>>>>> 4ceab9f933bf4e4a813de60a4d2cbbdb526bbffa
  });


router.post("/search", async (req, res) => {
<<<<<<< HEAD
  const {region_2depth_name,searchDate, walk, wash, prac, dayCare, boarding } = req.body;
  const sitters = await Sitter.findAll({
    attributes:[region_2depth_name,searchDate,walk, wash, prac, dayCare, boarding],
        region_2depth_name:{
        eq:region_2depth_name,
=======
  const {region_2depth_name, x, y,searchDate, walk, wash, prac, dayCare, boarding } = req.body;
  const sitters = await Sitter.find({
    region_2depth_name:{
      $eq:region_2depth_name,
    },
    noDate:{
      $nin:
        searchDate,
      },
    category:{
      $nin: [
        walk, wash, prac, dayCare, boarding,
      ]}
});
if(!sitters?.length){
  const sitter2 = await Sitter.find({$and:[
    {noDate:{
      $nin:
        searchDate,
      }
    },
    {category:{
      $nin: [
        walk, wash, prac, dayCare, boarding,
      ]}
    },
],
    location: {
      $nearSphere: {
        $geometry: {
          type: "Point",
          coordinates: [x, y],
        },
        $maxDistance: 10000000,
>>>>>>> 4ceab9f933bf4e4a813de60a4d2cbbdb526bbffa
      },
        noDate:{
          [Op.notIn]:[searchDate
          ],
        },
        category:{
          [Op.in]: [walk, wash, prac, dayCare, boarding,
          ]},
    });
    if(!sitters?.length){
      const sitter2 = await Sitter.findAll({
        where:{
          [Op.and]:[
            {noDate:{
              [Op.notIn]:
                [searchDate],
              }
            },
            {category:{
              [Op.notIn]: [
                walk, wash, prac, dayCare, boarding,
              ]}
            },
        ],
        },
        location :{
          type: 'Point',
          coordinates: [x, y] 
         }
      })
      return res.send({sitter2})
    }
    res.send({sitters});
  });



module.exports = router;

