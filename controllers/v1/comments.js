const { Task, Comment } = require('../../models/v1/index')
const commentsRouter = require('express').Router()
const { authMiddleware } = require('../../utils/middleware')

commentsRouter.post('/', authMiddleware, async (req, res) => {
  const { text, taskId } = req.body
  const currentUser = req.user

  const task = await Task.findOne({ _id: taskId })

  if (!task) {
    return res.status(404).json({ message: 'Task not found' })
  }

  if (
    !(
      task.assignedUsers.includes(currentUser.id) ||
      task.creator._id.toString() === currentUser._id.toString()
    )
  ) {
    return res
      .status(403)
      .json({ error: 'User is not assigned to this task.' })
  }

  const comment = new Comment({
    comment: text,
    task: task._id,
    author: currentUser._id
  })

  await comment.save()

  task.comments.push(comment)

  await task.save()

  res.status(201).json({ message: 'Comment created successfully', comment })
})

commentsRouter.delete('/', authMiddleware, async (req, res, next) => {
  const { commentId } = req.body
  const currentUser = req.user

  const comment = await Comment.findOne({
    _id: commentId,
    author: req.user._id
  })

  if (!comment) {
    return res.status(404).json({ message: 'Comment not found' })
  }

  const task = await Task.findById(comment.task)

  if (!task) {
    return res.status(404).json({ message: 'Task not found' })
  }

  if (
    !(
      task.assignedUsers.includes(currentUser.id) ||
      task.creator._id.toString() === currentUser._id.toString()
    )
  ) {
    return res
      .status(403)
      .json({ error: 'User is not assigned to this task.' })
  }

  task.comments.pull(comment._id)
  await task.save()
  await comment.remove()

  res.status(200).json({ message: 'Comment deleted successfully' })
})

commentsRouter.get('/', authMiddleware, async (req, res) => {
  const { taskId } = req.body
  const currentUser = req.user

  const task = await Task.findOne({ _id: taskId }).populate('comments')

  if (!task) {
    return res.status(404).json({ message: 'Task not found' })
  }

  if (
    !(
      task.assignedUsers.includes(currentUser.id) ||
      task.creator._id.toString() === currentUser._id.toString()
    )
  ) {
    return res
      .status(403)
      .json({ error: 'User is not assigned to this task.' })
  }

  const comments = await task.comments

  res.json(comments)
})

module.exports = commentsRouter
