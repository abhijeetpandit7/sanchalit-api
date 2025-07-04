const _ = require("lodash");
const { Customization } = require("../models/customization");
const {
  addOrMergeObjectProperties,
  filterObjectBySchema,
} = require("../utils");

const updateCustomization = async (req) => {
  const { userId } = req;
  const { data } = req.body;
  const customizationData = filterObjectBySchema(
    data ?? req.body,
    Customization.schema.obj
  );
  if (_.isEmpty(customizationData)) {
    return { success: true };
  }

  let customization = await Customization.findById(userId);

  if (!customization) {
    const newCustomization = new Customization({
      _id: userId,
      ...customizationData,
    });
    await newCustomization.save();

    return { success: true };
  }

  customization = _.extend(
    customization,
    addOrMergeObjectProperties(customization, customizationData)
  );
  await customization.save();

  return { success: true };
};

module.exports = {
  updateCustomization,
};
