const _ = require("lodash");
const { Todo } = require("../models/todo");
const {
  addOrMergeArrayElements,
  catchError,
  renameObjectKey,
} = require("../utils");

const addTodo = async (req, res, next, sendResponse = true) => {
  catchError(next, async () => {
    const { userId } = req;
    if (req.body.data?.todos) data = req.body.data.todos;
    else data = req.body.data;
    const itemListData = _.isArray(data)
      ? data.map((item) => renameObjectKey(item, "id", "_id"))
      : [renameObjectKey(data, "id", "_id")];

    let todo = await Todo.findById(userId);

    if (!todo) {
      const newUserTodo = new Todo({
        _id: userId,
        itemList: [...itemListData],
      });
      await newUserTodo.save();

      if (sendResponse) {
        return res.status(201).json({ success: true });
      } else {
        return newUserTodo;
      }
    }

    todo = _.extend(todo, {
      itemList: addOrMergeArrayElements(todo.itemList, itemListData, "_id"),
    });
    await todo.save();

    if (sendResponse) {
      return res.json({ success: true });
    } else {
      return todo;
    }
  });
};

module.exports = {
  addTodo,
};
