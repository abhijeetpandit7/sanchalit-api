const express = require("express");
const router = express.Router();
const { authenticateUser } = require("../utils");

const {
  getScheduledQuotes,
  updateQuote,
} = require("../controller/quoteCollection");

router.route("/").post(authenticateUser, updateQuote);

router.route("/skip").post(authenticateUser, getScheduledQuotes);

module.exports = router;
