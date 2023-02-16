const Task = require("../models/task");

const initialTasks = [
  { title: "Action", description: "Watch Indiana Jonnes" },
  { title: "Romance", description: "Watch Alex and Emma" },
];

const nonExistingId = async () => {
  const task = new Task({ description: "willremovethissoon" });
  await task.save();
  await task.remove();

  return task._id.toString();
};

const tasksInDb = async () => {
  const tasks = await Task.find({});
  return tasks.map((task) => task.toJSON());
};

module.exports = {
  initialTasks,
  nonExistingId,
  tasksInDb,
};
