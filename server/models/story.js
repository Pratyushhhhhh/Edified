const mongoose = require("mongoose");
const articleSchema = require("./article");

/*
  Story is the top-level MongoDB document — one Story = one news event
  covered by multiple outlets. It is the central data structure for
  BOTH pages:

  CLUSTER PAGE  → reads many Stories, uses only: headline, summary[0],
                  imageUrl, category, tags, articleCount, latestPublishedAt
                  (the feed endpoint strips heavy fields)

  CONTRAST PAGE → reads ONE Story by ID, uses EVERYTHING:
                  headline, summary[], imageUrl, category, tags,
                  articles[] (with bias), biasDistribution, articleCount

  Because the contrast page is a detail view of a single story, and the
  cluster page is a list view, the same MongoDB document serves both —
  the difference is just how much of it we send.
*/
const storySchema = new mongoose.Schema(
  {
    headline: {
      type: String,
      required: [true, "Story must have a headline"],
      trim: true,
      // A neutral synthesised headline — not lifted from any one outlet.
      // Shown large at the top of the contrast page.
    },

    summary: {
      type: [String],
      default: [],
      // ARRAY of strings, not a single string.
      //
      // The contrast page renders these as 3 numbered bullet points
      // in the left column next to the hero image:
      //   1. summary[0]
      //   2. summary[1]
      //   3. summary[2]
      //
      // The frontend just does: summary.map((point, i) => <li>{point}</li>)
      // No parsing needed — each element is already one standalone point.
      //
      // Later: ML pipeline asks an LLM to compress all article text
      // into exactly 3 key points and writes them here.
    },

    imageUrl: {
      type: String,
      default: "",
      // Hero image for the contrast page — the large photo shown top-left.
      // Sourced from the cover article's image (coverSource outlet).
      // For now: manually seeded. Later: extracted from RSS feed <enclosure> tags.
    },

    category: {
      type: String,
      enum: [
        "world", "politics", "business", "technology",
        "science", "health", "sports", "entertainment",
        "environment", "other",
      ],
      default: "other",
      // Shown as the category pill (e.g. "INVESTIGATION", "BUSINESS")
      // on the contrast page meta bar.
    },

    tags: {
      type: [String],
      default: [],
      // e.g. ["Gaza", "ceasefire", "Middle East"]
      // Used for the section label on contrast page: "GLOBAL MARKETS | 12 MIN READ"
      // and later for related stories / search filtering.
    },

    // ── Articles — the core of the contrast page ───────────────────────────
    articles: {
      type: [articleSchema],
      default: [],
      // Each article in this array becomes one row in the contrast page
      // article list. The contrast page shows:
      //   - article.title      → clickable headline
      //   - article.source     → outlet name in small caps
      //   - article.snippet    → short description below headline
      //   - article.url        → "VISIT" button href
      //   - article.biasLabel  → coloured pill (left / center / right)
      //   - article.author     → byline (new field)
      //   - article.publishedAt→ timestamp
    },

    coverSource: {
      type: String,
      default: "",
      // Which outlet's article is featured prominently at the top.
      // On the contrast page this determines which article's image
      // and snippet appear in the hero section.
      // e.g. "Reuters"
    },

    // ── Bias distribution — the spectrum bar on the contrast page ──────────
    biasDistribution: {
      left:        { type: Number, default: 0 },
      centerLeft:  { type: Number, default: 0 },
      center:      { type: Number, default: 0 },
      centerRight: { type: Number, default: 0 },
      right:       { type: Number, default: 0 },
      // These counts are recomputed automatically in the pre-save hook
      // whenever articles are added or updated.
      //
      // The contrast page will eventually render these as a visual
      // spectrum bar showing how many outlets lean each way — giving
      // users an at-a-glance sense of perspectival diversity.
      //
      // e.g. { left: 1, centerLeft: 2, center: 1, centerRight: 1, right: 0 }
      // → mostly center-left coverage on this story
    },

    latestPublishedAt: {
      type: Date,
      default: Date.now,
      // Auto-updated in pre-save hook to match the most recent article.
      // Used to sort stories newest-first on the cluster/home page.
      // Not shown on the contrast page directly.
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,       // adds createdAt, updatedAt
    toJSON: { virtuals: true },
  }
);

// ── Virtual field: articleCount ─────────────────────────────────────────────
storySchema.virtual("articleCount").get(function () {
  return this.articles.length;
  // The contrast page shows "17 articles" above the list.
  // This virtual computes it on-the-fly from the embedded array length —
  // no need to store and sync a separate count field.
});

// ── Pre-save hook: keep derived fields in sync ──────────────────────────────
storySchema.pre("save", function (next) {
  if (this.articles.length > 0) {

    // 1. latestPublishedAt — find the most recent article date
    //    Used to sort stories on the cluster/home page feed.
    const dates = this.articles.map((a) => new Date(a.publishedAt));
    this.latestPublishedAt = new Date(Math.max(...dates));

    // 2. biasDistribution — count articles by label
    //    This runs every time a story is saved, so the distribution
    //    always reflects the current articles array.
    //    The contrast page reads this to show perspectival spread.
    const dist = { left: 0, centerLeft: 0, center: 0, centerRight: 0, right: 0 };
    this.articles.forEach((a) => {
      if      (a.biasLabel === "left")         dist.left++;
      else if (a.biasLabel === "center-left")  dist.centerLeft++;
      else if (a.biasLabel === "center")       dist.center++;
      else if (a.biasLabel === "center-right") dist.centerRight++;
      else if (a.biasLabel === "right")        dist.right++;
    });
    this.biasDistribution = dist;
  }
  next();
});

// ── Indexes ─────────────────────────────────────────────────────────────────
storySchema.index({ latestPublishedAt: -1 });
storySchema.index({ category: 1, latestPublishedAt: -1 });
storySchema.index({ isActive: 1 });

module.exports = mongoose.model("Story", storySchema);