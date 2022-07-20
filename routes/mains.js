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
  const sitters = [];
  const sitters2 = await Sitter.findAll({
  });

  for(i=0; i<sitters2.length; i++){
    const intersection = searchDate.split(",").filter(x => sitters2[i].noDate.split(",").includes(x));
    if(!intersection.length){
      sitters.push(sitters2[i]);
    }
  }
  res.send({sitters});
});

module.exports = router;
