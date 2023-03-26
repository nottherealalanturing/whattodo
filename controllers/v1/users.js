const usersRouter = require("express").Router();
const { User, FriendRequest } = require("../../models/v1");
const { generateToken, passport } = require("../../utils/auth");

usersRouter.post("/signup", async (request, response) => {
  const { email, name, password } = request.body;

  const userExists = await User.findOne({ email });

  if (userExists)
    return response.status(400).json({ message: "Email already in use" });

  const user = new User({ name, email, password });

  await user.save();

  const token = generateToken(savedUser);

  return response.json({
    message: "User registered successfully.",
    token: token.token,
    expiresIn: token.expires,
    user,
  });
});

usersRouter.post("/signin", async (request, response) => {
  const { email, password } = request.body;
  const user = await User.findOne({ email });

  if (!user)
    return response.status(401).json({ message: "Invalid email or password" });

  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    return response.status(401).json({ message: "Invalid email or password" });
  }

  const token = generateToken(user);
  return response.status(200).json({
    success: "User signed in succesfully.",
    token: token.token,
    expiresIn: token.expires,
  });
});

usersRouter.post(
  "/friends",
  passport.authenticate("jwt", { session: false }),
  async (request, response, next) => {
    const { friendId } = request.body;
    const user = await User.findById(request.user.id);
    const friend = await User.findById(friendId);

    if (!friend) {
      return response.status(404).json({ message: "Friend not found" });
    }

    const existingRequest = user.friendRequests.find(
      (request) => request.user.toString() === friendId
    );

    if (existingRequest) {
      if (existingRequest.status === "pending") {
        return response
          .status(400)
          .json({ message: "Friend request already sent" });
      } else {
        return response.status(400).json({ message: "Friend already added" });
      }
    }

    const newRequest = { user: friendId, status: "pending" };
    user.friendRequests.push(newRequest);
    //friend.friendRequests.push(newRequest);
    await user.save();
    //await friend.save();

    response.json({ message: "Friend request sent" });
  }
);

usersRouter.post(
  "/remove-friend",
  passport.authenticate("jwt", { session: false }),
  async (request, response, next) => {
    const { friendId } = request.body;
    request.user.friends.pull(friendId);
    await request.user.save();
    response.json(request.user.friends);
  }
);

usersRouter.post(
  "/friends/accept",
  authMiddleware,
  async (request, response) => {
    const { friendId } = request.body;

    const friendRequest = await FriendRequest.findOne({ _id: friendId });
    if (!friendRequest) {
      return response.status(404).json({ message: "Friend request not found" });
    }

    if (!friendRequest.recipient.equals(request.user._id)) {
      return response.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findByIdAndUpdate(
      request.user._id,
      { $push: { friends: friendRequest.sender } },
      { new: true }
    );

    await friendRequest.remove();

    response.status(200).json({ message: "Friend added successfully", user });
  }
);

usersRouter.post(
  "/friends/reject",
  authMiddleware,
  async (request, response) => {
    const { requestId } = request.body;

    const friendRequest = await FriendRequest.findById(requestId);

    if (!friendRequest) {
      return response.status(404).json({ error: "Friend request not found" });
    }

    if (friendRequest.recipient.toString() !== request.user.id) {
      return response.status(401).json({ error: "Unauthorized" });
    }

    await friendRequest.remove();

    response.json({ message: "Friend request rejected" });
  }
);

usersRouter.delete(
  "/friends/:userId",
  authMiddleware,
  async (request, response) => {
    const { userId } = request.params;
    const { user } = request;

    const friendIndex = user.friends.findIndex(
      (friend) => friend.toString() === userId
    );

    if (friendIndex === -1) {
      return response.status(404).json({ error: "Friend not found" });
    }

    user.friends.splice(friendIndex, 1);
    await user.save();

    const friend = await User.findById(userId);

    if (!friend) {
      return response.status(404).json({ error: "Friend not found" });
    }

    const userIndex = friend.friends.findIndex((f) => f.toString() === user.id);

    if (userIndex !== -1) {
      friend.friends.splice(userIndex, 1);
      await friend.save();
    }

    response.json({ message: "User unfriended successfully" });
  }
);

usersRouter.get(
  "/me",
  passport.authenticate("jwt", { session: false }),
  (request, response) => {
    response.json({
      user: request.user,
    });
  }
);

module.exports = usersRouter;
