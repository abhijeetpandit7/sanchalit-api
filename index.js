const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const dotenv = require("dotenv");

const db = require("./config/db");

const PORT = process.env.PORT || 5000;

dotenv.config();

const app = express();
app.use(
  express.json({
    verify: (req, res, buf) => {
      if (req.path.includes("webhook")) req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
// TODO: Remove origin, credentials; this allows cross-site Access-Control requests with credentials
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(",") ?? [],
    credentials: true,
  })
);
app.disable("x-powered-by");

const userRouter = require("./router/user");
const userDataRouter = require("./router/userData");
const countdownRouter = require("./router/countdown");
const noteRouter = require("./router/note");
const todoRouter = require("./router/todo");
const todoListRouter = require("./router/todoList");
const subscriptionRouter = require("./router/subscription");
const subscriptionPlanRouter = require("./router/subscriptionPlan");
const { getScheduledBackgrounds } = require("./controller/backgroundCollection");

db.connectDB();

app.use("/user", userRouter);
app.use("/userData", userDataRouter);
app.use("/countdown", countdownRouter);
app.use("/note", noteRouter);
app.use("/todo", todoRouter);
app.use("/todoList", todoListRouter);
app.use("/subscription", subscriptionRouter);
app.use("/subscriptionPlan", subscriptionPlanRouter);
// add endpoint to test getScheduledBackgrounds
app.get("/test/scheduledBackgrounds", async (req, res) => {
  const { userId, localDate } = req.query;
  const result = await getScheduledBackgrounds(userId, localDate);
  res.json(result);
});

app.get("/", (req, res) => {
  res.json({
    success: true,
    message:
      "Refer to the API docs at github.com/abhijeetpandit7/sanchalit-api",
  });
});

app.use((err, req, res, next) => {
  console.error(`Something wrong in ${req.method} ${req.path}:`, err);
  if (!res.headersSent) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Undefined endpoint",
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
