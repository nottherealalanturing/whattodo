const taskRouter = require('express').Router()
const { Task, Group, User } = require('../../models/v1')
const { authMiddleware } = require('../../utils/middleware')

taskRouter.post('/', authMiddleware, async (request, response) => {
  const { title, description, groupId, assignedUsers, dueDate } = request.body
  const currentUser = request.user

  const group = await Group.findById(groupId)
  if (!group) {
    return response.status(404).json({ error: 'Group not found' })
  }

  if (group.owner.toString() !== request.user._id.toString()) {
    return response.status(403).json({ error: 'Action isn\'t authorized' })
  }

  let notAFriend = false
  assignedUsers.forEach(async (user) => {
    if (!currentUser.friends.includes(user) && notAFriend === false) {
      notAFriend = user
    }
  })

  if (notAFriend) {
    const tempUser = await User.findById(notAFriend)
    return response.status(403).json({
      error: `Can't assign task to this user ${tempUser.name}, make sure specified user is in your friendlist and then retry`
    })
  }

  const task = new Task({
    title,
    description,
    dueDate,
    group: groupId,
    creator: currentUser,
    assignedUsers
  })

  await task.save()

  group.tasks.push(task)
  group.save()

  return response.status(201).json(task)
})

taskRouter.get('/', authMiddleware, async (req, res) => {
  const { groupId } = req.body

  const group = await Group.findById(groupId).populate('tasks')

  if (!group) {
    return res.status(404).json({ error: 'Group not found' })
  }

  if (
    !(
      group.members.includes(req.user.id) ||
      group.owner.toString() === req.user._id.toString()
    )
  ) {
    return res.status(403).json({ error: 'User is not a member of the group' })
  }

  return res.status(200).json({ group: group.title, tasks: group.tasks })
})

taskRouter.get('/:taskId', authMiddleware, async (req, res) => {
  const { taskId } = req.params

  const task = await Task.findById(taskId)
  if (!task) {
    return res.status(404).json({ error: 'Task not found' })
  }

  const group = await Group.findById(task.group)
  if (!group) {
    return res.status(404).json({ error: 'Group not found' })
  }
  if (
    !(
      group.members.includes(req.user.id) ||
      group.owner.toString() === req.user._id.toString()
    )
  ) {
    return res.status(403).json({ error: 'User is not a member of the group' })
  }

  return res.status(200).json(task)
})

taskRouter.put('/:taskId', authMiddleware, async (req, res) => {
  const { title, description } = req.body
  const { taskId } = req.params

  const task = await Task.findById(taskId)
  if (!task) {
    return res.status(404).json({ error: 'Task not found' })
  }

  if (task.creator._id.toString() !== req.user.id) {
    return res.status(403).json({ error: 'User is not the owner of the task' })
  }

  task.title = title || task.title
  task.description = description || task.description

  await task.save()

  return res.status(200).json(task)
})

taskRouter.delete('/:taskId', authMiddleware, async (req, res) => {
  const { taskId } = req.params
  const task = await Task.findById(taskId)
  if (!task) {
    return res.status(404).json({ error: 'Task not found' })
  }

  if (task.creator.toString() !== req.user.id) {
    return res.status(403).json({ error: 'User is not the owner of the task' })
  }

  await task.remove()
  return res.status(200).json({ message: 'Task deleted successfully' })
})

taskRouter.post(
  '/:taskId/assignedusers',
  authMiddleware,
  async (request, response) => {
    const { taskId } = request.params
    const { assignee } = request.body
    const currentUser = request.user

    const task = await Task.findById(taskId)

    if (!task) {
      return response.status(404).json({ error: 'Task not found' })
    }

    if (task.creator.toString() !== currentUser.id) {
      return response
        .status(403)
        .json({ error: 'User is not the creator of the task' })
    }

    const assignedUser = await User.findById(assignee)
    if (!assignedUser) {
      return response.status(404).json({ error: 'User not found' })
    }

    if (task.assignedUsers.includes(assignedUser.id)) {
      return response
        .status(404)
        .json({ error: 'User is already assigned to the task' })
    }

    let notAFriend = false
    task.assignedUsers.forEach(async (user) => {
      if (!currentUser.friends.includes(user) && notAFriend === false) {
        notAFriend = user
      }
    })

    if (notAFriend) {
      const tempUser = await User.findById(notAFriend)
      return response.status(403).json({
        error: `Can't assign task to this user ${tempUser.name}, make sure specified user is in your friendlist and then retry`
      })
    }

    task.assignedUsers.push(assignedUser)
    task.save()
    return response
      .status(200)
      .json({ message: 'User has been added to the task succesfully.' })
  }
)

taskRouter.delete(
  '/:taskId/assignedusers',
  authMiddleware,
  async (request, response) => {
    const { taskId } = request.params
    const { assignee } = request.body
    const currentUser = request.user

    const task = await Task.findById(taskId)

    if (!task) {
      return response.status(404).json({ error: 'Task not found' })
    }

    if (task.creator.toString() !== currentUser.id) {
      return response
        .status(403)
        .json({ error: 'User is not the owner of the task' })
    }

    const assignedUser = await User.findById(assignee)
    if (!assignedUser) {
      return response.status(404).json({ error: 'User not found' })
    }

    if (!task.assignedUsers.includes(assignedUser.id)) {
      return response
        .status(404)
        .json({ error: 'User isn\'t assigned to the task' })
    }

    task.assignedUsers.pull(assignedUser)
    task.save()
    return response
      .status(200)
      .json({ message: 'User has been removed from the task succesfully.' })
  }
)

module.exports = taskRouter
