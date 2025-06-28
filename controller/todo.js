const _ = require("lodash");
const { Todo } = require("../models/todo");
const { updateCustomization } = require("./customization");
const {
  addOrMergeArrayElements,
  catchError,
  renameObjectKey,
} = require("../utils");

const deleteTodo = async (req, res, next) => {
  catchError(next, async () => {
    const { userId } = req;
    const { id } = req.params;
    let ids = [];

    if (req.body?.todos) {
      ids = req.body.todos.map((todo) => todo.id);
    }

    if (req.body?.todoSettings) {
      await updateCustomization(req);
    }

    let todo = await Todo.findById(userId);
    todo = _.extend(todo, {
      itemList: todo.itemList.filter((item) =>
        id
          ? item._id.toString() !== id
          : ids.includes(item._id.toString()) === false
      ),
    });
    await todo.save();

    return res.json({ success: true });
  });
};

const mergeTodo = async (sourceUserId, destinationUserId) => {
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
    const newUserTodo = new Todo({
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
};

const updateTodo = async (req) => {
  const { userId } = req;
  if (req.body.data?.todos) data = req.body.data.todos;
  else data = req.body.data.todo;
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

    return { success: true };
  }

  todo = _.extend(todo, {
    itemList: addOrMergeArrayElements(todo.itemList, itemListData, "_id"),
  });
  await todo.save();

  return { success: true };
};

module.exports = {
  deleteTodo,
  mergeTodo,
  updateTodo,
};
