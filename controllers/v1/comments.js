const Task = require("../models/task");
const Comment = require("../models/comment");
const commentsRouter = require("express").Router();
const { authMiddleware } = require("../../utils/middleware");

commentsRouter.post("/", authMiddleware, async (req, res) => {
  //const { taskId } = req.params;
  const { text, taskId } = req.body;

  const task = await Task.findOne({ _id: taskId });

  if (!task) {
    return res.status(404).json({ message: "Task not found" });
  }

  if (
    !task.assignedUsers.includes(req.user.id) ||
    task.owner !== req.user._id.toString()
  ) {
    return res
      .status(403)
      .json({ error: "User is not assigned to this task." });
  }

  const comment = new Comment({
    text,
    task: task._id,
    author: req.user._id,
  });

  await comment.save();

  task.comments.push(comment);

  await task.save();

  res.status(201).json({ message: "Comment created successfully", comment });
});

commentsRouter.delete("/:commentId", authMiddleware, async (req, res, next) => {
  const { commentId } = req.params;

  const task = await Task.findById(comment.task);

  if (!task) {
    return res.status(404).json({ message: "Task not found" });
  }

  if (
    !task.assignedUsers.includes(req.user.id) ||
    task.owner !== req.user._id.toString()
  ) {
    return res
      .status(403)
      .json({ error: "User is not assigned to this task." });
  }

  const comment = await Comment.findOne({
    _id: commentId,
    author: req.user._id,
  });

  if (!comment) {
    return res.status(404).json({ message: "Comment not found" });
  }

  task.comments.pull(comment._id);
  await task.save();
  await comment.remove();

  res.status(200).json({ message: "Comment deleted successfully" });
});

commentsRouter.get("/", authMiddleware, async (req, res) => {
  const { taskId } = req.body;

  const task = await Task.findOne({ _id: taskId });

  if (!task) {
    return res.status(404).json({ message: "Task not found" });
  }

  if (
    !task.assignedUsers.includes(req.user.id) ||
    task.owner !== req.user._id.toString()
  ) {
    return res
      .status(403)
      .json({ error: "User is not assigned to this task." });
  }

  if (!task.assignedUsers.includes(req.user._id)) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const comments = await task.comments;

  res.json(comments);
});

module.exports = commentsRouter;
