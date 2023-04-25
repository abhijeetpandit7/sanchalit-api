const mongoose = require("mongoose");

const countdownSchema = mongoose.Schema({
  _id: {
    type: String,
    required: true,
  },
  archived: { type: Boolean },
  createdDate: { type: Date },
  dueDate: { type: Date, required: true },
  hasHours: { type: Boolean },
  name: { type: String, trim: true, required: true },
  pinned: { type: Boolean },
  updatedDate: { type: Date },
});

const userCountdownSchema = mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  itemList: [countdownSchema],
});

const Countdown = mongoose.model("Countdown", userCountdownSchema);

module.exports = { Countdown };
