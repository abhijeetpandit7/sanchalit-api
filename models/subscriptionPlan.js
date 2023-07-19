const mongoose = require("mongoose");

const subscriptionPlanSchema = mongoose.Schema(
  {
    id: {
      type: String,
      required: "Id is required",
    },
    name: {
      type: String,
      required: "Name is required",
    },
    price: {
      type: Number,
      required: "Price is required",
    },
    interval: {
      type: String,
      required: "Interval is required",
      enum: ["month", "year"],
    },
    durationInDays: {
      type: Number,
      required: "Duration in days is required",
    },
    priceInCents: {
      type: Number,
      required: "Price in cents is required",
    },
    friendlyPlanRate: {
      type: String,
      required: "Friendly plan rate is required",
    },
    friendlyMonthlyPrice: {
      type: Number,
      default: null,
    },
    type: {
      type: String,
      default: "Sanchalit Plus",
    },
    badgeText: {
      type: String,
      default: null,
    },
    latest: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const SubscriptionPlan = mongoose.model(
  "SubscriptionPlan",
  subscriptionPlanSchema
);

module.exports = { SubscriptionPlan };
