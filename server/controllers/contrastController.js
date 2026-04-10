const Story = require("../models/story");

/*
  contrastController.js — serves data specifically for the contrast page.

  WHY A SEPARATE CONTROLLER from storiesController?
  ─────────────────────────────────────────────────
  storiesController powers the cluster/home page feed. It returns MANY
  stories, strips heavy fields, and paginates.

  contrastController returns ONE story but shapes its response for what
  the contrast page specifically needs:

    1. Full articles array (all fields except fullContent)
    2. summary[] array as-is (3 bullet points)
    3. biasDistribution object (for the spectrum bar)
    4. articleCount virtual
    5. A "coverArticle" — the lead article (matching coverSource) pulled
       out separately so the frontend doesn't have to find it itself

  As the project grows, this controller is where you'll add:
    - ML-generated per-article comparison notes
    - "Key quote" extraction per article
    - Related stories suggestions
  ...without touching the feed controller at all.
*/

// ─── GET /api/contrast/:storyId ──────────────────────────────────────────────
//
// What happens when a user clicks a story card on the cluster page:
//
//   1. React router navigates to /story/:id
//   2. StoryDetail.jsx calls GET /api/contrast/:storyId
//   3. This function runs — fetches the Story document from MongoDB
//   4. Shapes the data into the contrast page response format
//   5. Sends it back as JSON
//   6. React renders: hero image, headline, summary bullets, article list
//
const getContrastStory = async (req, res, next) => {
  try {
    const { storyId } = req.params;
    // req.params.storyId is the MongoDB _id from the URL
    // e.g. GET /api/contrast/64f1a2b3c4d5e6f7a8b9c0d1
    //                                  └── this becomes storyId

    // ── 1. Fetch the Story from MongoDB ──────────────────────────────────
    const story = await Story.findById(storyId);
    // Story.findById() is Mongoose shorthand for Story.findOne({ _id: storyId })
    // It returns the full document including the embedded articles[] array.
    //
    // We do NOT use .select() here to strip fields — the contrast page
    // needs everything (except fullContent, which is already select:false
    // at the schema level, so it's automatically excluded).

    if (!story) {
      return res.status(404).json({
        success: false,
        message: "Story not found",
      });
    }

    // ── 2. Find the cover article ─────────────────────────────────────────
    // The contrast page hero section shows one prominent article at the top:
    // the image, headline, and snippet from the "cover" outlet.
    //
    // coverSource is stored as a string (e.g. "Reuters"). We find the
    // first article whose source matches it. If none matches (data
    // inconsistency), we fall back to the first article.
    const coverArticle =
      story.articles.find(
        (a) => (a.source_name || a.source || "").toLowerCase() === story.coverSource.toLowerCase()
      ) || story.articles[0] || null;

    // ── 3. Sort articles — cover article first, then by publishedAt desc ──
    // On the contrast page, the cover article always leads the list.
    // Remaining articles are sorted newest-first.
    const sortedArticles = [
      ...(coverArticle ? [coverArticle] : []),
      ...story.articles
        .filter((a) => a._id.toString() !== coverArticle?._id.toString())
        .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt)),
    ];

    // ── 4. Shape the response ─────────────────────────────────────────────
    // We don't send the raw Mongoose document — we build a plain object
    // with exactly what the contrast page needs. This makes the frontend
    // code simpler (no need to handle Mongoose internals like __v).
    const response = {
      success: true,
      data: {
        _id:          story._id,
        headline:     story.headline,

        // summary[] — 3 bullet points for the contrast page left column
        // Frontend renders: story.summary.map((point, i) => ...)
        summary:      story.summary,

        // imageUrl — hero image shown top-left on the contrast page
        imageUrl:     story.imageUrl,

        category:     story.category,
        tags:         story.tags,
        coverSource:  story.coverSource,

        // coverArticle — separated out so the frontend doesn't have to
        // search through articles[] to find it
        coverArticle,

        // articles[] — every article becomes one row in the contrast list
        // Sorted: cover first, then newest to oldest
        articles:     sortedArticles,

        // articleCount — "17 articles" label above the list
        // This is the virtual field defined in Story.js
        articleCount: story.articleCount,

        // biasDistribution — will power the spectrum bar
        // e.g. { left:1, centerLeft:2, center:1, centerRight:1, right:0 }
        biasDistribution: story.biasDistribution,

        // Timestamps
        latestPublishedAt: story.latestPublishedAt,
        createdAt:         story.createdAt,
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