const usersRouter = require("express").Router();
const { User } = require("../../models/v1");
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
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user)
    return res.status(401).json({ message: "Invalid email or password" });

  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const token = generateToken(user);
  return res.status(200).json({
    success: "User signed in succesfully.",
    token: token.token,
    expiresIn: token.expires,
  });
});

usersRouter.get(
  "/me",
  passport.authenticate("jwt", { session: false }),
  (request, response) => {
    res.json({
      user: request.user,
    });
  }
);

module.exports = usersRouter;
