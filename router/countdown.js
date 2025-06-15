const express = require("express");
const router = express.Router();
const { authenticateUser } = require("../utils");

const { deleteCountdown } = require("../controller/countdown");

router.route("/{:id}").delete(authenticateUser, deleteCountdown);

module.exports = router;
