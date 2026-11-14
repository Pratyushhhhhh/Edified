const Story = require("../models/story");

const getStories = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, category, maxArticles, location, sort } = req.query;

    const filter = { isActive: { $ne: false } };
    if (category && category !== "all") filter.category = new RegExp(`^${category}$`, "i");
    if (maxArticles) {
      filter["articles"] = { $exists: true };
      filter.$expr = { $lte: [{ $size: "$articles" }, Number(maxArticles)] };
    }
    if (location && location !== "all") {
      if (location.toLowerCase() === "all india") {
        filter.$or = [
          { locations: new RegExp("All India", "i") },
          { locations: { $in: ["Delhi", "Uttar Pradesh", "Uttarakhand", "Manipur", "Maharashtra", "West Bengal", "Kerala", "Punjab"] } },
        ];
      } else {
        filter.locations = new RegExp(location, "i");
      }

      // CRITICAL FIX: The locations page should NEVER return world news
      if (filter.category) {
        if (category.toLowerCase() === "world") {
          filter.category = { $in: [] }; // Explicitly block if world is queried under domestic location
        }
      } else {
        filter.category = { $not: /^world$/i };
      }
    }

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);
    let stories;

    // Explicit sort overrides if requested
    if (sort === "top" || sort === "popular" || sort === "coverage") {
      stories = await Story.find(filter)
        .sort({ articleCount: -1, latestPublishedAt: -1 })
        .skip(skip)
        .limit(take)
        .select("-articles.biasScore -__v");
    } else if (sort === "recent") {
      stories = await Story.find(filter)
        .sort({ latestPublishedAt: -1, createdAt: -1, articleCount: -1 })
        .skip(skip)
        .limit(take)
        .select("-articles.biasScore -__v");
    } else {
      // DEFAULT: Balanced ranking combining BOTH Article Count AND Recency.
      // High-coverage stories get prominent placement, while breaking recent news stays on top.
      try {
        stories = await Story.aggregate([
          { $match: filter },
          {
            $addFields: {
              parsedDate: {
                $convert: {
                  input: "$latestPublishedAt",
                  to: "date",
                  onError: { $ifNull: ["$createdAt", new Date()] },
                  onNull: { $ifNull: ["$createdAt", new Date()] },
                },
              },
            },
          },
          {
            $addFields: {
              // 6 hours (21,600,000 ms) boost per article in the cluster
              newsScore: {
                $add: [
                  { $toLong: "$parsedDate" },
                  { $multiply: [{ $ifNull: ["$articleCount", 1] }, 21600000] },
                ],
              },
            },
          },
          { $sort: { newsScore: -1 } },
          { $skip: skip },
          { $limit: take },
          { $project: { "articles.biasScore": 0, __v: 0 } },
        ]);
      } catch (aggErr) {
        // Fallback to compound sort if aggregation is not supported
        stories = await Story.find(filter)
          .sort({ latestPublishedAt: -1, articleCount: -1 })
          .skip(skip)
          .limit(take)
          .select("-articles.biasScore -__v");
      }
    }

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