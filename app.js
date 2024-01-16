require("dotenv").config();
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const methodOverride = require("method-override");
const attractionRoutes = require("./routes/attractions");
const mrtRoutes = require("./routes/mrts");
const url = process.env.MONGODB;

mongoose
  .connect(url)
  .then(() => {
    console.log("成功連結Mongodb");
  })
  .catch((e) => {
    console.log(e);
  });

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));

app.use("/api/attractions", attractionRoutes);
app.use("/api/mrts", mrtRoutes);

app.use((err, req, res, next) => {
  return res.status(500).send(err);
});

app.listen(3000, () => {
  console.log(`App listening on port 3000!`);
});
