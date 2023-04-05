const jwt = require("jsonwebtoken");
const _ = require("lodash");
const { User } = require("../models/user");
const { catchError, getSignedToken, isDeepEqual } = require("../utils");

const connectGoogle = async (req, res, next) => {
  catchError(next, async () => {
    const { googleCredential } = req.body;
    const decodedPayload = jwt.decode(googleCredential);
    const {
      sub: oauthId,
      email,
      name: fullName,
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
      user = await user.save();
      return res.json({
        success: true,
        user: _.pick(user, ["_id"]),
      });
    }
    return res.json({
      success: false,
      message: "User not found",
    });
  });
};

const getUser = async (req, res, next) => {
  catchError(next, async () => {
    const user = await User.findById(req.userId);
    if (user) {
      let userInfo = _.pick(user, ["_id"]);
      const isTokenLegacy =
        isDeepEqual(req.subscriptionSummary, user.subscriptionSummary) ===
        false;
      if (isTokenLegacy) {
        const token = getSignedToken(user);
        userInfo = _.extend(userInfo, { token });
      }
      return res.json({
        success: true,
        user: userInfo,
      });
    }
    return res.json({
      success: false,
      message: "User not found",
    });
  });
};

const getUserId = async (req, res, next) => {
  catchError(next, async () => {
    const { googleCredential } = req.body;
    const decodedPayload = jwt.decode(googleCredential);
    const { sub: oauthId } = decodedPayload;
    const user = await User.findOne({ oauthId });
    if (user) {
      return res.json({
        success: true,
        user: _.pick(user, ["_id"]),
      });
    }
    return res.json({
      success: false,
      message: "User not found",
    });
  });
};

const signUpUser = async (req, res, next) => {
  catchError(next, async () => {
    let user = new User();
    user = await user.save();
    const token = getSignedToken(user);
    let userInfo = _.pick(user, ["_id"]);
    userInfo = _.extend(userInfo, { token });
    return res.json({
      success: true,
      user: userInfo,
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
    user = await user.save();
    const token = getSignedToken(user);
    let userInfo = _.pick(user, ["_id"]);
    userInfo = _.extend(userInfo, { token });
    return res.json({
      success: true,
      user: userInfo,
    });
  });
};

module.exports = {
  connectGoogle,
  getUser,
  getUserId,
  signUpUser,
  signUpUserWithGoogle,
};
