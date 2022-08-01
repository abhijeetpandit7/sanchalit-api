const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const bodyParser = require("body-parser");

const db = require("./config/db");

const PORT = process.env.PORT || 5000;

dotenv.config();

db.connectDB();

const app = express();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));

app.get("*", (req, res) => {
  res.send("Sanchalit API is running");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
