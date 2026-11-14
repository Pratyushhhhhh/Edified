const Story = require("../models/story");


const getContrastStory = async (req, res, next) => {
  try {
    const { storyId } = req.params;

    // Fetch the Story from MongoDB 
    const story = await Story.findById(storyId);

    if (!story) {
      return res.status(404).json({
        success: false,
        message: "Story not found",
      });
    }

    // Find the cover article 

    const coverArticle =
      story.articles.find(
        (a) => (a.source_name || a.source || "").toLowerCase() === story.coverSource.toLowerCase()
      ) || story.articles[0] || null;

    // Sort articles
    const sortedArticles = [
      ...(coverArticle ? [coverArticle] : []),
      ...story.articles
        .filter((a) => a._id.toString() !== coverArticle?._id.toString())
        .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt)),
    ];

    // Shape the response
    const response = {
      success: true,
      data: {
        _id: story._id,
        headline: story.headline,

        // summary[] — 3 bullet points for the contrast page left column
        // Frontend renders: story.summary.map((point, i) => ...)
        summary: story.summary,

        // imageUrl — hero image shown top-left on the contrast page
        imageUrl: story.imageUrl,

        category: story.category,
        tags: story.tags,
        coverSource: story.coverSource,

        // coverArticle — separated out so the frontend doesn't have to
        // search through articles[] to find it
        coverArticle,

        // articles[] — every article becomes one row in the contrast list
        // Sorted: cover first, then newest to oldest
        articles: sortedArticles,

        // articleCount — "17 articles" label above the list
        // This is the virtual field defined in Story.js
        articleCount: story.articleCount,

        // biasDistribution — will power the spectrum bar
        // e.g. { left:1, centerLeft:2, center:1, centerRight:1, right:0 }
        biasDistribution: story.biasDistribution,

        // Timestamps
        latestPublishedAt: story.latestPublishedAt,
        createdAt: story.createdAt,
      },
    };

    res.json(response);

  } catch (err) {
    // Pass any error (including CastError for malformed IDs) to the
    // global error handler in middleware/errorHandler.js
    next(err);
  }
};

module.exports = { getContrastStory };