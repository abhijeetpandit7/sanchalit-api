const _ = require("lodash");
const { Todo } = require("../models/todo");
const { updateCustomization } = require("./customization");
const {
  addOrMergeArrayElements,
  catchError,
  renameObjectKey,
} = require("../utils");

const mergeTodo = async (next, sourceUserId, destinationUserId) => {
  catchError(next, async () => {
    let todoOfSourceUser = await Todo.findById(sourceUserId);
    if (!todoOfSourceUser) {
      return {
        success: true,
        message: "No document to merge",
      };
    } else if (todoOfSourceUser.itemList.length === 0) {
      await Todo.findByIdAndDelete(sourceUserId);
      return {
        success: true,
        message: "No itemList to merge",
      };
    }

    let todoOfDestinationUser = await Todo.findById(destinationUserId);
    if (!todoOfDestinationUser) {
      newUserTodo = new Todo({
        _id: destinationUserId,
        itemList: [...todoOfSourceUser.itemList],
      });
      await newUserTodo.save();
      await Todo.findByIdAndDelete(sourceUserId);

      return {
        success: true,
      };
    }

    todoOfDestinationUser = _.extend(todoOfDestinationUser, {
      itemList: addOrMergeArrayElements(
        todoOfDestinationUser.itemList,
        todoOfSourceUser.itemList,
        "_id"
      ),
    });
    await todoOfDestinationUser.save();
    await Todo.findByIdAndDelete(sourceUserId);

    return {
      success: true,
    };
  });
};

const updateTodo = async (req, res, next, sendResponse = true) => {
  catchError(next, async () => {
    const { userId } = req;
    if (req.body.data?.todos) data = req.body.data.todos;
    else data = req.body.data.todo;
    const itemListData = _.isArray(data)
      ? data.map((item) => renameObjectKey(item, "id", "_id"))
      : [renameObjectKey(data, "id", "_id")];

    if (req.body.data?.todoSettings) {
      await updateCustomization(req, res, next, false);
    }

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
  mergeTodo,
  updateTodo,
};
