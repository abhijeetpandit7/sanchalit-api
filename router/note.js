const express = require("express");
const router = express.Router();
const { authenticateUser } = require("../utils");

const { deleteNote, updateNote } = require("../controller/note");

router
  .route("/")
  .post(authenticateUser, updateNote)
  .delete(authenticateUser, deleteNote);

module.exports = router;
