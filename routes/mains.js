const express = require("express");
const router = express.Router();
const {Op} = require("sequelize")
const { Sitter,sequelize} = require("../models");

router.post("/", async (req, res) => {

  const {x,y} = req.body;
  const sitters = await Sitter.findAll({
    location :{
       type: 'Point',
       coordinates: [x, y] 
      }
})
    res.send({sitters})

  });


router.post("/search", async (req, res) => {

  const {region_2depth_name,searchDate, walk, wash, prac, dayCare, boarding } = req.body;
  const sitters = await Sitter.findAll({
    attributes:[region_2depth_name,searchDate,walk, wash, prac, dayCare, boarding],
        region_2depth_name:{
        eq:region_2depth_name,

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

