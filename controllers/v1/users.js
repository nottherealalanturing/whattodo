const usersRouter = require('express').Router()
const { User, FriendRequest } = require('../../models/v1')
const generateToken = require('../../utils/generateToken')
const { authMiddleware } = require('../../utils/middleware')

usersRouter.post('/signup', async (request, response) => {
  const { email, name, password, username } = request.body

  const userExists = await User.findOne({ email })

  if (userExists) {
    return response.status(400).json({ message: 'Email already in use' })
  }

  const user = new User({ name, email, password, username })

  await user.save()

  const signedToken = generateToken(user)

  return response.status(201).json({
    message: 'User registered successfully.',
    token: signedToken.token,
    expiresIn: signedToken.expires,
    user
  })
})

usersRouter.post('/signin', async (request, response) => {
  const { email, password } = request.body
  const user = await User.findOne({ email })

  if (!user) {
    return response.status(401).json({ message: 'Invalid email or password' })
  }

  const isMatch = await user.comparePassword(password)

  if (!isMatch) {
    return response.status(401).json({ message: 'Invalid email or password' })
  }

  const token = generateToken(user)
  return response.status(200).json({
    success: 'User signed in succesfully.',
    token: token.token,
    expiresIn: token.expires
  })
})

usersRouter.post(
  '/friends',
  authMiddleware,
  async (request, response, next) => {
    const { recipient } = request.body
    const requester = request.user.id

    const foundRequester = await User.findById(requester).populate('friends')
    const foundRecipient = await User.findById(recipient)

    if (!foundRequester || !foundRecipient) {
      return response.status(404).json({ message: 'User not found' })
    }

    const existingRequest = await FriendRequest.findOne({
      requester,
      recipient,
      status: 'pending'
    })

    if (existingRequest) {
      return response
        .status(400)
        .send({ message: 'Friend request already exists' })
    }

    const areFriends = foundRequester.friends.some((friend) =>
      friend._id.equals(recipient)
    )

    if (areFriends) {
      return response
        .status(400)
        .send({ message: 'You\'re already friends with user' })
    }

    const friendRequest = new FriendRequest({ requester, recipient })
    await friendRequest.save()

    await User.findByIdAndUpdate(
      foundRequester,
      { $push: { friendRequests: friendRequest } },
      { new: true }
    )

    await User.findByIdAndUpdate(
      foundRecipient,
      { $push: { friendRequests: friendRequest } },
      { new: true }
    )

    return response.status(201).json({ message: 'Friend request sent' })
  }
)

usersRouter.delete(
  '/friends',
  authMiddleware,
  async (request, response, next) => {
    const { friendId } = request.body
    const friend = await User.findById(friendId)
    const user = request.user

    if (!friend) {
      return response.status(404).json({ message: 'Friend not found' })
    }

    const areFriends = user.friends.some((friend) =>
      friend._id.equals(friendId)
    )

    if (!areFriends) {
      return response
        .status(400)
        .send({ message: 'You aren\'t friends with the user' })
    }

    user.friends.pull(friendId)
    await user.save()

    friend.friends.pull(user.id)
    await friend.save()

    response.json({ message: 'unfriended succesfully', friend })
  }
)

usersRouter.put('/friends', authMiddleware, async (request, response) => {
  const { status, friendRequestId } = request.body

  const friendRequest = await FriendRequest.findByIdAndUpdate(
    friendRequestId,
    { status },
    { new: true }
  )

  if (!friendRequest) {
    return response.status(404).json({ message: 'Friend Request not found' })
  }

  if (
    friendRequest.requester.toString() === request.user.id.toString() &&
    status === 'REJECTED'
  ) {
    await User.findByIdAndUpdate(friendRequest.requester._id, {
      $pull: { friendRequests: friendRequestId }
    })
      .populate({ path: 'friendRequests' })
      .exec()

    await User.findByIdAndUpdate(friendRequest.recipient, {
      $pull: { friendRequests: friendRequestId }
    })
      .populate({ path: 'friendRequests' })
      .exec()

    await FriendRequest.findByIdAndDelete(friendRequestId)
    return response
      .status(401)
      .json({ message: 'Friend requested cancelled.' })
  }

  if (friendRequest.recipient.toString() !== request.user.id.toString()) {
    return response.status(401).json({ error: 'Unauthorized' })
  }

  if (status === 'ACCEPTED') {
    await User.findByIdAndUpdate(friendRequest.requester, {
      $addToSet: { friends: friendRequest.recipient }
    })
    await User.findByIdAndUpdate(friendRequest.recipient, {
      $addToSet: { friends: friendRequest.requester }
    })
  }

  await User.findByIdAndUpdate(friendRequest.requester._id, {
    $pull: { friendRequests: friendRequestId }
  })
    .populate({ path: 'friendRequests' })
    .exec()

  await User.findByIdAndUpdate(friendRequest.recipient, {
    $pull: { friendRequests: friendRequestId }
  })
    .populate({ path: 'friendRequests' })
    .exec()

  await FriendRequest.findByIdAndDelete(friendRequestId)

  response.json({ message: 'Friend request updated successfully' })
})

usersRouter.get('/me', authMiddleware, (request, response) => {
  response.json({
    user: request.user
  })
})

usersRouter.get('/friendrequest', authMiddleware, async (request, response) => {
  const populatedUser = await User.findById(request.user.id)
    .populate({ path: 'friendRequests' })
    .exec()

  response.json({
    user: populatedUser.friendRequests
  })
})

module.exports = usersRouter
