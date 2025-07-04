const jwt = require("jsonwebtoken");
const _ = require("lodash");
const { Customization } = require("../models/customization");
const { User } = require("../models/user");
const {
  catchError,
  getCookieOptions,
  getSignedToken,
  renameObjectKey,
} = require("../utils");

const USER_ATTRIBUTES = [
  "_id",
  "email",
  "fullName",
  "profilePictureUrl",
  "subscriptionSummary",
];

const connectGoogle = async (req, res, next) => {
  catchError(next, async () => {
    const { googleCredential } = req.body;
    const decodedPayload = jwt.decode(googleCredential);
    const {
      sub: oauthId,
      email,
      name: fullName,
      given_name: displayName,
      picture: profilePictureUrl,
    } = decodedPayload;

    let user = await User.findById(req.userId);
    if (user) {
      user = _.extend(user, {
        oauthProvider: "google",
        oauthId,
        email,
        fullName,
        profilePictureUrl,
      });
      await user.save();
      let userInfo = _.pick(user, USER_ATTRIBUTES);
      renameObjectKey(userInfo, "_id", "userId");
      const token = getSignedToken(user);
      res.cookie("token", token, getCookieOptions());
      const customization = await Customization.findById(req.userId);
      if (customization && !!customization.displayName === false)
        customization.displayName = displayName;
      await customization.save();
      return res.json({
        success: true,
        auth: userInfo,
      });
    }
    res.clearCookie("token", getCookieOptions());
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  });
};

const getUser = async (req, res, next) => {
  catchError(next, async () => {
    const user = await User.findById(req.userId);
    if (user) {
      let userInfo = _.pick(user, USER_ATTRIBUTES);
      renameObjectKey(userInfo, "_id", "userId");
      const token = getSignedToken(user);
      res.cookie("token", token, getCookieOptions());
      return res.json({
        success: true,
        auth: userInfo,
      });
    }
    res.clearCookie("token", getCookieOptions());
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  });
};

const getUserId = async (req, res, next) => {
  catchError(next, async () => {
    const googleCredential = req.headers["google-credential"];
    const decodedPayload = jwt.decode(googleCredential);
    const { sub: oauthId } = decodedPayload;
    const user = await User.findOne({ oauthId });
    if (user) {
      return res.json({
        success: true,
        auth: renameObjectKey(_.pick(user, ["_id"]), "_id", "userId"),
      });
    }
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  });
};

const logInUserWithGoogle = async (req, res, next) => {
  catchError(next, async () => {
    const { googleCredential } = req.body;
    const decodedPayload = jwt.decode(googleCredential);
    const { sub: oauthId } = decodedPayload;
    const user = await User.findOne({ oauthId });
    if (user) {
      const token = getSignedToken(user);
      let userInfo = _.pick(user, USER_ATTRIBUTES);
      renameObjectKey(userInfo, "_id", "userId");
      res.cookie("token", token, getCookieOptions());
      return res.json({
        success: true,
        auth: userInfo,
      });
    }
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  });
};

const logOutUser = async (req, res, next) => {
  catchError(next, async () => {
    res.clearCookie("token", getCookieOptions());
    return res.json({ success: true });
  });
};

const signUpUser = async (req, res, next) => {
  catchError(next, async () => {
    let user = new User();
    await user.save();
    const token = getSignedToken(user);
    let userInfo = _.pick(user, ["_id", "subscriptionSummary"]);
    renameObjectKey(userInfo, "_id", "userId");
    res.cookie("token", token, getCookieOptions());
    return res.status(201).json({
      success: true,
      auth: userInfo,
    });
  });
};

const signUpUserWithGoogle = async (req, res, next) => {
  catchError(next, async () => {
    const { googleCredential } = req.body;
    const decodedPayload = jwt.decode(googleCredential);
    const {
      sub: oauthId,
      email,
      name: fullName,
      picture: profilePictureUrl,
    } = decodedPayload;
    let user = await new User({
      oauthProvider: "google",
      oauthId,
      email,
      fullName,
      profilePictureUrl,
    });
    await user.save();
    const token = getSignedToken(user);
    let userInfo = _.pick(user, USER_ATTRIBUTES);
    renameObjectKey(userInfo, "_id", "userId");
    res.cookie("token", token, getCookieOptions());
    return res.status(201).json({
      success: true,
      auth: userInfo,
    });
  });
};

module.exports = {
  connectGoogle,
  getUser,
  getUserId,
  logInUserWithGoogle,
  logOutUser,
  signUpUser,
  signUpUserWithGoogle,
};
