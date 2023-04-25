const _ = require("lodash");
const { Customization } = require("../models/customization");
const { catchError, filterObjectBySchema } = require("../utils");

const updateCustomization = async (req, res, next, sendResponse = true) => {
  catchError(next, async () => {
    const { userId } = req;
    const { data } = req.body;
    const customizationData = filterObjectBySchema(
      data,
      Customization.schema.obj
    );
    if (_.isEmpty(customizationData)) {
      if (sendResponse) {
        return res.json({ success: true });
      } else {
        return;
      }
    }

    let customization = await Customization.findById(userId);

    if (!customization) {
      const newCustomization = new Customization({
        _id: userId,
        ...customizationData,
      });
      await newCustomization.save();

      if (sendResponse) {
        return res.status(201).json({ success: true });
      } else {
        return newCustomization;
      }
    }

    customization = _.extend(customization, customizationData);
    await customization.save();

    if (sendResponse) {
      return res.json({ success: true });
    } else {
      return customization;
    }
  });
};

module.exports = {
  updateCustomization,
};
