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
    groupsAddedTo: user.groupsAddedTo
  })
})

groupRouter.post('/', authMiddleware, async (request, response) => {
  const user = request.user
  const { title, description } = request.body
  const group = new Group({ title, description, owner: user._id })
  await group.save()
  user.groupsCreated.push(group)
  user.save()
  response.json(group)
})

groupRouter.get('/:groupId', authMiddleware, async (request, response) => {
  const user = request.user
  const group = await Group.findById(request.params.groupId).populate({
    path: 'members',
    select: '_id name email'
  })
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
  if (group.owner.toString() !== user._id.toString()) {
    return response.status(403).json({ error: 'Unauthorized' })
  }
  const { title, description } = request.body
  group.title = title
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
  if (group.owner.toString() !== user._id.toString()) {
    return response.status(403).json({ error: 'Unauthorized' })
  }

  await User.updateMany(
    { groups: group._id },
    { $pull: { groups: group._id } }
  )

  user.groupsCreated.pull(group.id)
  user.save()

  await User.updateMany(
    { _id: { $in: group.members } },
    { $pull: { groupsAddedTo: group._id } }
  )

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

    const user = await User.findById(memberId)
    if (!user) {
      return response.status(404).json({ error: 'User not found' })
    }

    user.groupsAddedTo.push(group)
    user.save()

    group.members.push(user)
    await group.save()

    return response
      .status(200)
      .json({ message: 'User has been added to the group succefully.' })
  }
)

groupRouter.put(
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

    const member = await User.findById(memberId)
    if (!member) {
      return response.status(404).json({ error: 'User not found' })
    }

    const isMember = group.members.some((member) => member.id === memberId)
    if (!isMember) {
      return response
        .status(400)
        .json({ error: 'User isn\'t a member of this group' })
    }

    member.groupsAddedTo.pull(group)
    member.save()

    group.members.pull(member)
    await group.save()

    return response
      .status(200)
      .json({ message: 'User has been removed from the group' })
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
