const mongoose = require("mongoose");
const validator = require("validator");

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    unique: true,
    validate: (value) => validator.isAlpha(value),
  },
  description: {
    type: String,
    required: true,
    unique: true,
    validate: (value) => validator.isAlpha(value),
  },
});

module.exports = mongoose.model("Task", taskSchema);
