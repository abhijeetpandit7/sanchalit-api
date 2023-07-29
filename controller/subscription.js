const _ = require("lodash");
const { Subscription } = require("../models/subscription");
const { catchError } = require("../utils");

const updateSubscription = async (req, res, next) => {
  catchError(next, async () => {
      }
    }

    return res.status(200).json({ success: true });
  });
};

module.exports = {
  updateSubscription,
};
