const mongoose = require("mongoose");

const backgroundRefSchema = {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Background",
};

const backgroundCollectionSchema = mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  favouriteList: [backgroundRefSchema],
  frequency: {
    type: String,
    enum: ["tab", "hour", "day", "pause"],
    default: "day",
  },
  queue: [backgroundRefSchema],
  updatedDate: { type: Date },
});

const BackgroundCollection = mongoose.model(
  "BackgroundCollection",
  backgroundCollectionSchema
);

module.exports = { BackgroundCollection };
