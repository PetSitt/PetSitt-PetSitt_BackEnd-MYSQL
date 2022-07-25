const express = require("express");
const router = express.Router();
const { Sitter } = require("../models");
const { Op, Sequelize } = require("sequelize");

router.post("/", async (req, res) => {
  const { x, y, category } = req.body;
  const location = Sequelize.literal(`ST_GeomFromText('POINT(${x} ${y})')`);
  const distance = Sequelize.fn(
    "ST_Distance",
    Sequelize.col("location"),
    location
  );
  const sitter = [];
  const sitters = await Sitter.findAll({
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
  res.send({ sitter });
});

router.post("/search", async (req, res) => {
  const { region_2depth_name, searchDate, category, x, y } = req.body;
  const location = Sequelize.literal(`ST_GeomFromText('POINT(${x} ${y})')`);
  const distance = Sequelize.fn(
    "ST_Distance",
    Sequelize.col("location"),
    location
  );

  const sitters = [];
  const sitters2 = await Sitter.findAll({
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

  if (!sitters?.length) {
    const sitters2 = await Sitter.findAll({
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
      if (!intersection.length && intersection2.length === category.length) {
        sitters.push(sitters2[i]);
      }
    }
    return res.send({ sitters });
  }
  res.send({ sitters });
});

module.exports = router;
