const express = require("express");
const router = express.Router();
const Booking = require("../models/booking");
const Attraction = require("../models/attraction");
const passport = require("passport");
require("../config/passport")(passport);

router.post("/", async (req, res) => {
  try {
    passport.authenticate("jwt", { session: false }, async (err, user) => {
      if (user) {
        const { attractionId, date, time, price } = req.body;
        const someday = new Date(date);

        if (
          (attractionId === undefined) |
          (date === undefined) |
          (time === undefined) |
          (price === undefined) |
          (someday <= new Date())
        ) {
          return res.status(400).send({
            error: true,
            message: "建立失敗，輸入不正確(例：無法選今天及過去日期)或其他原因",
          });
        }

        const newBooking = new Booking({
          memberId: user._id,
          attractionId,
          date,
          time,
          price,
        });
        const savedBooking = await newBooking.save();
        return res.status(200).send({ ok: true });
      }
      return res.status(403).send({
        error: true,
        message: "未登入系統，拒絕存取",
      });
    })(req, res);
  } catch (e) {
    return res.status(500).send({
      error: true,
      message: e,
    });
  }
});

router.get("/", async (req, res) => {
  try {
    passport.authenticate("jwt", { session: false }, async (err, user) => {
      if (user) {
        const bookings = await Booking.find({ memberId: user._id }).exec();
        const attractions = await Attraction.find().exec();
        const result = {};
        result["data"] = [];

        bookings.forEach((booking) => {
          const item = {};
          item["date"] = booking["date"];
          item["time"] = booking["time"];
          item["price"] = booking["price"];
          item["bookingId"] = booking["_id"];

          attractions.forEach((attraction) => {
            if (booking["attractionId"] === attraction["id"]) {
              item["attraction"] = {};
              item["attraction"]["id"] = attraction["id"];
              item["attraction"]["name"] = attraction["name"];
              item["attraction"]["address"] = attraction["address"];
              item["attraction"]["image"] = attraction["images"][0];
              result["data"].push(item);
            }
          });
        });

        if (result["data"].length === 0) {
          result["data"] = null;
        }

        return res.status(200).send(result);
      }
      return res.status(403).send({
        error: true,
        message: "未登入系統，拒絕存取",
      });
    })(req, res);
  } catch (e) {
    return res.status(500).send({
      error: true,
      message: e,
    });
  }
});

router.delete("/", async (req, res) => {
  try {
    passport.authenticate("jwt", { session: false }, async (err, user) => {
      if (user) {
        const { bookingId } = req.body;
        await Booking.findOneAndDelete({ _id: bookingId, memberId: user._id });
        return res.status(200).send({ ok: true });
      }
      return res.status(403).send({
        error: true,
        message: "未登入系統，拒絕存取",
      });
    })(req, res);
  } catch (e) {
    return res.status(500).send({
      error: true,
      message: e,
    });
  }
});

module.exports = router;
