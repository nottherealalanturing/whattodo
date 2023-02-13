const express = require("express");
const database = require("./database");
const app = express();

database();

app.use(express.json());
app.use(middleware.requestLogger);

app.use(middleware.unknownEndpoint);
app.use(middleware.errorHandler);

module.exports = app;
