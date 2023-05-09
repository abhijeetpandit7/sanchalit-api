const jwt = require("jsonwebtoken");
const _ = require("lodash");
const { Countdown } = require("../models/countdown");
const { Customization } = require("../models/customization");
const { Note } = require("../models/note");
const { Todo } = require("../models/todo");
const { TodoList } = require("../models/todoList");
const { User } = require("../models/user");
const { updateCustomization } = require("./customization");
const { addCountdown, mergeCountdown } = require("./countdown");
const { addNote, mergeNote } = require("./note");
const { addTodo, mergeTodo } = require("./todo");
const { addTodoList, mergeTodoList } = require("./todoList");
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
    const isProfileDetailsRequested = req.query.profileDetails === "1";
    const user = await User.findById(userId);
    if (user) {
      let userInfo = _.pick(user, ["_id", "email", "subscriptionSummary"]);
      renameObjectKey(userInfo, "_id", "userId");
      if (isProfileDetailsRequested)
        userInfo = _.extend(
          userInfo,
          _.pick(user, ["fullName", "profilePictureUrl"])
        );

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

      return res.status(206).json({
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

const mergeUserDataWithGoogle = async (req, res, next) => {
  catchError(next, async () => {
    const {
      userId,
      body: { googleCredential },
    } = req;
    const decodedPayload = jwt.decode(googleCredential);
    const { sub: oauthId } = decodedPayload;
    const userWithoutOauth = await User.findById(userId);
    if (userWithoutOauth) {
      if (!!userWithoutOauth.oauthId) {
        return res.status(409).json({
          success: false,
          message: "User has an oauthId",
        });
      }
      const userWithOauth = await User.findOne({ oauthId });
      if (userWithOauth) {
        let mergeCountdownResponse,
          mergeNoteResponse,
          mergeTodoResponse,
          mergeTodoListResponse;

        mergeCountdownResponse = await mergeCountdown(
          next,
          userWithoutOauth,
          userWithOauth
        );
        mergeNoteResponse = await mergeNote(
          next,
          userWithoutOauth,
          userWithOauth
        );
        mergeTodoResponse = await mergeTodo(
          next,
          userWithoutOauth,
          userWithOauth
        );
        mergeTodoListResponse = await mergeTodoList(
          next,
          userWithoutOauth,
          userWithOauth
        );
        await Customization.findByIdAndDelete(userWithoutOauth);
        await User.findByIdAndDelete(userWithoutOauth);

        const token = getSignedToken(userWithOauth);
        let userInfo = _.pick(userWithOauth, ["_id"]);
        renameObjectKey(userInfo, "_id", "userId");
        userInfo = _.extend(userInfo, { token });
        return res.status(202).json({
          success: true,
          auth: userInfo,
        });
      }
      return res.status(404).json({
        success: false,
        message: "User not found",
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

    return res.status(202).json({ success: true });
  });
};

module.exports = {
  getUserSettings,
  mergeUserDataWithGoogle,
  updateUserData,
};
