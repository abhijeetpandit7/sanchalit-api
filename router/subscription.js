const express = require("express");
const router = express.Router();
const { validateSignature } = require("../utils");

const { updateSubscription } = require("../controller/subscription");

router.route("/webhook").post(validateSignature, updateSubscription);

module.exports = router;
