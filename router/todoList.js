const express = require("express");
const router = express.Router();
const { authenticateUser } = require("../utils");

const { deleteTodoList } = require("../controller/todoList");

router.route("/:id?").delete(authenticateUser, deleteTodoList);

module.exports = router;
