const express = require("express");
const router = express.Router();
const { authenticateUser } = require("../utils");

const { deleteNote } = require("../controller/note");

router.route("/:id?").delete(authenticateUser, deleteNote);

module.exports = router;
