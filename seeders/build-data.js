require("dotenv").config({ path: "../.env" });
const fs = require("fs");
const Attraction = require("../models/attraction");
const mongoose = require("mongoose");
const url = process.env.MONGODB;

mongoose
  .connect(url)
  .then(() => {
    console.log("成功連結Mongodb");
  })
  .catch((e) => {
    console.log(e);
  });

fs.readFile("./taipei-attractions.json", "utf8", function (error, data) {
  if (error) {
    console.log("讀取檔案失敗");
    return;
  }

  const objects = JSON.parse(data)["result"]["results"];

  objects.forEach(async (object) => {
    const images = [];
    const items = object["file"].split("https://");
    items.forEach((item) => {
      if (
        item.toLowerCase().includes("jpg") ||
        item.toLowerCase().includes("png")
      ) {
        images.push("https://" + item);
      }
    });

    let newObject = new Attraction({
      id: object["_id"],
      name: object["name"],
      category: object["CAT"],
      description: object["description"],
      address: object["address"],
      transport: object["direction"],
      mrt: object["MRT"],
      lat: object["latitude"],
      lng: object["longitude"],
      images: images,
    });
    await newObject.save();
  });
});
