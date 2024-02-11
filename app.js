require("dotenv").config();
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const methodOverride = require("method-override");
const attractionRoutes = require("./routes/attractions");
const mrtRoutes = require("./routes/mrts");
const userRoutes = require("./routes/user");
const bookingRoutes = require("./routes/booking");
const orderRoutes = require("./routes/order");
const url = process.env.MONGODB;
const passport = require("passport");
require("./config/passport")(passport);

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
app.use(express.static(__dirname + "/public"));

app.use("/api/attractions", attractionRoutes);
app.use("/api/mrts", mrtRoutes);
app.use("/api/user", userRoutes);
app.use("/api/booking", bookingRoutes);
app.use("/api/orders", orderRoutes);

app.get("/", async (req, res, next) => {
  try {
    return res.render("index");
  } catch {
    next();
  }
});

app.get("/attraction/:id", async (req, res, next) => {
  try {
    return res.render("attraction");
  } catch {
    next();
  }
});

app.get("/profile", async (req, res, next) => {
  try {
    return res.render("profile");
  } catch {
    next();
  }
});

app.get("/booking", async (req, res, next) => {
  try {
    return res.render("booking");
  } catch {
    next();
  }
});

app.get("/thankyou", async (req, res, next) => {
  try {
    return res.render("thankyou");
  } catch {
    next();
  }
});

app.get("/orderlist", async (req, res, next) => {
  try {
    return res.render("orderlist");
  } catch {
    next();
  }
});

app.get("/order", async (req, res, next) => {
  try {
    return res.render("order");
  } catch {
    next();
  }
});

app.use((err, req, res, next) => {
  return res.status(500).send(err);
});

app.listen(5000, () => {
  console.log(`App listening on port 5000!`);
});
