const logger = require("./logger.js");

const requestLogger = (request, response, next) => {
  logger.info("Method:", request.method);
  logger.info("path:", request.path);
  logger.info("body:", request.body);
  logger.info("- - -:");
  next();
};

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: "unknown endpoint" });
};

const errorHandler = (error, request, response, next) => {
  response.status(err.statusCode).json({
    msg: err.message,
    success: false,
  });
};

module.exports = {
  requestLogger,
  unknownEndpoint,
  errorHandler,
};
