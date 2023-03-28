const groupRouter = require('express').Router()
const { authMiddleware } = require('../../utils/middleware')
const { User, Group } = require('../../models/v1')

groupRouter.get('/', authMiddleware, async (request, response) => {
  const userId = request.user.id
  const user = await User.findById(userId)
    .populate('groupsCreated')
    .populate('groupsAddedTo')
  response.json({
    groupsCreated: user.groupsCreated,
    groupsAddedTo: user.groupsAddedTo,
    user
  })
})

groupRouter.post('/', authMiddleware, async (request, response) => {
  const user = request.user
  const { title, description } = request.body
  const group = new Group({ title, description, owner: user._id })
  await group.save()
  response.json(group)
})

groupRouter.get('/:groupId', authMiddleware, async (request, response) => {
  const user = request.user
  const group = await Group.findById(request.params.groupId).populate(
    'members'
  )
  if (!group) {
    return response.status(404).json({ error: 'Group not found' })
  }
  if (
    group.owner.toString() !== user._id.toString() &&
    !group.members.includes(user._id)
  ) {
    return response.status(403).json({ error: 'Unauthorized' })
  }
  response.json(group)
})

groupRouter.put('/:groupId', authMiddleware, async (request, response) => {
  const user = request.user
  const group = await Group.findById(request.params.groupId)
  if (!group) {
    return response.status(404).json({ error: 'Group not found' })
  }
  if (group.creator.toString() !== user._id.toString()) {
    return response.status(403).json({ error: 'Unauthorized' })
  }
  const { name, description } = request.body
  group.name = name
  group.description = description
  await group.save()
  response.json(group)
})

groupRouter.delete('/:groupId', authMiddleware, async (request, response) => {
  const user = request.user
  const group = await Group.findById(request.params.groupId)
  if (!group) {
    return response.status(404).json({ error: 'Group not found' })
  }
  if (group.creator.toString() !== user._id.toString()) {
    return response.status(403).json({ error: 'Unauthorized' })
  }
  await group.remove()
  response.json({ message: 'Group deleted successfully' })
})

groupRouter.post(
  '/:groupId/members',
  authMiddleware,
  async (request, response) => {
    const { groupId } = request.params
    const { memberId } = request.body

    const group = await Group.findById(groupId).populate('members')
    if (!group) {
      return response.status(404).json({ error: 'Group not found' })
    }

    const isFriend = request.user.friends.includes(memberId)
    if (!isFriend) {
      return response.status(400).json({ error: 'User is not a friend' })
    }

    const isMember = group.members.some((member) => member.id === memberId)
    if (isMember) {
      return response.status(400).json({ error: 'User is already a member' })
    }

    const member = await User.findById(memberId)
    if (!member) {
      return response.status(404).json({ error: 'User not found' })
    }
    group.members.push(member)
    await group.save()

    return response.status(200).json({ message: 'Member added to group' })
  }
)

groupRouter.delete(
  '/:groupId/members/:memberId',
  authMiddleware,
  async (request, response) => {
    const { groupId, memberId } = request.params

    const group = await Group.findById(groupId).populate('members')
    if (!group) {
      return response.status(404).json({ error: 'Group not found' })
    }
    const isMember = group.members.some(
      (member) => member.id === request.user.id
    )
    if (!isMember) {
      return response
        .status(403)
        .json({ error: 'User is not a member of the group' })
    }

    const member = await User.findById(memberId)
    if (!member) {
      return response.status(404).json({ error: 'User not found' })
    }
    const index = group.members.findIndex((member) => member.id === memberId)
    if (index === -1) {
      return response
        .status(400)
        .json({ error: 'User is not a member of the group' })
    }

    group.members.splice(index, 1)
    await group.save()

    return response.status(200).json({ message: 'Member removed from group' })
  }
)

module.exports = groupRouter
