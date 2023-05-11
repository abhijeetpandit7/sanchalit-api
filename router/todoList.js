const express = require("express");
const router = express.Router();
const { authenticateUser } = require("../utils");

const { deleteTodoList, updateTodoList } = require("../controller/todoList");

router.route("/").post(authenticateUser, updateTodoList);

router.route("/:id").delete(authenticateUser, deleteTodoList);

module.exports = router;
