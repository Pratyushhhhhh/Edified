const mongoose = require("mongoose");
const articleSchema = require("./article");

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
    },

    imageUrl: {
      type: String,
      default: "",
    },

    category: {
      type: String,
      default: "other",
    },

    tags: {
      type: [String],
      default: [],
    },

    //Articles 
    articles: {
      type: [articleSchema],
      default: [],
    },

    coverSource: {
      type: String,
      default: "",
    },

    biasDistribution: {
      left:        { type: Number, default: 0 },
      centerLeft:  { type: Number, default: 0 },
      center:      { type: Number, default: 0 },
      centerRight: { type: Number, default: 0 },
      right:       { type: Number, default: 0 },
    },

    latestPublishedAt: {
      type: mongoose.Schema.Types.Mixed,
      default: Date.now,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,      
    toJSON: { virtuals: true },
  }
);

//Virtual field
storySchema.virtual("articleCount").get(function () {
  return this.articles.length;
});

// Pre-save hook
storySchema.pre("save", function (next) {
  if (this.articles.length > 0) {

    const dates = this.articles.map((a) => new Date(a.publishedAt));
    this.latestPublishedAt = new Date(Math.max(...dates));

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

// Indexes 
storySchema.index({ latestPublishedAt: -1 });
storySchema.index({ category: 1, latestPublishedAt: -1 });
storySchema.index({ isActive: 1 });

module.exports = mongoose.model("Story", storySchema, "clusters");