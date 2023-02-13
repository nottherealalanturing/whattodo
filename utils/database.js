const mongoose = require("mongoose");
const logger = require("./logger");
const config = require("./config");

mongoose.set("strictQuery", false);
logger.info("connecting to database");

module.exports = () => {
  mongoose
    .connect(config.MONGODB_URI())
    .then(() => logger.info("connected to MongoDB"))
    .catch((error) =>
      logger.error("error connecting to mongoDB:", error.message)
    );
};
