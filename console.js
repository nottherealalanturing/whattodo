var repl = require("repl");

var epa = require("epa");
var { group, user, task } = require("./models/index");
const mongoose = require("mongoose");
const logger = require("./utils/logger");
const config = require("./utils/config");

mongoose.set("strictQuery", false);
logger.info("connecting to database");

mongoose
  .connect(config.MONGODB_URI())
  .then(() => {
    logger.info("connected to MongoDB");
    var replServer = repl.start({});

    // attach modules to the repl context
    replServer.context.epa = epa;
    replServer.context.Group = group;
    replServer.context.User = user;
    replServer.context.Task = task;
  })
  .catch((error) => console.log("error connecting to mongoDB:", error.message));
