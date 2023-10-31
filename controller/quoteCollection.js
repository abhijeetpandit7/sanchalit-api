const _ = require("lodash");
const moment = require("moment/moment");
const mongoose = require("mongoose");
const { Quote } = require("../models/quote");
const { QuoteCollection } = require("../models/quoteCollection");
const { catchError } = require("../utils");

const getScheduledQuotes = async (req, res, next, sendResponse = true) =>
  catchError(next, async () => {
    const { userId } = req;
    let quoteCollection = await QuoteCollection.findById(userId);

    if (!quoteCollection) {
      quoteCollection = new QuoteCollection({
        _id: userId,
        scheduledList: [],
      });
    }

    const today = moment().startOf("day");
    const tomorrow = today.clone().add(1, "day");

    quoteCollection.scheduledList = quoteCollection.scheduledList.filter(
      (scheduledQuote) =>
        moment(scheduledQuote.forDate).isSameOrAfter(today, "day")
    );

    const hasTodaysQuote = quoteCollection.scheduledList.some(({ forDate }) =>
      moment(forDate).isSame(today, "day")
    );
    const hasTomorrowsQuote = quoteCollection.scheduledList.some(
      ({ forDate }) => moment(forDate).isSame(tomorrow, "day")
    );
    const requiredQuotes = [hasTodaysQuote, hasTomorrowsQuote].filter(
      (i) => i === false
    ).length;

    if (requiredQuotes > 0) {
      const historyListQuoteIds = quoteCollection.historyList.map(
        (historyItem) => historyItem._id
      );

      const matchCriteria = {
        $or: [
          { isCustom: true, userId: mongoose.Types.ObjectId(userId) },
          { isCustom: { $exists: false }, userId: { $exists: false } },
        ],
      };
      const sampleSize = { $sample: { size: requiredQuotes } };

      let quotes = await Quote.aggregate([
        {
          $match: {
            $and: [{ _id: { $nin: historyListQuoteIds } }, matchCriteria],
          },
        },
        sampleSize,
      ]);
      if (quotes.length < requiredQuotes) {
        quotes = await Quote.aggregate([{ $match: matchCriteria }, sampleSize]);
      }

      const updateHistoryAndScheduledList = (
        quoteCollection,
        quote,
        momentDate
      ) => {
        quoteCollection.scheduledList.push({
          _id: quote._id,
          forDate: momentDate.toDate(),
        });

        const matchedQuoteInHistoryList = quoteCollection.historyList.find(
          (item) => item._id === quote._id
        );
        if (matchedQuoteInHistoryList) {
          matchedQuoteInHistoryList.timestampList.push(momentDate.toDate());
        } else {
          quoteCollection.historyList.push({
            _id: quote._id,
            timestampList: [momentDate.toDate()],
          });
        }
      };

      if (quotes.length === 1) {
        updateHistoryAndScheduledList(
          quoteCollection,
          quotes[0],
          hasTodaysQuote ? tomorrow : today
        );
      } else if (quotes.length === 2) {
        updateHistoryAndScheduledList(quoteCollection, quotes[0], today);
        updateHistoryAndScheduledList(quoteCollection, quotes[1], tomorrow);
      }

      await quoteCollection.save();
    }

    const populatedQuoteCollection = await QuoteCollection.findById(userId)
      .populate("scheduledList._id")
      .select("scheduledList")
      .exec();

    const scheduledQuotes = populatedQuoteCollection.scheduledList.map(
      (item) => ({
        id: item._id._id,
        body: item._id.body,
        source: item._id.source,
        forDate: item.forDate,
      })
    );

    if (sendResponse) {
      return res.status(200).json({ success: true, quotes: scheduledQuotes });
    } else {
      return scheduledQuotes;
    }
  });

module.exports = {
  getScheduledQuotes,
};
