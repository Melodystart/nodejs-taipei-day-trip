const mongoose = require("mongoose");
const { Schema } = mongoose;

const orderSchema = new Schema({
  orderId: { type: String, required: true },
  memberId: { type: String, required: true },
  paymentStatus: { type: String, default: "未付款" },
  amount: { type: Number, required: true },
  contactName: { type: String, required: true },
  contactEmail: { type: String, required: true },
  contactPhone: { type: String, required: true },
  statusCode: { type: Number },
  msg: { type: String },
  rec_trade_id: { type: String },
  bookingIdList: { type: [String], required: true },
  transactionDate: { type: String, required: true },
  firstImage: { type: String },
});

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;