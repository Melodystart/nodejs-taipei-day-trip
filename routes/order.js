const express = require("express");
const router = express.Router();
const Booking = require("../models/booking");
const Order = require("../models/order");
const Attraction = require("../models/attraction");
const passport = require("passport");
require("../config/passport")(passport);
const moment = require("moment-timezone");
const fetch = require("node-fetch");

router.post("/", async (req, res) => {
  try {
    passport.authenticate("jwt", { session: false }, async (err, user) => {
      if (user) {
        const { prime, order } = req.body;
        const memberId = user._id;
        const amount = order["amount"];
        const contactName = order["contact"]["name"];
        const contactEmail = order["contact"]["email"];
        const contactPhone = order["contact"]["phone"];
        const bookingIdList = order["bookingIdList"];
        const firstImage = order["details"][0]["trip"]["attraction"]["image"];
        const now = moment(new Date());
        const transactionDate = now
          .clone()
          .tz("Asia/Taipei")
          .format("YYYY/MM/DD HH:mm");
        const orderId =
          now.clone().tz("Asia/Taipei").format("YYYYMMDDHHmmss") + memberId;

        if (
          (memberId === undefined) |
          (prime === undefined) |
          (amount === undefined) |
          (contactName === undefined) |
          (contactEmail === undefined) |
          (contactPhone === undefined) |
          (bookingIdList === undefined) |
          (orderId === undefined) |
          (contactPhone.length !== 10)
        ) {
          return res.status(400).send({
            error: true,
            message: "訂單建立失敗，輸入不正確/不完整或其他原因",
          });
        }

        const orders = await Order.find({
          memberId: user._id,
          paymentStatus: "已付款",
        }).exec();

        bookingIdList.forEach((bookingId) => {
          if (orders.includes(bookingId)) {
            return res.status(400).send({
              error: true,
              message:
                "訂單建立失敗，此訂單含已付過款行程，請重新整理預定行程頁面",
            });
          }
        });

        const newOrder = new Order({
          orderId,
          memberId,
          amount,
          contactName,
          contactEmail,
          contactPhone,
          bookingIdList,
          transactionDate,
          firstImage,
        });
        const savedOrder = await newOrder.save();

        bookingIdList.forEach((bookingId) => {
          Booking.findOneAndUpdate(
            { _id: bookingId, memberId },
            { orderId }
          ).exec();
        });

        const partner_key = process.env.partner_key;
        const merchant_id = "start99start_CTBC";
        const url = "https://sandbox.tappaysdk.com/tpc/payment/pay-by-prime";
        const headers = {
          "Content-Type": "application/json",
          "x-api-key": partner_key,
        };
        const payment_details = {
          prime: prime,
          partner_key: partner_key,
          merchant_id: merchant_id,
          details: "台北一日遊",
          amount: amount,
          order_number: orderId,
          cardholder: {
            phone_number: contactPhone,
            name: contactName,
            email: contactEmail,
            zip_code: "100",
            address: "台北市天龍區芝麻街1號1樓",
            national_id: "A123456789",
          },
          remember: false,
        };

        const postMethod = {
          method: "POST",
          headers: headers,
          body: JSON.stringify(payment_details),
        };

        const result = {};

        fetch(url, postMethod)
          .then((response) => response.json())
          .then((r) => {
            result["data"] = {};
            result["data"]["number"] = orderId;
            result["data"]["payment"] = {};
            result["data"]["payment"]["status"] = r["status"];

            const rec_status = r["status"];
            const rec_msg = r["msg"];
            const rec_trade_id = r["rec_trade_id"];

            if (parseInt(rec_status) === 0) {
              if (r["order_number"] !== orderId) {
                Order.findOneAndUpdate(
                  { orderId, memberId },
                  {
                    paymentStatus: "付款異常",
                    statusCode: rec_status,
                    msg: rec_msg,
                    rec_trade_id: rec_trade_id,
                    orderId,
                    memberId,
                  }
                ).exec();
                return res.status(500).send({
                  error: true,
                  message: "付款訂單號碼與回傳訂單號碼不符，請聯絡專人處理",
                });
              } else {
                Order.findOneAndUpdate(
                  { orderId, memberId },
                  {
                    paymentStatus: "已付款",
                    statusCode: rec_status,
                    msg: rec_msg,
                    rec_trade_id: rec_trade_id,
                    orderId,
                    memberId,
                  }
                ).exec();

                bookingIdList.forEach((bookingId) => {
                  Booking.findOneAndUpdate(
                    { _id: bookingId, memberId },
                    { paymentStatus: "已付款" }
                  ).exec();
                });

                result["data"]["payment"]["message"] = "付款成功";
                return res.status(200).send(result);
              }
            } else {
              Order.findOneAndUpdate(
                { orderId, memberId },
                {
                  statusCode: rec_status,
                  msg: rec_msg,
                  rec_trade_id: rec_trade_id,
                }
              ).exec();

              result["data"]["payment"]["message"] = "付款失敗：" + r["msg"];
              return res.status(200).send(result);
            }
          });
      } else {
        return res.status(403).send({
          error: true,
          message: "未登入系統，拒絕存取",
        });
      }
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
        const orders = await Order.find({
          memberId: user._id,
        }).exec();

        const result = {};
        result["data"] = [];

        orders.forEach((order) => {
          const item = {};
          item["orderId"] = order["orderId"];
          item["transactionDate"] = order["transactionDate"];
          item["paymentStatus"] = order["paymentStatus"];
          item["amount"] = order["amount"];
          item["msg"] = order["msg"];
          item["firstImage"] = order["firstImage"];
          result["data"].push(item);
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

router.get("/:id", async (req, res) => {
  try {
    passport.authenticate("jwt", { session: false }, async (err, user) => {
      if (user) {
        const { id } = req.params;

        const order = await Order.findOne({
          memberId: user._id,
          orderId: id,
        }).exec();
        const result = {};
        result["data"] = {};
        result["data"]["number"] = id;
        result["data"]["amount"] = order["amount"];
        result["data"]["contact"] = {};
        result["data"]["contact"]["name"] = order["contactName"];
        result["data"]["contact"]["email"] = order["contactEmail"];
        result["data"]["contact"]["phone"] = order["contactPhone"];
        result["data"]["status"] = order["statusCode"];
        result["data"]["msg"] = order["msg"];
        result["data"]["details"] = [];
        const bookingIdList = order["bookingIdList"];

        const bookings = await Booking.find({
          memberId: user._id,
        }).exec();

        const attractions = await Attraction.find().exec();

        bookingIdList.forEach((bookingId) => {
          bookings.forEach((booking) => {
            if (booking["_id"].valueOf() === bookingId) {
              const item = {};
              item["price"] = booking["price"];
              item["trip"] = {};
              item["trip"]["date"] = moment(booking["date"]).format(
                "YYYY-MM-DD"
              );
              item["trip"]["time"] = booking["time"];
              item["trip"]["attraction"] = {};
              item["trip"]["attraction"]["id"] = booking["attractionId"];
              attractions.forEach((attraction) => {
                if (attraction["id"] === booking["attractionId"]) {
                  item["trip"]["attraction"]["name"] = attraction["name"];
                  item["trip"]["attraction"]["address"] = attraction["address"];
                  item["trip"]["attraction"]["image"] = attraction["images"][0];
                  result["data"]["details"].push(item);
                }
              });
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

module.exports = router;
