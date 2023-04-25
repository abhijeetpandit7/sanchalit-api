const _ = require("lodash");
const { TodoList } = require("../models/todoList");
const {
  addOrMergeArrayElements,
  catchError,
  renameObjectKey,
} = require("../utils");

const addTodoList = async (req, res, next, sendResponse = true) => {
  catchError(next, async () => {
    const { userId } = req;
    if (req.body.data?.todoLists) data = req.body.data.todoLists;
    else data = req.body.data;
    const itemListData = _.isArray(data)
      ? data.map((item) => renameObjectKey(item, "id", "_id"))
      : [renameObjectKey(data, "id", "_id")];

    let todoList = await TodoList.findById(userId);

    if (!todoList) {
      const newUserTodoList = new TodoList({
        _id: userId,
        itemList: [...itemListData],
      });
      await newUserTodoList.save();

      if (sendResponse) {
        return res.status(201).json({ success: true });
      } else {
        return newUserTodoList;
      }
    }

    todoList = _.extend(todoList, {
      itemList: addOrMergeArrayElements(todoList.itemList, itemListData, "_id"),
    });
    await todoList.save();

    if (sendResponse) {
      return res.json({ success: true });
    } else {
      return todoList;
    }
  });
};

module.exports = {
  addTodoList,
};
