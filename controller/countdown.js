const _ = require("lodash");
const { Countdown } = require("../models/countdown");
const {
  addOrMergeArrayElements,
  catchError,
  renameObjectKey,
} = require("../utils");

const addCountdown = async (req, res, next, sendResponse = true) => {
  catchError(next, async () => {
    const { userId } = req;
    if (req.body.data?.countdowns) data = req.body.data.countdowns;
    else data = req.body.data;
    const itemListData = _.isArray(data)
      ? data.map((item) => renameObjectKey(item, "id", "_id"))
      : [renameObjectKey(data, "id", "_id")];

    let countdown = await Countdown.findById(userId);

    if (!countdown) {
      const newUserCountdown = new Countdown({
        _id: userId,
        itemList: [...itemListData],
      });
      await newUserCountdown.save();

      if (sendResponse) {
        return res.status(201).json({ success: true });
      } else {
        return newUserCountdown;
      }
    }

    countdown = _.extend(countdown, {
      itemList: addOrMergeArrayElements(
        countdown.itemList,
        itemListData,
        "_id"
      ),
    });
    await countdown.save();

    if (sendResponse) {
      return res.json({ success: true });
    } else {
      return countdown;
    }
  });
};

module.exports = {
  addCountdown,
};
