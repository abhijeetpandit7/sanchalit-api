const express = require("express");
const router = express.Router();

const { getSubscriptionPlans } = require("../controller/subscriptionPlan");

router.route("/").get(getSubscriptionPlans);

module.exports = router;
