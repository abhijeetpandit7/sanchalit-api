const mongoose = require("mongoose");

const backgroundSchema = mongoose.Schema(
  {
    title: { type: String },
    source: { type: String },
    sourceUrl: { type: String },
    widgetColor: {
      hsla: { type: String },
      bodyTextColor: { type: String },
      name: { type: String },
    },
    filename: { type: String },
  },
  { timestamps: true }
);

const Background = mongoose.model("Background", backgroundSchema);

module.exports = { Background };
