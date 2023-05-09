const _ = require("lodash");
const { Customization } = require("../models/customization");
const {
  addOrMergeObjectProperties,
  catchError,
  filterObjectBySchema,
} = require("../utils");

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

    if (!customization && sendResponse) {
      return res.status(404).json({
        success: false,
        message: "Customization not found",
      });
    } else if (!customization && !sendResponse) {
      const newCustomization = new Customization({
        _id: userId,
        ...customizationData,
      });
      await newCustomization.save();

      return newCustomization;
    }

    customization = _.extend(
      customization,
      addOrMergeObjectProperties(customization, customizationData)
    );

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
