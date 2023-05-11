const _ = require("lodash");
const { Note } = require("../models/note");
const {
  addOrMergeArrayElements,
  catchError,
  renameObjectKey,
} = require("../utils");

const mergeNote = async (next, sourceUserId, destinationUserId) => {
  catchError(next, async () => {
    let noteOfSourceUser = await Note.findById(sourceUserId);
    if (!noteOfSourceUser) {
      return {
        success: true,
        message: "No document to merge",
      };
    } else if (noteOfSourceUser.itemList.length === 0) {
      await Note.findByIdAndDelete(sourceUserId);
      return {
        success: true,
        message: "No itemList to merge",
      };
    }

    let noteOfDestinationUser = await Note.findById(destinationUserId);
    if (!noteOfDestinationUser) {
      newUserNote = new Note({
        _id: destinationUserId,
        itemList: [...noteOfSourceUser.itemList],
      });
      await newUserNote.save();
      await Note.findByIdAndDelete(sourceUserId);

      return {
        success: true,
      };
    }

    noteOfDestinationUser = _.extend(noteOfDestinationUser, {
      itemList: addOrMergeArrayElements(
        noteOfDestinationUser.itemList,
        noteOfSourceUser.itemList,
        "_id"
      ),
    });
    await noteOfDestinationUser.save();
    await Note.findByIdAndDelete(sourceUserId);

    return {
      success: true,
    };
  });
};

const updateNote = async (req, res, next, sendResponse = true) => {
  catchError(next, async () => {
    const { userId } = req;
    if (req.body.data?.notes) data = req.body.data.notes;
    else data = req.body.data.note;
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
  mergeNote,
  updateNote,
};
