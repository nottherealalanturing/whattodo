const mongoose = require("mongoose");
const supertest = require("supertest");
const app = require("../app");
const helper = require("./test_helper");
const Task = require("../models/task");

const api = supertest(app);

jest.setTimeout(100000);

beforeEach(async () => {
  await Task.deleteMany({});

  let taskItem = new Task(helper.initialTasks[0]);
  await taskItem.save();

  taskItem = new Task(helper.initialTasks[1]);
  await taskItem.save();
});

test("tasks are returned as json", async () => {
  await api
    .get("/api/tasks")
    .expect(200)
    .expect("Content-Type", /application\/json/);
});

test("all tasks are returned", async () => {
  const response = await api.get("/api/tasks");

  expect(response.body).toHaveLength(helper.initialTasks.length);
});

test("a specific task is within the returned tasks", async () => {
  const response = await api.get("/api/tasks");

  const contents = response.body.map((r) => r.description);
  expect(contents).toContain("Watch Alex and Emma");
});

test("a valid task can be added ", async () => {
  const newTask = {
    title: "Crime",
    description: "Watch gangs of new york",
  };

  await api
    .post("/api/tasks")
    .send(newTask)
    .expect(201)
    .expect("Content-Type", /application\/json/);

  const tasksAtEnd = await helper.tasksInDb();
  expect(tasksAtEnd).toHaveLength(helper.initialTasks.length + 1);

  const titles = tasksAtEnd.map((r) => r.title);
  expect(titles).toContain("Crime");
});

test("tasks without a description will not be added", async () => {
  const newInvalidTask = { title: "Drama" };

  api.post("/api/tasks").send(newInvalidTask).expect(400);

  const tasksAtEnd = await helper.tasksInDb();

  expect(tasksAtEnd).toHaveLength(helper.initialTasks.length);
});

test("a specific task can be viewed", async () => {
  const tasksAtStart = await helper.tasksInDb();
  const taskToView = tasksAtStart[0];
  console.log(taskToView[id], "----------------------this -----------------");
  const resultTask = api
    .get(`/api/tasks/${taskToView.id}`)
    .expect(200)
    .expect("Content-Type", /application\/json/);

  expect(resultTask.body).toEqual(taskToView);
});

test("a task can be deleted", async () => {
  const tasksAtStart = await helper.tasksInDb();
  const taskToDelete = tasksAtStart[0];

  await api.delete(`/api/tasks/${taskToDelete.id}`).status(204);

  const tasksAtEnd = await helper.tasksInDb();
  expect(tasksAtEnd).toHaveLength(helper.initialTasks.length - 1);

  const titles = tasksAtEnd.map((task) => task.title);

  expect(titles).not.toContain(taskToDelete.title);
});

afterAll(async () => {
  await mongoose.connection.close();
});
