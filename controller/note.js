const _ = require("lodash");
const { Note } = require("../models/note");
const {
  addOrMergeArrayElements,
  catchError,
  renameObjectKey,
} = require("../utils");

const addNote = async (req, res, next, sendResponse = true) => {
  catchError(next, async () => {
    const { userId } = req;
    if (req.body.data?.notes) data = req.body.data.notes;
    else data = req.body.data;
    const itemListData = _.isArray(data)
      ? data.map((item) => renameObjectKey(item, "id", "_id"))
      : [renameObjectKey(data, "id", "_id")];

    let note = await Note.findById(userId);

    if (!note) {
      const newUserNote = new Note({
        _id: userId,
        itemList: [...itemListData],
      });
      await newUserNote.save();

      if (sendResponse) {
        return res.status(201).json({ success: true });
      } else {
        return newUserNote;
      }
    }

    note = _.extend(note, {
      itemList: addOrMergeArrayElements(note.itemList, itemListData, "_id"),
    });
    await note.save();

    if (sendResponse) {
      return res.json({ success: true });
    } else {
      return note;
    }
  });
};

module.exports = {
  addNote,
};
