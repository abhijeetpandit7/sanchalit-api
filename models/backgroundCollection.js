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
  queue: [queueItemSchema],
  updatedDate: { type: Date },
});

const BackgroundCollection = mongoose.model("BackgroundCollection", backgroundCollectionSchema);

module.exports = { BackgroundCollection };
