const express = require("express");
const router = express.Router();
const { getContrastStory } = require("../controllers/contrastController");

router.get("/:storyId", getContrastStory);

module.exports = router;