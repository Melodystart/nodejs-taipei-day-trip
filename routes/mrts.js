const express = require("express");
const router = express.Router();
const Attraction = require("../models/attraction");

router.get("/", async (req, res, next) => {
  try {
    const result = {};
    result["data"] = [];
    let items = await Attraction.aggregate([
      { $unwind: "$mrt" },
      { $sortByCount: "$mrt" },
    ]);
    items.forEach((item) => {
      result["data"].push(item["_id"]);
    });
    return res.send(result);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
