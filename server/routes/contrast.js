const express = require("express");
const router = express.Router();
const { getContrastStory } = require("../controllers/contrastController");

/*
  Contrast page has exactly ONE route.

  GET /api/contrast/:storyId
  ──────────────────────────
  Called by StoryDetail.jsx when a user clicks a story card.

  :storyId is MongoDB's auto-generated _id for the Story document.
  e.g. /api/contrast/64f1a2b3c4d5e6f7a8b9c0d1

  Why not reuse GET /api/stories/:id?
  That route exists and works, but it returns the raw story document
  shaped for the feed. The contrast controller shapes the same data
  differently — cover article separated, articles sorted, only the
  fields the contrast page actually uses. Two routes, same data source,
  different shapes.
*/
router.get("/:storyId", getContrastStory);

module.exports = router;