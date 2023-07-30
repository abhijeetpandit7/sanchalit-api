const _ = require("lodash");
const { Subscription } = require("../models/subscription");
const { User } = require("../models/user");
const { addOrMergeArrayElements, catchError } = require("../utils");

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
  updateSubscription,
};
