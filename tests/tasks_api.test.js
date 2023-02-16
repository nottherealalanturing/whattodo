const supertest = require("supertest");
const mongoose = require("mongoose");
const helper = require("./test_helper");
const app = require("../app");
const api = supertest(app);

const Task = require("../models/task");

beforeEach(async () => {
  await Task.deleteMany({});
  await Task.insertMany(helper.initialTasks);
});

describe("when there is initially some tasks saved", () => {
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

    const titles = response.body.map((r) => r.title);

    expect(titles).toContain("Browser can execute only JavaScript");
  });
});

describe("viewing a specific task", () => {
  test("succeeds with a valid id", async () => {
    const tasksAtStart = await helper.tasksInDb();

    const taskToView = tasksAtStart[0];

    const resultTask = await api
      .get(`/api/tasks/${taskToView.id}`)
      .expect(200)
      .expect("Content-Type", /application\/json/);

    expect(resultTask.body).toEqual(taskToView);
  });

  test("fails with statuscode 404 if task does not exist", async () => {
    const validNonexistingId = await helper.nonExistingId();

    await api.get(`/api/tasks/${validNonexistingId}`).expect(404);
  });

  test("fails with statuscode 400 if id is invalid", async () => {
    const invalidId = "5a3d5da59070081a82a3445";

    await api.get(`/api/tasks/${invalidId}`).expect(400);
  });
});

describe("addition of a new task", () => {
  test("succeeds with valid data", async () => {
    const newTask = {
      title: "async/await simplifies making async calls",
      important: true,
    };

    await api
      .post("/api/tasks")
      .send(newTask)
      .expect(201)
      .expect("Content-Type", /application\/json/);

    const tasksAtEnd = await helper.tasksInDb();
    expect(tasksAtEnd).toHaveLength(helper.initialTasks.length + 1);

    const titles = tasksAtEnd.map((n) => n.title);
    expect(titles).toContain("async/await simplifies making async calls");
  });

  test("fails with status code 400 if data invalid", async () => {
    const newTask = {
      important: true,
    };

    await api.post("/api/tasks").send(newTask).expect(400);

    const tasksAtEnd = await helper.tasksInDb();

    expect(tasksAtEnd).toHaveLength(helper.initialTasks.length);
  });
});

describe("deletion of a task", () => {
  test("succeeds with status code 204 if id is valid", async () => {
    const tasksAtStart = await helper.tasksInDb();
    const taskToDelete = tasksAtStart[0];

    await api.delete(`/api/tasks/${taskToDelete.id}`).expect(204);

    const tasksAtEnd = await helper.tasksInDb();

    expect(tasksAtEnd).toHaveLength(helper.initialTasks.length - 1);

    const titles = tasksAtEnd.map((r) => r.title);

    expect(titles).not.toContain(taskToDelete.title);
  });
});

afterAll(async () => {
  await mongoose.connection.close();
});
