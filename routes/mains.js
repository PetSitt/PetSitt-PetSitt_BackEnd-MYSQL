const express = require('express');
const router = express.Router();
const { Sitter } = require('../models');
const { Op, Sequelize } = require('sequelize');


router.post("/", async (req, res) => {
  try {
    const { limit, offset, x, y, category } = req.body;

    const location = Sequelize.literal(`ST_GeomFromText('POINT(${x} ${y})')`);
    const distance = Sequelize.fn(
      "ST_Distance",
      Sequelize.col("location"),
      location
    );
    if (x === "undefined" || y === "undefined" || !x || !y) {
      x = 126.875078748377;
      y = 37.4856025065543;
      }

    const next = [];
    const sitter = [];
    const sitters = await Sitter.findAll({
      offset: offset,
      limit: limit,
      order: distance,
      where: Sequelize.where(distance, { [Op.lte]: 0.5 }),
    });

    for (i = 0; i < sitters.length; i++) {
      const intersection2 = category.filter((x) =>
        sitters[i].category.includes(x)
      );
      if (intersection2.length === category.length) {
        sitter.push(sitters[i]);
      }
    }
    if(sitter.length){
      next.push(true)
    }
    if(!sitter.length){
      next.push(false)
    }
    
    return res.status(200).send({ sitter,next });
  } catch {
    res.status(400).send({ errorMessage: "시터 정보가 없습니다." });
  }

});

router.post("/search", async (req, res) => {
  const { region_2depth_name, searchDate, category, x, y, limit, offset } = req.body;
  const location = Sequelize.literal(`ST_GeomFromText('POINT(${x} ${y})')`);
  const distance = Sequelize.fn(
    'ST_Distance',
    Sequelize.col('location'),
    location
  );

  const next = [];
  const sitters = [];
  const sitters2 = await Sitter.findAll({
    offset: offset,
    limit: limit,
    where: {
      region_2depth_name: { [Op.eq]: region_2depth_name },
    },
  });

if (x === "undefined" || y === "undefined" || !x || !y) {
    x = 126.875078748377;
    y = 37.4856025065543;
  }
  for (i = 0; i < sitters2.length; i++) {
    const intersection = searchDate.filter((x) =>
      sitters2[i].noDate.includes(x)
    );
    const intersection2 = category.filter((x) =>
      sitters2[i].category.includes(x)
    );
    if (!intersection.length && intersection2.length === category.length) {
      sitters.push(sitters2[i]);
    }
  }
  
  if(!sitters.length){
    next.push(false)
  }

  if (!sitters?.length ) {
    const sitters2 = await Sitter.findAll({
      offset: offset,
      limit: limit,
      order: distance,
      where: Sequelize.where(distance, { [Op.lte]: 0.5 }),
    });
    for (i = 0; i < sitters2.length; i++) {
      const intersection = searchDate.filter((x) =>
        sitters2[i].noDate.includes(x)
      );
      const intersection2 = category.filter((x) =>
        sitters2[i].category.includes(x)
      );
      if(!intersection2.length ){
        return res.send({sitters:[]})
      }
      if (!intersection.length && intersection2.length === category.length) {
        sitters.push(sitters2[i]);
      }
    }
    return res.send({ sitters, next });
  }
  res.send({ sitters });
});

module.exports = router;
