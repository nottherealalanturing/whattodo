const repl = require('repl');

const epa = require('epa');
const { Comment, FriendRequest, Group, Task, User } = require('./models/v1');
const mongoose = require('mongoose');
const logger = require('./utils/logger');
const config = require('./utils/config');

mongoose.set('strictQuery', false);
logger.info('connecting to database');

mongoose
  .connect(config.MONGODB_URI())
  .then(() => {
    logger.info('connected to MongoDB');
    const replServer = repl.start({});

    // attach modules to the repl context
    replServer.context.epa = epa;
    replServer.context.Comment = Comment;
    replServer.context.FriendRequest = FriendRequest;
    replServer.context.Group = Group;
    replServer.context.Task = Task;
    replServer.context.User = User;
  })
  .catch((error) => console.log('error connecting to mongoDB:', error.message));
