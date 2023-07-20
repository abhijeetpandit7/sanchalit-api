const _ = require("lodash");
const { Subscription } = require("../models/subscription");
const { catchError } = require("../utils");

const updateSubscription = async (req, res, next) => {
  catchError(next, async () => {
    switch (req.body.meta.event_name) {
      case "subscription_created": {
        break;
      }
      case "subscription_resumed": {
        break;
      }
      case "subscription_cancelled": {
        break;
      }
      case "subscription_expired": {
        break;
      }
      case "subscription_payment_success": {
        break;
      }
      default:
        break;
    }

    return res.status(200).json({ success: true });
  });
};

module.exports = {
  updateSubscription,
};
