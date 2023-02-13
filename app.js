const express = require("express");
const taskRouter = require("./controllers/tasks");
const database = require("./utils/database");
const middleware = require("./utils/middleware");
const app = express();

database();

app.use(express.json());
app.use(middleware.requestLogger);

app.use("/api/tasks", taskRouter);

app.use(middleware.unknownEndpoint);
app.use(middleware.errorHandler);

module.exports = app;
