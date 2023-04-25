const mongoose = require("mongoose");

const todoSchema = mongoose.Schema({
  _id: {
    type: String,
    required: true,
  },
  title: { type: String, trim: true, required: true },
  createdDate: { type: Date },
  completedDate: { type: Date },
  homeListId: {
    type: String,
    required: true,
  },
  listId: {
    type: String,
    required: true,
  },
  order: { type: Number },
  done: { type: Boolean },
  today: { type: Boolean },
  ts: { type: Date },
});

const userTodoSchema = mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  itemList: [todoSchema],
});

const Todo = mongoose.model("Todo", userTodoSchema);

module.exports = { Todo };
