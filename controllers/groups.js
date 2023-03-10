const jwt = require("jsonwebtoken");
const groupRouter = require("express").Router();
const Group = require("../models/group");
const User = require("../models/user");
require("express-async-errors");

const getTokenFrom = (request) => {
  const authorization = request.get("authorization");
  if (authorization && authorization.startsWith("Bearer "))
    return authorization.replace("Bearer ", "");
  return null;
};

const currentUser = async (request) => {
  const decodedToken = jwt.verify(getTokenFrom(request), process.env.SECRET);

  if (!decodedToken.id)
    return response.status(401).json({ error: "token invalid" });

  return await User.findById(decodedToken.id);
};

const adminOnly = async (req) => {
  if (req.user.user_type_id === 2) {
    return res.status(401).send("Access Denied");
  }
};

groupRouter.get("/", async (request, response) => {
  const decodedToken = jwt.verify(getTokenFrom(request), process.env.SECRET);
  if (!decodedToken.id)
    return response.status(401).json({ error: "token invalid" });

  const user = await User.findById(decodedToken.id).populate({
    path: "groups",
    model: "Group",
  });

  if (user) {
    response.json(user);
  }
});

groupRouter.post("/", async (request, response, next) => {
  const { title, description, shared } = request.body;

  const decodedToken = jwt.verify(getTokenFrom(request), process.env.SECRET);

  if (!decodedToken.id)
    return response.status(401).json({ error: "token invalid" });

  const user = await User.findById(decodedToken.id);

  const group = new Group({
    title,
    description,
    shared,
    owner: user,
  });

  const savedGroup = await group.save();
  user.groups = user.groups.concat(savedGroup._id);
  await user.save();
  response.status(201).json(savedGroup);
});

groupRouter.get("/:id", async (request, response, next) => {
  const user = currentUser(request);

  let canView =
    user.groups.find((g) => g.id === request.params.id) ||
    user.foreignGroups.find((g) => g.id === request.params.id);

  if (canView) {
    const group = await Group.findById(request.params.id).populate([
      { path: "tasks", model: "Task" },
      { path: "owner", model: "User" },
      { path: "members", model: "User" },
    ]);
    if (group) {
      response.json(group);
    } else {
      response.status(404).end();
    }
  } else {
    response.status(404).end();
  }
});

groupRouter.delete("/:id", async (request, response, next) => {
  const user = currentUser(request);

  let canDelete = user.groups.find((g) => g.id === request.params.id);

  if (canDelete.owner.id === user.id) {
    await Group.findByIdAndRemove(request.params.id);
    response.status(204).end();
  }
});

groupRouter.put("/:id", async (request, response, next) => {
  const { title, description, shared } = request.body;
  const updatedGroup = { title, description, shared };
  const user = currentUser(request);

  let canUpdate = user.groups.find((g) => g.id === request.params.id);

  if (canUpdate.owner.id === user.id) {
    const saveUpdate = await Group.findByIdAndUpdate(
      request.params.id,
      updatedGroup,
      { new: true }
    );
    response.json(savedUpdate);
  }
});

module.exports = groupRouter;
