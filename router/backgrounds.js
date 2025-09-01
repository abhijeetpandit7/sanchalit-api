const express = require("express");

const router = express.Router();

const { authenticateUser } = require("../utils");
const {
  getFavouriteBackgrounds,
} = require("../controller/backgroundCollection");

router.route("/favourites").get(authenticateUser, getFavouriteBackgrounds);

module.exports = router;
