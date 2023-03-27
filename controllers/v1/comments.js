const Task = require("../models/task");
const Comment = require("../models/comment");

const createComment = async (req, res) => {
  const { taskId } = req.params;
  const { text } = req.body;

  const task = await Task.findOne({ _id: taskId, group: req.group._id });
  if (!task) {
    return res.status(404).json({ message: "Task not found" });
  }

  const comment = new Comment({
    text,
    task: task._id,
    author: req.user._id,
  });
  await comment.save();

  res.status(201).json({ message: "Comment created successfully", comment });
};

const updateComment = async (req, res, next) => {
  const { commentId } = req.params;
  const { text } = req.body;

  const comment = await Comment.findOne({
    _id: commentId,
    task: { $in: req.group.tasks },
    author: req.user._id,
  });
  if (!comment) {
    return res.status(404).json({ message: "Comment not found" });
  }

  comment.text = text;
  await comment.save();

  res.status(200).json({ message: "Comment updated successfully", comment });
};

const deleteComment = async (req, res, next) => {
  const { commentId } = req.params;

  const comment = await Comment.findOne({
    _id: commentId,
    task: { $in: req.group.tasks },
    author: req.user._id,
  });
  if (!comment) {
    return res.status(404).json({ message: "Comment not found" });
  }

  const task = await Task.findById(comment.task);
  task.comments.pull(comment._id);
  await task.save();
  await comment.remove();

  res.status(200).json({ message: "Comment deleted successfully" });
};

const getAllComments = async (req, res) => {
  const task = await Task.findById(req.params.taskId);
  if (!task) {
    return res.status(404).json({ message: "Task not found" });
  }

  if (!task.assignedUsers.includes(req.user._id)) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const comments = await Comment.find({ taskId: req.params.taskId });

  res.json(comments);
};

module.exports = {
  createComment,
  updateComment,
  deleteComment,
  getAllComments,
};
