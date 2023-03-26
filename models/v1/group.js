const mongoose = require("mongoose");

const groupSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 255,
  },
  description: {
    type: String,
    trim: true,
    minlength: 3,
    maxlength: 255,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  members: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
});

const Group = mongoose.model("Group", groupSchema);

module.exports = Group;
