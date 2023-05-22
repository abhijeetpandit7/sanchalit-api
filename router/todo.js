const express = require("express");
const router = express.Router();
const { authenticateUser } = require("../utils");

const { deleteTodo, updateTodo } = require("../controller/todo");

router.route("/").post(authenticateUser, updateTodo);

router.route("/:id").delete(authenticateUser, deleteTodo);

module.exports = router;
