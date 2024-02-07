const express = require("express");
const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    return res.status(200).send({
      data: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        filename: req.user.filename,
      },
    });
  } catch (e) {
    return res.status(200).send(message);
  }
});

router.get("/test", (req, res) => {
  return res.send("test成功");
});

module.exports = router;
