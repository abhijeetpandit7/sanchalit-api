const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const _ = require("lodash");

dotenv.config();

const secret = process.env.SECRET;

const addOrMergeArrayElements = (array, elements, identifier) => {
  if (array.length === 0) return elements;

  const elementMap = array.reduce((map, element) => {
    map.set(element[identifier], element);
    return map;
  }, new Map());
  elements.forEach((element) => {
    elementMap.set(element[identifier], {
      ...elementMap.get(element[identifier]),
      ...element,
    });
  });
  return Array.from(elementMap.values());
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
    await callback();
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

module.exports = {
  addOrMergeArrayElements,
  authenticateUser,
  catchError,
  filterObjectBySchema,
  getSignedToken,
  isDeepEqual,
  omitDocumentProperties,
  renameObjectKey,
};
