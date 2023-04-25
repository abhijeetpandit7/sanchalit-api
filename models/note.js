const mongoose = require("mongoose");

const noteSchema = mongoose.Schema({
  _id: {
    type: String,
    required: true,
  },
  body: { type: String, required: true },
  createdDate: { type: Date },
  deleted: { type: Boolean },
  updatedDate: { type: Date },
});

const userNoteSchema = mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  itemList: [noteSchema],
});

const Note = mongoose.model("Note", userNoteSchema);

module.exports = { Note };
