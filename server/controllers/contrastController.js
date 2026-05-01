const Story = require("../models/story");

const getContrastStory = async (req, res, next) => {
  try {
    const { storyId } = req.params;

    //Fetch the Story from MongoDB 
    const story = await Story.findById(storyId);

    if (!story) {
      return res.status(404).json({
        success: false,
        message: "Story not found",
      });
    }

    //Find the cover article 
    const coverArticle =
      story.articles.find(
        (a) => (a.source_name || a.source || "").toLowerCase() === story.coverSource.toLowerCase()
      ) || story.articles[0] || null;

    //Sort articles 
    const sortedArticles = [
      ...(coverArticle ? [coverArticle] : []),
      ...story.articles
        .filter((a) => a._id.toString() !== coverArticle?._id.toString())
        .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt)),
    ];

    //Shape the response 
    const response = {
      success: true,
      data: {
        _id:          story._id,
        headline:     story.headline,

        summary:      story.summary,

        imageUrl:     story.imageUrl,

        category:     story.category,
        tags:         story.tags,
        coverSource:  story.coverSource,

        coverArticle,

        articles:     sortedArticles,

        articleCount: story.articleCount,

        biasDistribution: story.biasDistribution,

        latestPublishedAt: story.latestPublishedAt,
        createdAt:         story.createdAt,
      },
    };

    res.json(response);

  } catch (err) {
    next(err);
  }
};

module.exports = { getContrastStory };