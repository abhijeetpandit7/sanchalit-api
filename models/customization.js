const mongoose = require("mongoose");

const customizationSchema = mongoose.Schema(
  {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    bookmarksSettings: {
      iconsOnly: { type: Boolean },
      openInNewTab: { type: Boolean },
      includeOtherBookmarks: { type: Boolean },
      includeBookmarksManager: { type: Boolean },
      includeMostVisited: { type: Boolean },
      defaultMostVisited: { type: Boolean },
      appsLocation: {
        type: String,
        trim: true,
        enum: ["Bookmarks", "Dash", "None"],
      },
      homeTabLocation: {
        type: String,
        trim: true,
        enum: ["Bookmarks", "Dash", "None"],
      },
    },
    bookmarksVisible: { type: Boolean },
    clockVisible: { type: Boolean },
    countdownVisible: { type: Boolean },
    displayName: {
      type: String,
      trim: true,
      maxlength: 20,
    },
    displayNameVisible: { type: Boolean },
    greetingVisible: { type: Boolean },
    hour12clock: { type: Boolean },
    notesVisible: { type: Boolean },
    quotesVisible: { type: Boolean },
    searchVisible: { type: Boolean },
    searchSettings: {
      inCenter: { type: Boolean },
      provider: {
        type: String,
        trim: true,
        enum: ["Google", "Bing", "DuckDuckGo", "Ecosia"],
      },
    },
    showRandomMetricCountdown: { type: Boolean },
    soundscapesVisible: { type: Boolean },
    todoVisible: { type: Boolean },
    todoSettings: {
      keepTodoState: { type: Boolean },
      todosUpdatedDate: { type: Date },
    },
    themeColour: {
      type: String,
      trim: true,
      enum: ["dark", "light", "system"],
    },
    themeFont: {
      type: String,
      trim: true,
      enum: ["classic", "modern", "startup", "retro", "warehouse", "quirky"],
    },
  },
  { timestamps: true }
);

const Customization = mongoose.model("Customization", customizationSchema);
exports.Customization = Customization;
