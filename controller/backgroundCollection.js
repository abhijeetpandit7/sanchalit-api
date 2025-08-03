const _ = require("lodash");
const moment = require("moment/moment");

const { BackgroundCollection } = require("../models/backgroundCollection");
const { Background } = require("../models/background");

const getScheduledBackgrounds = async (req, frequency) => {
  const { userId, localDate } = req;
  let backgroundCollection = await BackgroundCollection.findById(userId);

  let requiredPhotos = 0;
  const now = moment(localDate).utc();

  if (!backgroundCollection || backgroundCollection.queue.length < 2) {
    backgroundCollection = new BackgroundCollection({ _id: userId, queue: [] });
    requiredPhotos = 2;
  } else if (frequency === "tab") {
    requiredPhotos = 1;
  } else if (frequency === "hour") {
    const hourAgo = now.clone().subtract(1, "hour");
    if (moment(backgroundCollection.updatedDate).isBefore(hourAgo)) requiredPhotos = 1;
  } else if (frequency === "day") {
    const startOfToday = now.clone().startOf("day");
    if (moment(backgroundCollection.updatedDate).isBefore(startOfToday)) requiredPhotos = 1;
  }

  if (requiredPhotos) {
    backgroundCollection.queue.shift();

    const backgrounds = await Background.aggregate([
      { $sample: { size: requiredPhotos } }
    ]);
    backgrounds.forEach((background) => {
      backgroundCollection.queue.push({
        _id: background._id,
      });
    });
    backgroundCollection.updatedDate = now.toDate();

    await backgroundCollection.save();
  }

  const populatedBackgroundCollection = await BackgroundCollection.findById(userId)
    .populate("queue._id")
    .select("queue")
    .exec();

  const scheduledBackgrounds = populatedBackgroundCollection.queue.map(item => ({
    id: item._id._id,
    title: item._id.title,
    source: item._id.source,
    sourceUrl: item._id.sourceUrl,
    widgetColor: item._id.widgetColor,
    filename: item._id.filename
  }));
  return scheduledBackgrounds;
};


module.exports = {
  getScheduledBackgrounds,
};
