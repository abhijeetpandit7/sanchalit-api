const _ = require("lodash");
const { Countdown } = require("../models/countdown");
const {
  addOrMergeArrayElements,
  catchError,
  renameObjectKey,
} = require("../utils");

const deleteCountdown = async (req, res, next) => {
  catchError(next, async () => {
    const { userId } = req;
    const { id } = req.params;
    let ids = [];

    if (req.body?.countdowns) {
      ids = req.body.countdowns.map((countdown) => countdown.id);
    }

    let countdown = await Countdown.findById(userId);
    countdown = _.extend(countdown, {
      itemList: countdown.itemList.filter((item) =>
        id
          ? item._id.toString() !== id
          : ids.includes(item._id.toString()) === false
      ),
    });
    await countdown.save();

    return res.json({ success: true });
  });
};

const mergeCountdown = async (sourceUserId, destinationUserId) => {
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

  let countdownOfDestinationUser = await Countdown.findById(destinationUserId);
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
};

const updateCountdown = async (req) => {
  const { userId } = req;
  if (req.body.data?.countdowns) data = req.body.data.countdowns;
  else data = req.body.data.countdown;
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

    return { success: true };
  }

  countdown = _.extend(countdown, {
    itemList: addOrMergeArrayElements(countdown.itemList, itemListData, "_id"),
  });
  await countdown.save();

  return { success: true };
};

module.exports = {
  deleteCountdown,
  mergeCountdown,
  updateCountdown,
};
