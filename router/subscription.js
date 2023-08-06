const express = require("express");
const router = express.Router();
const { authenticateUser, validateSignature } = require("../utils");

const {
  getSubscription,
  updateSubscription,
  updateSubscriptionAutoRenewalStatus,
} = require("../controller/subscription");

router.route("/").get(authenticateUser, getSubscription);

router
  .route("/auto-renew")
  .post(authenticateUser, updateSubscriptionAutoRenewalStatus);

router.route("/webhook").post(validateSignature, updateSubscription);

module.exports = router;
