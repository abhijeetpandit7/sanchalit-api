const mongoose = require("mongoose");

const quoteRefSchema = {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Quote",
};

const quoteHistorySchema = mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Quote",
  },
  timestampList: [{ type: Date }],
});

const scheduledQuoteSchema = mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Quote",
  },
  forDate: { type: Date },
});

const quoteCollectionSchema = mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  customList: [quoteRefSchema],
  favouriteList: [quoteRefSchema],
  historyList: [quoteHistorySchema],
  scheduledList: [scheduledQuoteSchema],
});

const QuoteCollection = mongoose.model("QuoteCollection", quoteCollectionSchema);

module.exports = { QuoteCollection };
