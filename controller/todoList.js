const _ = require("lodash");
const { TodoList } = require("../models/todoList");
const {
  addOrMergeArrayElements,
  catchError,
  renameObjectKey,
} = require("../utils");

const DEFAULT_TODO_LIST_IDS = ["inbox", "today", "done"];

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

const mergeTodoList = async (next, sourceUserId, destinationUserId) => {
  catchError(next, async () => {
    let todoListOfSourceUser = await TodoList.findById(sourceUserId);
    if (!todoListOfSourceUser) {
      return {
        success: true,
        message: "No document to merge",
      };
    } else if (todoListOfSourceUser.itemList.length === 0) {
      await TodoList.findByIdAndDelete(sourceUserId);
      return {
        success: true,
        message: "No itemList to merge",
      };
    }

    let todoListOfDestinationUser = await TodoList.findById(destinationUserId);
    if (!todoListOfDestinationUser) {
      newUserTodoList = new TodoList({
        _id: destinationUserId,
        itemList: [...todoListOfSourceUser.itemList],
      });
      await newUserTodoList.save();
      await TodoList.findByIdAndDelete(sourceUserId);

      return {
        success: true,
      };
    }

    todoListOfDestinationUser = _.extend(todoListOfDestinationUser, {
      itemList: addOrMergeArrayElements(
        todoListOfDestinationUser.itemList,
        todoListOfSourceUser.itemList.filter(
          (item) => !DEFAULT_TODO_LIST_IDS.includes(item._id)
        ),
        "_id"
      ),
    });
    await todoListOfDestinationUser.save();
    await TodoList.findByIdAndDelete(sourceUserId);

    return {
      success: true,
    };
  });
};

module.exports = {
  addTodoList,
  mergeTodoList,
};
