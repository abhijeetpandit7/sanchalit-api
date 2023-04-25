const _ = require("lodash");
const { Countdown } = require("../models/countdown");
const { Customization } = require("../models/customization");
const { Note } = require("../models/note");
const { Todo } = require("../models/todo");
const { TodoList } = require("../models/todoList");
const { User } = require("../models/user");
const { updateCustomization } = require("./customization");
const { addCountdown } = require("./countdown");
const { addNote } = require("./note");
const { addTodo } = require("./todo");
const { addTodoList } = require("./todoList");
const {
  catchError,
  getSignedToken,
  isDeepEqual,
  omitDocumentProperties,
  renameObjectKey,
} = require("../utils");

const getUserSettings = async (req, res, next) => {
  catchError(next, async () => {
    const { userId } = req;
    const user = await User.findById(userId);
    if (user) {
      let userInfo = _.pick(user, ["_id", "email", "subscriptionSummary"]);
      renameObjectKey(userInfo, "_id", "userId");

      const isTokenLegacy =
        isDeepEqual(req.subscriptionSummary, user.subscriptionSummary) ===
        false;
      if (isTokenLegacy) {
        const token = getSignedToken(user);
        userInfo = _.extend(userInfo, { token });
      }

      const customization = await Customization.findById(userId);
      let customizationInfo = !!customization
        ? omitDocumentProperties(customization)
        : customization;

      if (customizationInfo) {
        const [countdowns, notes, todos, todoLists] = await Promise.all([
          Countdown.findById(userId),
          Note.findById(userId),
          Todo.findById(userId),
          TodoList.findById(userId),
        ]);
        // TODO: renameObjectKey("_id", "id");
        if (countdowns)
          customizationInfo = _.extend(customizationInfo, {
            countdowns: countdowns.itemList,
          });
        if (notes)
          customizationInfo = _.extend(customizationInfo, {
            notes: notes.itemList,
          });
        if (todos)
          customizationInfo = _.extend(customizationInfo, {
            todos: todos.itemList,
          });
        if (todoLists)
          customizationInfo = _.extend(customizationInfo, {
            todoLists: todoLists.itemList,
          });
      }

      return res.json({
        success: true,
        auth: userInfo,
        customization: customizationInfo,
      });
    }
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  });
};

const updateUserData = async (req, res, next) => {
  catchError(next, async () => {
    const { countdowns, notes, todos, todoLists } = req.body.data;
    let countdownResponse, noteResponse, todoResponse, todoListResponse;
    const customizationResponse = await updateCustomization(
      req,
      res,
      next,
      false
    );

    if (countdowns?.length)
      countdownResponse = await addCountdown(req, res, next, false);

    if (notes?.length) noteResponse = await addNote(req, res, next, false);

    if (todos?.length) todoResponse = await addTodo(req, res, next, false);

    if (todoLists?.length)
      todoListResponse = await addTodoList(req, res, next, false);

    return res.json({ success: true });
  });
};

module.exports = {
  getUserSettings,
  updateUserData,
};
