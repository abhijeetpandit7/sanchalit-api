const jwt = require("jsonwebtoken");
const _ = require("lodash");
const { Countdown } = require("../models/countdown");
const { Customization } = require("../models/customization");
const { Note } = require("../models/note");
const { Todo } = require("../models/todo");
const { TodoList } = require("../models/todoList");
const { User } = require("../models/user");
const { getScheduledBackgrounds } = require("./backgroundCollection");
const { updateCustomization } = require("./customization");
const { mergeCountdown, updateCountdown } = require("./countdown");
const { mergeNote, updateNote } = require("./note");
const {
  getScheduledQuotes,
  mergeQuote,
  updateQuote,
} = require("./quoteCollection");
const { mergeTodo, updateTodo } = require("./todo");
const { mergeTodoList, updateTodoList } = require("./todoList");
const {
  catchError,
  getCookieOptions,
  getSignedToken,
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

      const token = getSignedToken(user);
      res.cookie("token", token, getCookieOptions());

      const customization = await Customization.findById(userId);
      let customizationInfo = !!customization
        ? omitDocumentProperties(customization)
        : customization;

      if (customizationInfo) {
        const [
          { value: countdowns },
          { value: notes },
          { value: todos },
          { value: todoLists },
          { value: backgrounds },
          { value: quotes },
        ] = await Promise.allSettled([
          Countdown.findById(userId),
          Note.findById(userId),
          Todo.findById(userId),
          TodoList.findById(userId),
          getScheduledBackgrounds(req),
          customizationInfo.quotesVisible && getScheduledQuotes(req),
        ]);

        if (backgrounds)
          customizationInfo = _.extend(customizationInfo, { backgrounds });
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
        if (quotes) customizationInfo = _.extend(customizationInfo, { quotes });
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
    res.clearCookie("token", getCookieOptions());
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
        const results = await Promise.allSettled([
          mergeCountdown(userWithoutOauth, userWithOauth),
          mergeNote(userWithoutOauth, userWithOauth),
          mergeTodo(userWithoutOauth, userWithOauth),
          mergeTodoList(userWithoutOauth, userWithOauth),
          mergeQuote(userWithoutOauth, userWithOauth),
        ]);
        const errors = results
          .filter((r) => r.status === "rejected")
          .map((r) => r.reason);
        if (errors.length) {
          return next(
            `Cannot merge user data with Google account: ${errors.join(", ")}`
          );
        }
        await Customization.findByIdAndDelete(userWithoutOauth);
        await User.findByIdAndDelete(userWithoutOauth);

        const token = getSignedToken(userWithOauth);
        let userInfo = _.pick(userWithOauth, ["_id"]);
        renameObjectKey(userInfo, "_id", "userId");

        res.cookie("token", token, getCookieOptions());
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

    res.clearCookie("token", getCookieOptions());
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  });
};

const updateUserData = async (req, res, next) => {
  catchError(next, async () => {
    const { countdowns, notes, todos, todoLists, quoteCollection } =
      req.body.data;
    let [{ value: quoteCollectionResponse }] = await Promise.allSettled([
      quoteCollection?.skipQuote && getScheduledQuotes(req),
      quoteCollection?.favourites?.length && updateQuote(req),
      updateCustomization(req),
      countdowns?.length && updateCountdown(req),
      notes?.length && updateNote(req),
      todos?.length && updateTodo(req),
      todoLists?.length && updateTodoList(req),
    ]);

    let customizationInfo = {};
    if (quoteCollectionResponse) {
      customizationInfo = _.extend(customizationInfo, {
        quotes: quoteCollectionResponse,
      });
    }

    return res
      .status(202)
      .json({ success: true, customization: customizationInfo });
  });
};

module.exports = {
  getUserSettings,
  mergeUserDataWithGoogle,
  updateUserData,
};
