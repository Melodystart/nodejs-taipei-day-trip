const express = require("express");
const router = express.Router();
const User = require("../models/user");
const passport = require("passport");
require("../config/passport")(passport);
const bcrypt = require("bcrypt");
const saltRounds = 12;
const jwt = require("jsonwebtoken");
const multer = require("multer");
const upload = multer();
const AWS = require("aws-sdk");
const s3 = new AWS.S3({
  accessKeyId: process.env.aws_access_key,
  secretAccessKey: process.env.aws_secret_key,
});

router.post("/", async (req, res) => {
  try {
    let { name, password, email } = req.body;

    if (
      (name === undefined) |
      (password === undefined) |
      (email === undefined)
    ) {
      return res
        .status(400)
        .send({ error: true, message: "註冊失敗：欄位皆為必填" });
    }

    const data = await User.find({ email }).exec();
    if (data.length !== 0) {
      return res.status(400).send({
        error: true,
        message: "註冊失敗：email已註冊過",
      });
    }
    const filename = "/uploads/default.png";
    const hashValue = await bcrypt.hash(password, saltRounds);
    const newUser = new User({ name, password: hashValue, email, filename });
    const savedUser = await newUser.save();
    return res.send({ ok: true });
  } catch (e) {
    res.status(500).send(e);
  }
});

router.put("/auth", async (req, res) => {
  try {
    let { password, email } = req.body;

    if ((password === undefined) | (email === undefined)) {
      return res
        .status(400)
        .send({ error: true, message: "登入失敗：欄位皆為必填" });
    }

    const foundUser = await User.findOne({ email }).exec();
    if (!foundUser) {
      return res.status(400).send({
        error: true,
        message: "登入失敗：無此email使用者",
      });
    } else {
      const result = await bcrypt.compare(password, foundUser.password);
      if (result) {
        const tokenObject = {
          id: foundUser._id,
          name: foundUser.name,
          email: foundUser.email,
          exp: Date.now() + 7 * 24 * 60 * 60,
        };
        const token = jwt.sign(tokenObject, process.env.PASSPORT_SECRET);
        return res.status(200).send({ token: token });
      } else {
        return res
          .status(400)
          .send({ error: true, message: "登入失敗：密碼錯誤" });
      }
    }
  } catch (e) {
    res.status(500).send(e);
  }
});

router.get("/auth", async (req, res) => {
  passport.authenticate("jwt", { session: false }, (err, user) => {
    if (user) {
      return res.status(200).send({
        data: {
          id: user._id,
          name: user.name,
          email: user.email,
          filename: user.filename,
        },
      });
    }
    return res.status(200).send({
      data: null,
    });
  })(req, res);
});

router.put("/profile", upload.any(), async (req, res) => {
  try {
    passport.authenticate("jwt", { session: false }, async (err, user) => {
      if (user) {
        const { name, password, email } = req.body;

        if ((name === undefined) | (email === undefined)) {
          return res.status(400).send({
            error: true,
            message: "更新失敗，名字與email為資料更新必填欄位",
          });
        }

        let filename = user.filename;
        if (req.files.length !== 0) {
          s3.deleteObject(
            { Bucket: process.env.s3_bucket_name, Key: user._id.toString() },
            (err, data) => {
              if (err) console.log(err, err.stack);
            }
          );
          filename = "https://d3688zrms0ilwo.cloudfront.net/" + user._id;
          const base64data = Buffer.from(req.files[0].buffer, "binary");
          params = {
            Bucket: process.env.s3_bucket_name,
            Key: user._id.toString(), // 希望儲存在 S3 上的檔案名稱
            Body: base64data,
            ContentType: req.files[0].mimetype, // 副檔名
          };
          s3.upload(params, function (err, data) {
            if (err) console.log(err, err.stack);
          });
        }

        if (password !== undefined) {
          let hashValue = await bcrypt.hash(password, saltRounds);
          updateData = {
            name,
            password: hashValue,
            email,
            filename,
          };
        } else {
          updateData = {
            name,
            email,
            filename,
          };
        }

        User.findByIdAndUpdate(user._id, updateData).exec();
        return res.status(200).send({ ok: true });
      }
      return res.status(403).send({
        error: true,
        message: "未登入系統，拒絕存取",
      });
    })(req, res);
  } catch (e) {
    console.log(e);
  }
});

module.exports = router;
