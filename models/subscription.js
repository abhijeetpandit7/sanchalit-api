const mongoose = require("mongoose");

const subscriptionSchema = mongoose.Schema({
  _id: {
    type: Number,
    required: true,
  },
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
  discountCode: {
    type: String,
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
});

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
      enum: [
        "active",
        "cancelled",
        "expired",
        "past_due",
        "unpaid",
        "on_trial",
      ],
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
