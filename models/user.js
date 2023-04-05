const mongoose = require("mongoose");

const userSchema = mongoose.Schema(
  {
    oauthProvider: {
      type: String,
      enum: ["google"],
    },
    oauthId: {
      type: String,
    },
    email: {
      type: String,
      trim: true,
    },
    fullName: {
      type: String,
      trim: true,
    },
    profilePictureUrl: {
      type: String,
    },
    subscriptionSummary: {
      startDate: {
        type: Date,
        default: null,
      },
      endDate: {
        type: Date,
        default: null,
      },
      plan: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
      },
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

module.exports = { User };
