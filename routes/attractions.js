const express = require("express");
const router = express.Router();
const Attraction = require("../models/attraction");

function datasetting(data) {
  const result = {};
  result["address"] = data["address"];
  result["category"] = data["category"];
  result["description"] = data["description"];
  result["id"] = data["id"];
  result["images"] = data["images"];
  result["lat"] = data["lat"];
  result["lng"] = data["lng"];
  result["mrt"] = data["mrt"];
  result["name"] = data["name"];
  result["transport"] = data["transport"];
  return result;
}

router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await Attraction.findOne({ id }).exec();
    const result = {};
    if (data === null) {
      result["error"] = true;
      result["message"] = "景點編號不正確";
      return res.status(400).send(result);
    }
    result["data"] = datasetting(data);
    return res.send(result);
  } catch (e) {
    next(e);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const { page, keyword } = req.query;
    const result = {};
    if ((page === "") | (Number(page) < 0) | (page === undefined)) {
      result["error"] = true;
      result["message"] = "page未輸入 或 page輸入非資料有效範圍內";
      return res.status(400).send(result);
    }
    const searchKey = new RegExp(keyword);
    const data = await Attraction.find({
      $or: [
        {
          name: searchKey,
        },
        {
          mrt: searchKey,
        },
      ],
    })
      .sort({ id: 1 })
      .skip(page * 12)
      .limit(13)
      .exec();

    let length = data.length;
    if (length === 0) {
      result["error"] = true;
      result["message"] = "無資料";
      return res.status(400).send(result);
    } else if (length === 13) {
      length = 12;
      result["nextPage"] = Number(page) + 1;
    } else {
      result["nextPage"] = null;
    }

    result["data"] = [];
    for (let i = 0; i < length; i++) {
      result["data"].push(datasetting(data[i]));
    }
    return res.send(result);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
