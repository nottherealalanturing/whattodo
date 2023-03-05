const express = require("express");
const loginRouter = require("./controllers/login");
const taskRouter = require("./controllers/tasks");
const usersRouter = require("./controllers/users");
const database = require("./utils/database");
const middleware = require("./utils/middleware");
const app = express();
require("express-async-errors");

database();

app.use(express.json());
app.use(middleware.requestLogger);

app.use("/api/login", loginRouter);
app.use("/api/tasks", taskRouter);
app.use("/api/users", usersRouter);

app.use(middleware.unknownEndpoint);
app.use(middleware.errorHandler);

module.exports = app;
