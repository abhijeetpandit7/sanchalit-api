const axios = require("axios");
const { Buffer } = require("buffer");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const _ = require("lodash");

dotenv.config();

const secret = process.env.SECRET;
const URL_LEMONSQUEEZY_API = "https://api.lemonsqueezy.com/v1";

const addOrMergeArrayElements = (array, newElements, identifier) => {
  if (array.length === 0) return newElements;

  const elementMap = array.reduce((map, element) => {
    map.set(element[identifier], element);
    return map;
  }, new Map());
  newElements.forEach((element) => {
    elementMap.set(element[identifier], {
      ...elementMap.get(element[identifier]),
      ...element,
    });
  });
  return Array.from(elementMap.values());
};

const addOrMergeObjectProperties = (object, newProperties) => {
  const mergedObject = { ...object };

  for (const [key, newValue] of Object.entries(newProperties)) {
    const oldValue = object[key];
    if (_.isArray(oldValue) && _.isArray(newValue)) {
      mergedObject[key] = addOrMergeArrayElements(oldValue, newValue, "id");
    } else if (_.isObject(oldValue) && _.isObject(newValue)) {
      mergedObject[key] = addOrMergeObjectProperties(oldValue, newValue);
    } else {
      mergedObject[key] = newValue;
    }
  }

  return mergedObject;
};

const authenticateUser = async (req, res, next) => {
  const token = req.headers.authorization;
  try {
    const decodedPayload = jwt.verify(token, secret);
    req.userId = decodedPayload.userId;
    req.subscriptionSummary = decodedPayload.subscriptionSummary;
    return next();
  } catch (error) {
    console.error({ error });
    return res.status(401).json({
      success: false,
      message: "Authentication error",
    });
  }
};

const catchError = async (next, callback) => {
  try {
    return await callback();
  } catch (error) {
    next(error);
  }
};

const filterObjectBySchema = (obj, schema) => {
  const filteredData = _.pick(obj, Object.keys(schema));
  return _.mapValues(filteredData, (value, key) => {
    if (_.isObject(value) && _.isObject(schema[key])) {
      return filterObjectBySchema(value, schema[key]);
    }
    return value;
  });
};

const getLemonSqueezyRequestHeaders = () => ({
  Authorization: `Bearer ${process.env.LEMONSQUEEZY_API_TOKEN}`,
});

const getLemonSqueezySubscriptionData = async (subscriptionId) => {
  const url = `${URL_LEMONSQUEEZY_API}/subscriptions/${subscriptionId}?include=product,subscription-invoices`;
  const response = await axios.get(url, {
    headers: getLemonSqueezyRequestHeaders(),
  });
  if (response.status !== 200) return [];

  const subscriptionObject = response.data.data.attributes;
  const productObject = response.data.included.find(
    ({ type }) => type === "products"
  )?.attributes;
  const invoices = response.data.included
    .filter(({ type }) => type === "subscription-invoices")
    .map(({ attributes }) => attributes)
    .filter(({ status }) => status === "paid")
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  return [subscriptionObject, productObject, invoices];
};

const getSignedToken = (user) =>
  jwt.sign(
    { userId: user._id, subscriptionSummary: user.subscriptionSummary },
    secret
  );

/*
 * This recursively compares two objects' properties.
 * The customizer function handles cases where properties are arrays or objects,
 * sorting them before comparison using isEqual.
 * Extra properties will cause isEqualWith to return false.
 */
const isDeepEqual = (obj1, obj2) =>
  _.isEqualWith(obj1, obj2, (val1, val2) => {
    if (_.isArray(val1) && _.isArray(val2)) {
      return _.isEqual(_.sortBy(val1), _.sortBy(val2));
    }
    if (_.isObject(val1) && _.isObject(val2)) {
      return isDeepEqual(_.sortBy(_.values(val1)), _.sortBy(_.values(val2)));
    }
  });

const omitDocumentProperties = (obj) =>
  _.omit(obj.toObject(), ["_id", "__v", "createdAt", "updatedAt"]);

const renameObjectKey = (obj, oldKey, newKey) => {
  obj[newKey] = obj[oldKey];
  delete obj[oldKey];
  return obj;
};

const updateLemonSqueezySubscriptionStatus = async (
  subscriptionId,
  cancelled
) => {
  const url = `${URL_LEMONSQUEEZY_API}/subscriptions/${subscriptionId}`;
  const data = {
    type: "subscriptions",
    id: subscriptionId.toString(),
    attributes: {
      cancelled,
    },
  };
  const response = await axios.patch(
    url,
    {
      data,
    },
    { headers: getLemonSqueezyRequestHeaders() }
  );
  if (response.status === 200) return response.data.data.attributes;
};

const validateSignature = (req, res, next) => {
  const hmac = crypto.createHmac("sha256", process.env.LEMONSQUEEZY_SECRET);
  const digest = Buffer.from(hmac.update(req.body).digest("hex"), "utf8");
  const signature = Buffer.from(req.get("X-Signature") || "", "utf8");

  if (crypto.timingSafeEqual(digest, signature)) {
    req.body = JSON.parse(req.body);
    if (req.body.meta?.custom_data?.userId)
      req.userId = req.body.meta.custom_data.userId;
    else
      return res.status(400).json({
        success: false,
        message: "Insufficient data",
      });
    if (req.get("x-event-name") === "subscription_updated") {
      return next();
    }
    return res.status(400).json({
      success: false,
      message: "Invalid event",
    });
  }
  res.status(401).json({
    success: false,
    message: "Invalid signature",
  });
};

module.exports = {
  addOrMergeArrayElements,
  addOrMergeObjectProperties,
  authenticateUser,
  catchError,
  filterObjectBySchema,
  getLemonSqueezySubscriptionData,
  getSignedToken,
  isDeepEqual,
  omitDocumentProperties,
  renameObjectKey,
  updateLemonSqueezySubscriptionStatus,
  validateSignature,
};
