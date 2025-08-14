const _ = require("lodash");
const moment = require("moment/moment");

const { BackgroundCollection } = require("../models/backgroundCollection");
const { Background } = require("../models/background");

const DESIRED_QUEUE_LENGTH = 2;

const getScheduledBackgrounds = async (userId, localDate) => {
  let backgroundCollection = await BackgroundCollection.findById(userId);

  let shouldRotate = false;
  const now = moment(localDate).utc();

  if (!backgroundCollection) {
    backgroundCollection = new BackgroundCollection({ _id: userId, queue: [] });
  } else if (backgroundCollection.frequency === "tab") {
    shouldRotate = true;
  } else if (backgroundCollection.frequency === "hour") {
    const hourAgo = now.clone().subtract(1, "hour");
    if (moment(backgroundCollection.updatedDate).isBefore(hourAgo))
      shouldRotate = true;
  } else if (backgroundCollection.frequency === "day") {
    const startOfToday = now.clone().startOf("day");
    if (moment(backgroundCollection.updatedDate).isBefore(startOfToday))
      shouldRotate = true;
  }

  if (shouldRotate) {
    backgroundCollection.queue.shift();
  }
  const requiredPhotos = Math.max(
    0,
    DESIRED_QUEUE_LENGTH - backgroundCollection.queue.length
  );
  if (requiredPhotos) {
    const backgrounds = await Background.aggregate([
      { $sample: { size: requiredPhotos } },
    ]);
    backgrounds.forEach((background) => {
      backgroundCollection.queue.push({
        _id: background._id,
      });
    });
    backgroundCollection.updatedDate = now.toDate();
    await backgroundCollection.save();
  }

  await backgroundCollection.populate("queue._id");
  const queue = backgroundCollection.queue.map(
    ({ _id: { title, source, sourceUrl, widgetColor, filename } }) => ({
      title,
      source,
      sourceUrl,
      widgetColor,
      filename,
    })
  );

  return {
    queue,
    frequency: backgroundCollection.frequency,
    updatedDate: backgroundCollection.updatedDate,
  };
};

module.exports = {
  getScheduledBackgrounds,
};
