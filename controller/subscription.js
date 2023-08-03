const _ = require("lodash");
const { Subscription } = require("../models/subscription");
const { SubscriptionPlan } = require("../models/subscriptionPlan");
const { User } = require("../models/user");
const {
  addOrMergeArrayElements,
  catchError,
  getLemonSqueezySubscriptionData,
} = require("../utils");

const getSubscription = async (req, res, next) => {
  catchError(next, async () => {
    let subscription = await Subscription.findById(req.userId);
    if (subscription) {
      const { subscriptionId } = subscription;
      const currentSubscriptionPlan = await SubscriptionPlan.find({
        id: subscription.itemList.find(({ _id }) => _id === subscriptionId)
          ?.plan,
      }).then((plans) => plans[0]);
      if (!currentSubscriptionPlan) {
        return res.status(404).json({
          success: false,
          message: "SubscriptionPlan not found",
        });
      }

      const [subscriptionObject, productObject, invoices] =
        await getLemonSqueezySubscriptionData(subscriptionId);
      if (
        [subscriptionObject, productObject, invoices].some((item) =>
          _.isEmpty(item)
        )
      ) {
        return res.status(422).json({
          success: false,
          message: "Insufficient data",
        });
      }

      const currentSubscription = {
        ..._.pick(subscription, ["renewsAt", "endsAt", "status"]),
        amount: invoices[0].total_usd / 100,
        friendlyAmount: `${invoices[0].total_formatted}/${currentSubscriptionPlan.interval}`,
        interval: currentSubscriptionPlan.interval,
      };

      const charges = invoices.map((invoice) => ({
        amount: invoice.total_usd / 100,
        card: {
          brand: invoice.card_brand,
          last_four: invoice.card_last_four,
        },
        date: invoice.created_at,
        invoice_url: invoice.urls.invoice_url,
      }));

      const upcomingInvoice =
        subscription.status === "cancelled" ? null : productObject.price / 100;

      const updatePaymentMethodUrl =
        subscriptionObject.urls.update_payment_method;

      return res.json({
        success: true,
        currentSubscription,
        charges,
        upcomingInvoice,
        updatePaymentMethodUrl,
      });
    }
    return res.status(404).json({
      success: false,
      message: "Subscription not found",
    });
  });
};

const updateSubscription = async (req, res, next) => {
  catchError(next, async () => {
    const { userId } = req;
    const {
      data: { attributes, id },
      meta,
    } = req.body;

    let subscription = await Subscription.findById(userId);
    if (!subscription) {
      subscription = new Subscription({
        _id: userId,
      });
    }
    subscription = _.extend(subscription, {
      renewsAt: attributes.renews_at,
      endsAt: attributes.ends_at,
      status: attributes.status,
      customerId: attributes.customer_id,
      subscriptionId: +id,
    });
    let targetItem = subscription.itemList.find((item) => item._id === +id);
    if (!targetItem) {
      targetItem = {
        _id: +id,
        startDate: attributes.created_at,
        endDate: attributes.renews_at,
        plan: meta?.custom_data?.plan,
        orderId: attributes.order_id,
        productId: attributes.product_id,
        productName: attributes.product_name,
      };
    }
    targetItem = _.extend(targetItem, {
      endDate: attributes.renews_at ?? targetItem.endDate,
    });
    if (["expired", "unpaid"].includes(subscription.status)) {
      subscription.renewsAt = null;
      subscription.subscriptionId = null;
    } else if (subscription.status === "cancelled") {
      subscription.renewsAt = null;
    }
    subscription = _.extend(subscription, {
      itemList: addOrMergeArrayElements(
        subscription.itemList,
        [targetItem],
        "_id"
      ),
    });
    await subscription.save();

    let user = await User.findById(userId);
    if (user) {
      if (["expired", "unpaid"].includes(subscription.status)) {
        user = _.extend(user, {
          subscriptionSummary: {
            startDate: null,
            endDate: null,
            plan: null,
            status: subscription.status,
          },
        });
      } else {
        user = _.extend(user, {
          subscriptionSummary: {
            startDate: targetItem.startDate,
            endDate: targetItem.endDate,
            plan: targetItem.plan,
            status: subscription.status,
          },
        });
      }
      await user.save();
    }

    return res.status(200).json({ success: true });
  });
};

module.exports = {
  getSubscription,
  updateSubscription,
};
