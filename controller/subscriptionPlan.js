const _ = require("lodash");
const { SubscriptionPlan } = require("../models/subscriptionPlan");
const { catchError, omitDocumentProperties } = require("../utils");

const getSubscriptionPlans = async (req, res, next) => {
  catchError(next, async () => {
    const subscriptionPlans = await SubscriptionPlan.find({
      isActive: true,
      latest: true,
    });
    if (subscriptionPlans.length) {
      let monthlyPlan = _.find(subscriptionPlans, { interval: "month" });
      let yearlyPlan = _.find(subscriptionPlans, { interval: "year" });
      if (monthlyPlan) monthlyPlan = omitDocumentProperties(monthlyPlan);
      if (yearlyPlan) yearlyPlan = omitDocumentProperties(yearlyPlan);

      return res.json({
        success: true,
        plans: {
          monthly: monthlyPlan,
          yearly: yearlyPlan,
        },
      });
    }
    return res.status(404).json({
      success: false,
      message: "Subscription plan not found",
    });
  });
};

module.exports = {
  getSubscriptionPlans,
};
