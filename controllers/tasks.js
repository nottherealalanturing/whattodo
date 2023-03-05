const taskRouter = require("express").Router();
const Task = require("../models/task");
const User = require("../models/user");
require("express-async-errors");

taskRouter.get("/", async (request, response) => {
  const tasks = await Task.find({}).populate("user", { username: 1, name: 1 });
  response.json(tasks);
});

taskRouter.post("/", async (request, response, next) => {
  const { title, description, userId } = request.body;
  const user = await User.findById(userId);
  const task = new Task({
    title,
    description,
    id: user.id,
  });

  const savedTask = await task.save();
  user.tasks = user.tasks.concat(savedTask._id);
  await user.save();
  response.status(201).json(savedTask);
});

taskRouter.get("/:id", async (request, response, next) => {
  const task = await Task.findById(request.params.id);
  if (task) {
    response.json(task);
  } else {
    response.status(404).end();
  }
});

taskRouter.delete("/:id", async (request, response, next) => {
  await Task.findByIdAndRemove(request.params.id);
  response.status(204).end();
});

taskRouter.put("/:id", async (request, response, next) => {
  const { title, description } = request.body;
  const updatedTask = { title, description };
  const saveUpdate = await Task.findByIdAndUpdate(
    request.params.id,
    updatedTask,
    { new: true }
  );
  response.json(savedUpdate);
});

module.exports = taskRouter;
