const express = require("express");
const router = express.Router();
const { authenticateUser } = require("../utils");

const { deleteTodo } = require("../controller/todo");

router.route("/:id?").delete(authenticateUser, deleteTodo);

module.exports = router;
