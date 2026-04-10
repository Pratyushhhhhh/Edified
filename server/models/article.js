const mongoose = require("mongoose");

/*
  Article is an EMBEDDED schema — it has no collection of its own.
  Every article lives inside a Story document (story.articles[]).

  WHY EMBEDDED?
  The contrast page loads ONE story and immediately renders ALL its
  articles. If articles were stored separately, we'd need a second
  DB query ("give me all articles where storyId = X"). Embedding
  collapses that to a single query — the Story document carries
  everything the contrast page needs in one round trip.

  FIELDS USED BY THE CONTRAST PAGE:
  ┌─────────────────┬─────────────────────────────────────────────┐
  │ title           │ Article headline shown in the list          │
  │ url             │ "Visit" link — opens original article       │
  │ source          │ Outlet name (BBC, Reuters, etc.)            │
  │ author          │ Byline shown under headline                 │
  │ publishedAt     │ "X hours ago" timestamp                     │
  │ snippet         │ 1-2 sentence excerpt on the article row     │
  │ imageUrl        │ Thumbnail (future: shown per article)       │
  │ biasScore       │ -1 to 1 float — drives the bias bar width   │
  │ biasLabel       │ Text label shown in the bias pill           │
  └─────────────────┴─────────────────────────────────────────────┘

  fullContent is excluded from normal queries (select: false) because
  it can be several KB per article. The contrast page doesn't render
  full article text — it just shows snippets and links out.
*/
const articleSchema = new mongoose.Schema({
  // ── Core fields (used by both cluster card AND contrast page) ──────────────
  title: {
    type: String,
    required: true,
    trim: true,
  },
  url: {
    type: String,
    required: true,
    // The "VISIT" button on the contrast page links here
  },
  source: {
    type: String,
    trim: true,
    // e.g. "BBC News", "Reuters", "The Hindu"
    // Used in test/stories data
  },
  source_name: {
    type: String,
    trim: true,
    // e.g. "The Hindu" — used in news_aggregator/clusters data
    // The frontend should check source_name || source
  },
  publishedAt: {
    type: Date,
    default: Date.now,
  },
  snippet: {
    type: String,
    default: "",
    // Shown as the short description under each article row on contrast page
  },
  summary_meta: {
    type: String,
    default: "",
    // Used in clusters data as an alternative to snippet
  },

  // ── New fields added for the contrast page ─────────────────────────────────
  author: {
    type: String,
    default: "",
    // Byline — e.g. "Sarah Marsh, The Guardian"
    // Shown under the article headline in the article list
  },
  imageUrl: {
    type: String,
    default: "",
    // Per-article thumbnail — reserved for future per-article image display
    // Currently the Story-level imageUrl is used as the contrast page hero image
  },
  top_image: {
    type: String,
    default: "",
    // Used in clusters data — scraped from Google News RSS
    // Often holds the same Google News generic thumbnail
  },
  fullContent: {
    type: String,
    default: "",
    select: false,
    // Full article body — NOT returned by default (select: false)
    // Will be used later by the ML pipeline to generate summaries and
    // compute bias scores. Too large to send to the frontend on every request.
    // To fetch it explicitly: Story.findById(id).select("+articles.fullContent")
  },

  // ── Bias fields — set by ML pipeline, read by contrast page ───────────────
  biasScore: {
    type: Number,
    min: -1,
    max: 1,
    default: null,
    // The contrast page uses this to render the bias meter bar.
    // -1.0 = hard left, 0 = center, +1.0 = hard right
    // e.g. biasScore: -0.4 → bar sits 30% left of center
  },
  biasLabel: {
    type: String,
    enum: ["left", "center-left", "center", "center-right", "right", "unrated", null],
    default: null,
    // Human-readable label shown as a pill next to the source name
    // e.g. "center-left" renders as a teal pill on the contrast page
    // "unrated" is used in clusters data when bias has not been assessed
  },
  category: {
    type: String,
    default: "",
    // Per-article category — present in clusters data
  },
  tags: {
    type: [String],
    default: [],
    // Per-article tags — present in clusters data
  },
});

module.exports = articleSchema;