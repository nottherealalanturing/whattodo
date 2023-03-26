const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 255,
  },
  description: {
    type: String,
    required: false,
    trim: true,
    maxlength: 1024,
  },
  dueDate: {
    type: Date,
    required: false,
  },
  priority: {
    type: Number,
    default: 1,
  },
  completed: {
    type: Boolean,
    default: false,
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Group",
  },
  assignedTo: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
});

const Task = mongoose.model("Task", taskSchema);

module.exports = Task;