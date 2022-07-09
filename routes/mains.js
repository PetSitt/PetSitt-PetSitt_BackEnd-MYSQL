const express = require("express");
const router = express.Router();
const { Sitter } = require("../schemas/sitter");

router.get("/", async (req, res) => {
  const sitters = await Sitter.find().sort({ averageStar: -1 });
  res.send({
    sitters,
  });
});

router.get(
  "/auth",
  /*authMiddleware,*/ async (req, res) => {
    const {x,y} = req.body;
    const sitters = await Sitter.find({
      location: {
        $nearSphere: {
          $geometry: {
            type: "Point",
            coordinates: [x,y],
          },
          $maxDistance: 100000,
        },
      },
    }).sort({ averageStar: -1 });
    res.send({
      sitters,
    });
  }
);


router.get("/search/:category",async(req,res) => {
  const {category} = req.params;
  const categories = await Sitter.find({category})
  res.send({
      categories
  })
});
module.exports = router;

