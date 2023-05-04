const express = require("express");
const router = express.Router();
const { authenticateUser } = require("../utils");

const {
  getUserSettings,
  mergeUserDataWithGoogle,
  updateUserData,
} = require("../controller/userData");

router.route("/").post(authenticateUser, updateUserData);

router.route("/merge").post(authenticateUser, mergeUserDataWithGoogle);

router.route("/settings").get(authenticateUser, getUserSettings);

module.exports = router;
