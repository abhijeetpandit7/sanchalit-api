const express = require("express");
const router = express.Router();
const { authenticateUser } = require("../utils");

const {
  connectGoogle,
  getUser,
  getUserId,
  logInUserWithGoogle,
  logOutUser,
  signUpUser,
  signUpUserWithGoogle,
} = require("../controller/user");

router.route("/").get(authenticateUser, getUser);

router.route("/connect/google").post(authenticateUser, connectGoogle);

router.route("/id").get(getUserId);

router.route("/login").post(logInUserWithGoogle);

router.route("/logout").post(authenticateUser, logOutUser);

router.route("/register").post(signUpUser);

router.route("/signup/google").post(signUpUserWithGoogle);

module.exports = router;
