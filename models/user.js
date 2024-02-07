const mongoose = require("mongoose");
const { Schema } = mongoose;

const userSchema = new Schema({
  name: { type: String, required: true },
  password: { type: String, required: true },
  email: { type: String, required: true },
  time: { type: Date, default: Date.now },
  filename: String,
});

const User = mongoose.model("User", userSchema);

module.exports = User;
