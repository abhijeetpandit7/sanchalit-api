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

const mergeCountdown = async (next, sourceUserId, destinationUserId) => {
  catchError(next, async () => {
    let countdownOfSourceUser = await Countdown.findById(sourceUserId);
    if (!countdownOfSourceUser) {
      return {
        success: true,
        message: "No document to merge",
      };
    } else if (countdownOfSourceUser.itemList.length === 0) {
      await Countdown.findByIdAndDelete(sourceUserId);
      return {
        success: true,
        message: "No itemList to merge",
      };
    }

    let countdownOfDestinationUser = await Countdown.findById(
      destinationUserId
    );
    if (!countdownOfDestinationUser) {
      newUserCountdown = new Countdown({
        _id: destinationUserId,
        itemList: [...countdownOfSourceUser.itemList],
      });
      await newUserCountdown.save();
      await Countdown.findByIdAndDelete(sourceUserId);

      return {
        success: true,
      };
    }

    countdownOfDestinationUser = _.extend(countdownOfDestinationUser, {
      itemList: addOrMergeArrayElements(
        countdownOfDestinationUser.itemList,
        countdownOfSourceUser.itemList,
        "_id"
      ),
    });
    await countdownOfDestinationUser.save();
    await Countdown.findByIdAndDelete(sourceUserId);

    return {
      success: true,
    };
  });
};

module.exports = {
  addCountdown,
  mergeCountdown,
};
