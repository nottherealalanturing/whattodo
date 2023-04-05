const usersRouter = require('express').Router();
const passport = require('passport');
const { User, FriendRequest } = require('../../models/v1');
const generateToken = require('../../utils/generateToken');
const { authMiddleware } = require('../../utils/middleware');

usersRouter.post('/signup', async (request, response) => {
  const { email, name, password, username } = request.body;

  const userExists = await User.findOne({ email });

  if (userExists) {
    return response.status(400).json({ message: 'Email already in use' });
  }

  const user = new User({ name, email, password, username });

  await user.save();

  const signedToken = generateToken(user);

  return response.status(201).json({
    message: 'User registered successfully.',
    token: signedToken.token,
    expiresIn: signedToken.expires,
    user,
  });
});

usersRouter.post('/signin', async (request, response) => {
  const { email, password } = request.body;
  const user = await User.findOne({ email });

  if (!user) {
    return response.status(401).json({ message: 'Invalid email or password' });
  }

  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    return response.status(401).json({ message: 'Invalid email or password' });
  }

  const token = generateToken(user);
  return response.status(200).json({
    success: 'User signed in succesfully.',
    token: token.token,
    expiresIn: token.expires,
  });
});

usersRouter.post(
  '/friends',
  passport.authenticate('jwt', { session: false }),
  async (request, response, next) => {
    const { recipient } = request.body;
    const requester = request.user.id;

    const foundRequester = await User.findById(requester);
    const foundRecipient = await User.findById(recipient);

    if (!foundRequester || !foundRecipient) {
      return response.status(404).json({ message: 'User not found' });
    }

    const existingRequest = await FriendRequest.findOne({
      requester,
      recipient,
      status: 'pending',
    });

    if (existingRequest) {
      return response.status(400).send('Friend request already exists');
    }

    if (existingRequest) {
      return response
        .status(400)
        .json({ message: 'Friend request already exists' });
    }

    const friendRequest = new FriendRequest({ requester, recipient });
    await friendRequest.save();

    await User.findByIdAndUpdate(
      foundRequester,
      { $push: { friendRequests: friendRequest } },
      { new: true }
    );

    await User.findByIdAndUpdate(
      foundRecipient,
      { $push: { friendRequests: friendRequest } },
      { new: true }
    );

    return response.status(201).json({ message: 'Friend request sent' });
  }
);

usersRouter.delete(
  '/friend',
  passport.authenticate('jwt', { session: false }),
  async (request, response, next) => {
    const { friendId } = request.body;
    request.user.friends.pull(friendId);
    await request.user.save();
    response.json(request.user.friends);
  }
);

usersRouter.post(
  '/friends/accept',
  authMiddleware,
  async (request, response) => {
    const { friendId } = request.body;

    const friendRequest = await FriendRequest.findOne({ _id: friendId });
    if (!friendRequest) {
      return response.status(404).json({ message: 'Friend request not found' });
    }

    if (!friendRequest.recipient.equals(request.user._id)) {
      return response.status(401).json({ message: 'Unauthorized' });
    }

    const user = await User.findByIdAndUpdate(
      request.user._id,
      { $push: { friends: friendRequest.sender } },
      { new: true }
    );

    await friendRequest.remove();

    response.status(200).json({ message: 'Friend added successfully', user });
  }
);

usersRouter.post(
  '/friends/reject',
  authMiddleware,
  async (request, response) => {
    const { requestId } = request.body;

    const friendRequest = await FriendRequest.findById(requestId);

    if (!friendRequest) {
      return response.status(404).json({ error: 'Friend request not found' });
    }

    if (friendRequest.recipient.toString() !== request.user.id) {
      return response.status(401).json({ error: 'Unauthorized' });
    }

    await friendRequest.remove();

    response.json({ message: 'Friend request rejected' });
  }
);

usersRouter.delete(
  '/friends/:userId',
  authMiddleware,
  async (request, response) => {
    const { userId } = request.params;
    const { user } = request;

    const friendIndex = user.friends.findIndex(
      (friend) => friend.toString() === userId
    );

    if (friendIndex === -1) {
      return response.status(404).json({ error: 'Friend not found' });
    }

    user.friends.splice(friendIndex, 1);
    await user.save();

    const friend = await User.findById(userId);

    if (!friend) {
      return response.status(404).json({ error: 'Friend not found' });
    }

    const userIndex = friend.friends.findIndex((f) => f.toString() === user.id);

    if (userIndex !== -1) {
      friend.friends.splice(userIndex, 1);
      await friend.save();
    }

    response.json({ message: 'User unfriended successfully' });
  }
);

usersRouter.get(
  '/me',
  passport.authenticate('jwt', { session: false }),
  (request, response) => {
    response.json({
      user: request.user,
    });
  }
);

async function checkFriendRequest(user, friend) {
  const populatedUser = await User.findById(user).populate(
    'friendRequests.user'
  );

  const friendRequest = populatedUser.friendRequests.find((request) => {
    return (
      request.recipient._id.toString() === friend &&
      request.status === 'pending'
    );
  });

  // return true if there is a pending friend request, false otherwise
  return !!friendRequest;
}

module.exports = usersRouter;
