const express = require("express");
const router = express.Router();
const { Op, Sequelize } = require("sequelize");
const { Sitter } = require("../models");

router.post("/", async (req, res) => {
  const {x,y,radius} = req.body;
  const location = Sequelize.literal(`ST_GeomFromText('POINT(${ x } ${  y })')`)
  const distance = Sequelize.fn('ST_Distance', Sequelize.col('location'), location)
  const sitters = await Sitter.findAll({
    order: distance,
    where: Sequelize.where(distance, { [Op.lte]: radius }),
    logging: console.log,
    category: {
      [Op.in]: [category],
    },
  })
    res.send({sitters})
  });


router.post("/search", async (req, res) => {
  const { region_2depth_name, searchDate, category,radius,x,y } = req.body;
  const location = Sequelize.literal(`ST_GeomFromText('POINT(${ x } ${  y })')`)
  const distance = Sequelize.fn('ST_Distance', Sequelize.col('location'), location)
 
  const sitters = await Sitter.findAll({
    where: {
      region_2depth_name: {
        [Op.eq]: region_2depth_name,
      },
      noDate: {
        [Op.notIn]: searchDate,
      },
      category: {
        [Op.in]: [category],
      },
    },
  
  });
  const date = searchDate.split(",")
  console.log(date)
  if(!sitters?.length){
    const sitter2 = await Sitter.findAll({
      where:{
          noDate: {
        [Op.notIn]: [searchDate],
      },
      category: {
        [Op.in]: [category],
      },
         order: distance,
         where: Sequelize.where(distance, { [Op.lte]: radius }),
         logging: console.log,
          }

    })
    return res.send({sitter2})
  }
  res.send({ sitters});
});

module.exports = router;
