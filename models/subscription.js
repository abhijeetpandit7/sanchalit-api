const mongoose = require("mongoose");

const subscriptionSchema = mongoose.Schema(
  {
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
      ref: "SubscriptionPlan",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    discountCode: {
      type: String,
    },
    subscriptionId: {
      type: Number,
    },
    orderId: {
      type: Number,
    },
    productId: {
      type: Number,
    },
    productName: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const userSubscriptionSchema = mongoose.Schema(
  {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    renewsAt: {
      type: Date,
      default: null,
    },
    endsAt: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      default: null,
      enum: ["active", "cancelled", "expired", "trial"],
    },
    customerId: {
      type: Number,
    },
    subscriptionId: {
      type: Number,
    },
    itemList: [subscriptionSchema],
  },
  { timestamps: true }
);

const Subscription = mongoose.model("Subscription", userSubscriptionSchema);

module.exports = { Subscription };
