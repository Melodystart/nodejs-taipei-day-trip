const mongoose = require("mongoose");
const { Schema } = mongoose;

const bookingSchema = new Schema({
  memberId: { type: String, required: true },
  attractionId: { type: Number, required: true },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  price: { type: Number, required: true },
  orderId: { type: String },
  paymentStatus: { type: String, default: "未付款" },
  // attraction: {
  //   type: Schema.Types.ObjectId,
  //   ref: "Attraction",
  // },
});

const Booking = mongoose.model("Booking", bookingSchema);

module.exports = Booking;
