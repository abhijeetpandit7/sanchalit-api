const moment = require("moment/moment");
const _ = require("lodash");

const { BackgroundCollection } = require("../models/backgroundCollection");
const { Background } = require("../models/background");
const { catchError, filterObjectBySchema } = require("../utils");

const DESIRED_QUEUE_LENGTH = 2;

const getFavouriteBackgrounds = async (req, res, next) => {
  catchError(next, async () => {
    const { userId } = req;
    let backgroundCollection = await BackgroundCollection.findById(
      userId
    ).populate("favouriteList");

    if (backgroundCollection) {
      return res.json({
        success: true,
        favouriteList: backgroundCollection.favouriteList.map(
          ({ _id, title, filename }) => ({
            id: _id,
            title,
            filename,
          })
        ),
      });
    }
    return res.status(404).json({
      success: false,
      message: "BackgroundCollection not found",
    });
  });
};

const getScheduledBackgrounds = async (
  userId,
  localDate,
  skipBackground = false
) => {
  let backgroundCollection = await BackgroundCollection.findById(userId);

  let shouldRotate = false;
  const now = moment(localDate).utc();

  if (!backgroundCollection) {
    backgroundCollection = new BackgroundCollection({ _id: userId, queue: [] });
  } else if (skipBackground || backgroundCollection.frequency === "tab") {
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
      backgroundCollection.queue.push(background._id);
    });
    backgroundCollection.updatedDate = now.toDate();
    await backgroundCollection.save();
  }

  await backgroundCollection.populate("queue");
  const backgrounds = backgroundCollection.queue.map(
    ({ _id, title, source, sourceUrl, widgetColor, filename }) => ({
      id: _id,
      title,
      source,
      sourceUrl,
      widgetColor,
      filename,
      isFavourite: backgroundCollection.favouriteList.includes(_id),
    })
  );

  return {
    backgrounds,
    backgroundsSettings: _.pick(backgroundCollection, [
      "frequency",
      "updatedDate",
    ]),
  };
};

const updateBackgroundsSettings = async (userId, data) => {
  const collectionData = filterObjectBySchema(
    data,
    BackgroundCollection.schema.obj
  );
  if (_.isEmpty(collectionData)) {
    return { success: true };
  }

  const backgroundCollection = await BackgroundCollection.findById(userId);
  if (backgroundCollection) {
    _.extend(backgroundCollection, collectionData);
    await backgroundCollection.save();
    return { success: true };
  }
  return {
    success: false,
    message: "BackgroundCollection not found",
  };
};

module.exports = {
  getFavouriteBackgrounds,
  getScheduledBackgrounds,
  updateBackgroundsSettings,
};
