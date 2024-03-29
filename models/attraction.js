const mongoose = require("mongoose");
const { Schema } = mongoose;

const attractionSchema = new Schema({
  id: Number,
  name: String,
  category: String,
  description: String,
  address: String,
  transport: String,
  mrt: String,
  lat: Number,
  lng: Number,
  images: [String],
  // bookings: [
  //   {
  //     type: Schema.Types.ObjectId,
  //     ref: "Booking",
  //   },
  // ],
});

const Attraction = mongoose.model("Attraction", attractionSchema);

module.exports = Attraction;
