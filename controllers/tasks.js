const jwt = require("jsonwebtoken");
const taskRouter = require("express").Router();
const Group = require("../models/group");
const User = require("../models/user");
require("express-async-errors");

const getTokenFrom = (request) => {
  const authorization = request.get("authorization");
  if (authorization && authorization.startsWith("Bearer "))
    return authorization.replace("Bearer ", "");
  return null;
};

const currentUser = async (request) => {
  const decodedToken = jwt.verify(getTokenFrom(request), process.env.SECRET);

  if (!decodedToken.id)
    return response.status(401).json({ error: "token invalid" });

  return await User.findById(decodedToken.id).populate({
    path: "groups",
    model: "Group",
    populate: {
      path: "tasks",
      model: "Task",
    },
  });
};

const adminOnly = async (req) => {
  if (req.user.user_type_id === 2) {
    return res.status(401).send("Access Denied");
  }
};

taskRouter.get("/groups/:group_id/tasks/", async (request, response) => {
  const decodedToken = currentUser(request);

  if (user) {
    response.json(user);
  }
});

taskRouter.post("/groups/:group_id/tasks/", async (request, response, next) => {
  const { title, description, dueDate } = request.body;

  const user = currentUser(request);
  const group = await Group.findById(request.params.group_id);

  const task = new Task({
    title,
    description,
    completed: false,
    dueDate,
    owner: user,
  });

  if (group) {
    await task.save();
    group.tasks.push(task);
    group.save();
    response.status(201).json(task);
  }
});

taskRouter.get(
  "/groups/:group_id/tasks/:task_id",
  async (request, response, next) => {
    const user = currentUser(request);

    let canView = user.groups.find((g) => g.id === request.params.group_id);

    if (canView) {
      const group = await Group.findById(request.params.id).populate([
        { path: "tasks", model: "Task" },
        { path: "owner", model: "User" },
        { path: "members", model: "User" },
      ]);
      if (group) {
        const findtask = group.tasks.find(
          (t) => t.id === request.params.task_id
        );
        if (findtask) response.json(findtask);
      }
    } else {
      response.status(404).end();
    }
  }
);

taskRouter.delete(
  "/groups/:group_id/tasks/:task_id",
  async (request, response, next) => {
    const user = currentUser(request);

    let canDelete = user.groups.find((g) => g.id === request.params.id);

    if (canDelete.owner.id === user.id) {
      await Task.findByIdAndRemove(request.params.task_id);
      response.status(204).end();
    }
  }
);

taskRouter.put("/:id", async (request, response, next) => {
  const { title, description, assignedTo, comments, completed, dueDate } =
    request.body;
  const updatedTask = {
    title,
    description,
    assignedTo,
    comments,
    completed,
    dueDate,
  };
  const user = currentUser(request);

  let canUpdate = user.groups.find((g) => g.id === request.params.id);

  if (canUpdate.owner.id === user.id) {
    const savedUpdate = await Task.findByIdAndUpdate(
      request.params.task_id,
      updatedTask,
      { new: true }
    );
    response.json(savedUpdate);
  }
});

module.exports = taskRouter;
