const taskRouter = require("express").Router();
const Task = require("../models/task");

taskRouter.get("/", (request, response, next) =>
  Task.find({})
    .then((tasks) => response.json(tasks))
    .catch((error) => next(error))
);

taskRouter.post("/", (request, response, next) => {
  const { title, description } = request.body;
  const task = new Task({
    title,
    description,
  });

  task
    .save()
    .then((savedTask) => response.json(savedTask))
    .catch((error) => next(error));
});

taskRouter.get("/:id", (request, response, next) => {
  Task.findById(request.params.id)
    .then((task) => {
      if (task) {
        response.json(task);
      } else {
        response.status(404).end();
      }
    })
    .catch((error) => next(error));
});

taskRouter.delete("/:id", (request, response, next) => {
  Task.findByIdAndRemove(request.params.id)
    .then(() => response.status(204).end())
    .catch((error) => next(error));
});

taskRouter.put("/:id", (request, response, next) => {
  const { title, description } = request.body;
  const updatedTask = { title, description };
  Task.findByIdAndUpdate(request.params.id, updatedTask, { new: true })
    .then((savedUpdate) => response.json(savedUpdate))
    .catch((error) => next(error));
});

module.exports = taskRouter;
