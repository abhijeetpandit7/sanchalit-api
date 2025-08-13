const mongoose = require("mongoose");

const queueItemSchema = mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Background",
  },
});

const backgroundCollectionSchema = mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  frequency: {
    type: String,
    enum: ["tab", "hour", "day", "pause"],
    default: "day",
  },
  queue: [queueItemSchema],
  updatedDate: { type: Date },
});

const BackgroundCollection = mongoose.model(
  "BackgroundCollection",
  backgroundCollectionSchema
);

module.exports = { BackgroundCollection };
