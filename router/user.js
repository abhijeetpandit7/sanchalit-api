const express = require("express");
const router = express.Router();
const _ = require("lodash");
const { authenticateUser } = require("../utils");

const {
  connectGoogle,
  getUser,
  getUserId,
  signUpUser,
  signUpUserWithGoogle,
} = require("../controller/user");

router.route("/").get(authenticateUser, getUser);

router.route("/id").get(getUserId);

router.route("/connect/google").post(authenticateUser, connectGoogle);
router.route("/register").post(signUpUser);

router.route("/signup/google").post(signUpUserWithGoogle);

module.exports = router;
