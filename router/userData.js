const express = require("express");
const router = express.Router();
const { authenticateUser } = require("../utils");

const { updateUserData, getUserSettings } = require("../controller/userData");

router.route("/").post(authenticateUser, updateUserData);

router.route("/settings").get(authenticateUser, getUserSettings);

module.exports = router;
