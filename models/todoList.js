const mongoose = require("mongoose");

const todoListSchema = mongoose.Schema({
  _id: {
    type: String,
    required: true,
  },
  title: { type: String, trim: true, required: true },
  colour: { type: String },
  createdDate: { type: Date },
  order: { type: Number },
  itemType: { type: String, trim: true, enum: ["todo_list"] },
  reorder: { type: Boolean },
  ts: { type: Date },
});

const userTodoListSchema = mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  itemList: [todoListSchema],
});

const TodoList = mongoose.model("TodoList", userTodoListSchema);

module.exports = { TodoList };
