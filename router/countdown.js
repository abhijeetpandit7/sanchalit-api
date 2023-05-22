const express = require("express");
const router = express.Router();
const { authenticateUser } = require("../utils");

const { deleteCountdown, updateCountdown } = require("../controller/countdown");

router.route("/").post(authenticateUser, updateCountdown);

router.route("/:id").delete(authenticateUser, deleteCountdown);

module.exports = router;
