const jwt = require("jsonwebtoken");
const _ = require("lodash");
const { Countdown } = require("../models/countdown");
const { Customization } = require("../models/customization");
const { Note } = require("../models/note");
const { Todo } = require("../models/todo");
const { TodoList } = require("../models/todoList");
const { User } = require("../models/user");
const { updateCustomization } = require("./customization");
const { mergeCountdown, updateCountdown } = require("./countdown");
const { mergeNote, updateNote } = require("./note");
const { mergeTodo, updateTodo } = require("./todo");
const { mergeTodoList, updateTodoList } = require("./todoList");
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
        isDeepEqual(
          JSON.parse(JSON.stringify(req.subscriptionSummary)),
          JSON.parse(JSON.stringify(user.subscriptionSummary))
        ) === false;
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

        if (countdowns)
          customizationInfo = _.extend(customizationInfo, {
            countdowns: countdowns
              .toObject()
              .itemList.map((item) => renameObjectKey(item, "_id", "id")),
          });
        if (notes)
          customizationInfo = _.extend(customizationInfo, {
            notes: notes
              .toObject()
              .itemList.map((item) => renameObjectKey(item, "_id", "id")),
          });
        if (todos)
          customizationInfo = _.extend(customizationInfo, {
            todos: todos
              .toObject()
              .itemList.map((item) => renameObjectKey(item, "_id", "id")),
          });
        if (todoLists)
          customizationInfo = _.extend(customizationInfo, {
            todoLists: todoLists
              .toObject()
              .itemList.map((item) => renameObjectKey(item, "_id", "id")),
          });

        return res.json({
          success: true,
          auth: userInfo,
          customization: customizationInfo,
        });
      }

      return res.status(206).json({
        success: true,
        auth: userInfo,
        message: "Customization not found",
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
      countdownResponse = await updateCountdown(req, res, next, false);

    if (notes?.length) noteResponse = await updateNote(req, res, next, false);

    if (todos?.length) todoResponse = await updateTodo(req, res, next, false);

    if (todoLists?.length)
      todoListResponse = await updateTodoList(req, res, next, false);

    return res.status(202).json({ success: true });
  });
};

module.exports = {
  getUserSettings,
  mergeUserDataWithGoogle,
  updateUserData,
};
