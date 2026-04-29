const Story = require("../models/story");

const getStories = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, category, maxArticles } = req.query;

    const filter = { isActive: { $ne: false } }; // Matches true or missing
    if (category && category !== "all") filter.category = new RegExp(`^${category}$`, "i");
    // Only fetch stories with 1 or 2 articles if maxArticles is provided
    if (maxArticles) {
      filter["articles"] = { $exists: true };
      filter.$expr = { $lte: [{ $size: "$articles" }, Number(maxArticles)] };
    }

    const stories = await Story.find(filter)
      .sort({ articleCount: -1, latestPublishedAt: -1 })
      .skip((page - 1) * Number(limit))
      .limit(Number(limit))
      .select("-articles.biasScore -__v");

    const total = await Story.countDocuments(filter);

    res.json({
      success: true,
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit)),
      data: stories,
    });
  } catch (err) {
    next(err);
  }
};

const getStoryById = async (req, res, next) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) {
      return res.status(404).json({ success: false, message: "Story not found" });
    }
    res.json({ success: true, data: story });
  } catch (err) {
    next(err);
  }
};

const createStory = async (req, res, next) => {
  try {
    const story = await Story.create(req.body);
    res.status(201).json({ success: true, data: story });
  } catch (err) {
    next(err);
  }
};

const addArticlesToStory = async (req, res, next) => {
  try {
    const { articles } = req.body;
    if (!articles || !Array.isArray(articles) || articles.length === 0) {
      return res.status(400).json({ success: false, message: "Provide an articles array" });
    }

    const story = await Story.findById(req.params.id);
    if (!story) {
      return res.status(404).json({ success: false, message: "Story not found" });
    }

    const existingUrls = new Set(story.articles.map((a) => a.url));
    const newArticles = articles.filter((a) => !existingUrls.has(a.url));

    if (newArticles.length === 0) {
      return res.status(409).json({ success: false, message: "All articles already exist in this story" });
    }

    story.articles.push(...newArticles);
    await story.save();

    res.json({ success: true, added: newArticles.length, data: story });
  } catch (err) {
    next(err);
  }
};

const updateStory = async (req, res, next) => {
  try {
    const allowed = ["headline", "summary", "category", "tags", "coverSource", "isActive", "imageUrl"];
    const updates = {};
    allowed.forEach((key) => {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    });

    const story = await Story.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!story) {
      return res.status(404).json({ success: false, message: "Story not found" });
    }
    res.json({ success: true, data: story });
  } catch (err) {
    next(err);
  }
};

const deleteStory = async (req, res, next) => {
  try {
    const story = await Story.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!story) {
      return res.status(404).json({ success: false, message: "Story not found" });
    }
    res.json({ success: true, message: "Story deactivated", data: story });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getStories,
  getStoryById,
  createStory,
  addArticlesToStory,
  updateStory,
  deleteStory,
};