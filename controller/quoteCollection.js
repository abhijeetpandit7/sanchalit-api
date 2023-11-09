const _ = require("lodash");
const moment = require("moment/moment");
const mongoose = require("mongoose");
const { Quote } = require("../models/quote");
const { QuoteCollection } = require("../models/quoteCollection");
const { catchError } = require("../utils");

const getScheduledQuotes = async (req, res, next, sendResponse = true) =>
  catchError(next, async () => {
    const { userId, localDate } = req;
    const skipQuote = req.body.data?.quoteCollection?.skipQuote;
    let quoteCollection = await QuoteCollection.findById(userId);

    if (!quoteCollection) {
      quoteCollection = new QuoteCollection({
        _id: userId,
        scheduledList: [],
      });
    }

    const today = moment(localDate).utc().startOf("day");
    const tomorrow = today.clone().add(1, "day");

    quoteCollection.scheduledList = quoteCollection.scheduledList.filter(
      (scheduledQuote) =>
        moment(scheduledQuote.forDate).isSameOrAfter(today, "day")
    );

    let hasTodaysQuote = quoteCollection.scheduledList.some(({ forDate }) =>
      moment(forDate).isSame(today, "day")
    );
    const hasTomorrowsQuote = quoteCollection.scheduledList.some(
      ({ forDate }) => moment(forDate).isSame(tomorrow, "day")
    );
    let requiredQuotes = [hasTodaysQuote, hasTomorrowsQuote].filter(
      (i) => i === false
    ).length;
    if (skipQuote && hasTodaysQuote) {
      quoteCollection.scheduledList = quoteCollection.scheduledList.filter(
        (scheduledQuote) =>
          moment(scheduledQuote.forDate).isSame(today, "day") === false
      );
      requiredQuotes += 1;
      hasTodaysQuote = false;
    }
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
        isFavourite: quoteCollection.favouriteList.includes(item._id._id),
        forDate: item.forDate.toISOString().split("T")[0],
      })
    );

    if (sendResponse) {
      return res
        .status(requiredQuotes ? 201 : 200)
        .json({ success: true, quotes: scheduledQuotes });
    } else {
      return scheduledQuotes;
    }
  });

const updateQuote = async (req, res, next, sendResponse = true) =>
  catchError(next, async () => {
    const { userId } = req;
    const favouriteQuotes = req.body.data.quoteCollection.favourites;

    let quoteCollection = await QuoteCollection.findById(userId);

    if (quoteCollection) {
      const trueIds = favouriteQuotes
        .filter((quote) => quote.isFavourite)
        .map((quote) => quote.id)
        .filter((id) => quoteCollection.favouriteList.includes(id) === false);
      const falseIds = favouriteQuotes
        .filter((quote) => quote.isFavourite === false)
        .map((quote) => quote.id)
        .filter((id) => quoteCollection.favouriteList.includes(id));

      if ([...trueIds, ...falseIds].length === 0) {
        if (sendResponse) {
          return res.json({
            success: true,
            message: "No quote to update",
          });
        } else return;
      }

      quoteCollection.favouriteList = [
        ...quoteCollection.favouriteList,
        ...trueIds,
      ].filter((id) => falseIds.includes(id.toString()) === false);

      await quoteCollection.save();
      if (sendResponse) return res.status(201).json({ success: true });
      else return;
    }
    if (sendResponse) {
      return res.status(404).json({
        success: false,
        message: "QuoteCollection not found",
      });
    }
  });

module.exports = {
  getScheduledQuotes,
  updateQuote,
};
