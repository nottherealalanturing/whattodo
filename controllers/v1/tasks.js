const taskRouter = require("express").Router();
const { Task, Group, User } = require("../../models/v1");
const { authMiddleware } = require("../../utils/middleware");

taskRouter.post("/", authMiddleware, async (request, response) => {
  const { title, description, groupId, assignedUsers, dueDate } = request.body;

  const group = await Group.findById(groupId);
  if (!group) {
    return response.status(404).json({ error: "Group not found" });
  }

  if (group.owner.toString() !== user._id.toString()) {
    return response.status(403).json({ error: "Action isn't authorized" });
  }

  const task = new Task({
    title,
    description,
    dueDate,
    group: groupId,
    owner: request.user.id,
    assignedUsers,
  });

  await task.save();

  return response.status(201).json(task);
});

taskRouter.get("/:groupId", authMiddleware, async (req, res) => {
  const { groupId } = req.params;

  const group = await Group.findById(groupId).populate("tasks");
  if (!group) {
    return res.status(404).json({ error: "Group not found" });
  }

  if (!group.users.includes(req.user.id))
    return res.status(403).json({ error: "User is not a member of the group" });

  /* const tasks = await Task.find({ group: groupId }).populate(
    "owner assignedUsers",
    "name email"
  ); */

  return res.status(200).json(group.tasks);
});

taskRouter.get("/:taskId", authMiddleware, async (req, res) => {
  const { taskId } = req.params;

  const task = await Task.findById(taskId);
  if (!task) {
    return res.status(404).json({ error: "Task not found" });
  }

  const group = await Group.findById(task.group);
  if (!group) {
    return res.status(404).json({ error: "Group not found" });
  }

  if (!group.users.includes(req.user.id)) {
    return res.status(403).json({ error: "User is not a member of the group" });
  }

  return res.status(200).json(task);
});

taskRouter.patch("/:taskId", authMiddleware, async (req, res) => {
  const { title, description, assignedUsers } = req.body;
  const { taskId } = req.params;

  const task = await Task.findById(taskId);
  if (!task) {
    return res.status(404).json({ error: "Task not found" });
  }

  const group = await Group.findById(task.group);
  if (!group) {
    return res.status(404).json({ error: "Group not found" });
  }

  if (!group.users.includes(req.user.id)) {
    return res.status(403).json({ error: "User is not a member of the group" });
  }

  if (task.owner.toString() !== req.user.id) {
    return res.status(403).json({ error: "User is not the owner of the task" });
  }

  task.title = title || task.title;
  task.description = description || task.description;
  task.assignedUsers.push(assignedUsers);

  await task.save();

  return res.status(200).json(task);
});

taskRouter.delete("/:taskId", authMiddleware, async (req, res) => {
  const { taskId } = req.params;
  const task = await Task.findById(taskId);
  if (!task) {
    return res.status(404).json({ error: "Task not found" });
  }

  const group = await Group.findById(task.group);
  if (!group) {
    return res.status(404).json({ error: "Group not found" });
  }

  if (!group.users.includes(req.user.id)) {
    return res.status(403).json({ error: "User is not a member of the group" });
  }

  if (task.owner.toString() !== req.user.id) {
    return res.status(403).json({ error: "User is not the owner of the task" });
  }

  await task.remove();
  return res.status(200).json({ message: "Task deleted successfully" });
});

module.exports = taskRouter;
