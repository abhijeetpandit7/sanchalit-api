const mongoose = require("mongoose");

const quoteSchema = mongoose.Schema(
  {
    body: {
      type: String,
      trim: true,
      maxLen: 350,
      required: "Body is required",
    },
    source: {
      type: String,
    },
    isCustom: {
      type: Boolean,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

const Quote = mongoose.model("Quote", quoteSchema);

module.exports = { Quote };
