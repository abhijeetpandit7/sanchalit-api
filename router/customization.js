const express = require("express");
const router = express.Router();
const { authenticateUser } = require("../utils");

const { updateCustomization } = require("../controller/customization");

router.route("/").post(authenticateUser, updateCustomization);

module.exports = router;
