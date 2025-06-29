const express = require("express");
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
app.use(cors());
app.disable("x-powered-by");

const userRouter = require("./router/user");
const userDataRouter = require("./router/userData");
const countdownRouter = require("./router/countdown");
const noteRouter = require("./router/note");
const todoRouter = require("./router/todo");
const todoListRouter = require("./router/todoList");
const subscriptionRouter = require("./router/subscription");
const subscriptionPlanRouter = require("./router/subscriptionPlan");

db.connectDB();

app.use("/user", userRouter);
app.use("/userData", userDataRouter);
app.use("/countdown", countdownRouter);
app.use("/note", noteRouter);
app.use("/todo", todoRouter);
app.use("/todoList", todoListRouter);
app.use("/subscription", subscriptionRouter);
app.use("/subscriptionPlan", subscriptionPlanRouter);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message:
      "Refer to the API docs at github.com/abhijeetpandit7/sanchalit-api",
  });
});

app.use((err, req, res, next) => {
  console.log(err.stack);
  res.status(500).json({
    success: false,
    message: err.message,
  });
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
