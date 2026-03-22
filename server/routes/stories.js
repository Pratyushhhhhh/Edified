const express = require("express");
const router = express.Router();
const {
  getStories,
  getStoryById,
  createStory,
  addArticlesToStory,
  updateStory,
  deleteStory,
} = require("../controllers/storiesController");

/*
  Base path: /api/stories  (mounted in server.js)

  GET    /api/stories                  → home page story card feed
  GET    /api/stories/:id              → single story detail
  POST   /api/stories                  → create a story (pipeline use)
  POST   /api/stories/:id/articles     → add articles to a story
  PATCH  /api/stories/:id              → update story fields
  DELETE /api/stories/:id              → soft-delete a story
*/

router.get("/", getStories);
router.get("/:id", getStoryById);
router.post("/", createStory);
router.post("/:id/articles", addArticlesToStory);
router.patch("/:id", updateStory);
router.delete("/:id", deleteStory);

module.exports = router;