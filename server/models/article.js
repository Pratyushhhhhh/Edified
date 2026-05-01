const mongoose = require("mongoose");

const articleSchema = new mongoose.Schema({
  // Core fields 
  title: {
    type: String,
    required: true,
    trim: true,
  },
  url: {
    type: String,
    required: true,
  },
  source: {
    type: String,
    trim: true,
  },
  source_name: {
    type: String,
    trim: true,
  },
  publishedAt: {
    type: Date,
    default: Date.now,
  },
  snippet: {
    type: String,
    default: "",
  },
  summary_meta: {
    type: String,
    default: "",
  },

  // the contrast page 
  author: {
    type: String,
    default: "",
  },
  imageUrl: {
    type: String,
    default: "",
  },
  top_image: {
    type: String,
    default: "",
  },
  fullContent: {
    type: String,
    default: "",
    select: false,
  },

  // Bias fields- set by ML pipeline, read by contrast page 
  biasScore: {
    type: Number,
    min: -1,
    max: 1,
    default: null,
  },
  biasLabel: {
    type: String,
    enum: ["left", "center-left", "center", "center-right", "right", "unrated", null],
    default: null,
  },
  category: {
    type: String,
    default: "",
  },
  tags: {
    type: [String],
    default: [],
  },
});

module.exports = articleSchema;