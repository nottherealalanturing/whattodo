const express = require("express");
const database = require("./utils/database");
const middleware = require("./utils/middleware");
const cors = require("cors");
const { passport } = require("./utils/auth");
const { usersRouter } = require("./controllers/v1");

const app = express();
require("express-async-errors");

database();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(middleware.requestLogger);

app.use(passport.initialize());

app.use("/api/v1/auth", usersRouter);

app.use(middleware.unknownEndpoint);
app.use(middleware.errorHandler);

module.exports = app;
