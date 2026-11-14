/**
 * server/clean_world_locations.js
 * ────────────────────────────────
 * Clears any stray `locations` tags on documents categorized as "world"
 * in both `cluster_test_v2` (story clusters) and `test_v2` (raw articles).
 *
 * Usage:
 *   cd server
 *   node clean_world_locations.js
 */

const mongoose = require("mongoose");
require("dotenv").config();

async function cleanWorldLocations() {
  try {
    console.log("Connecting to MongoDB Atlas...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected ✓");

    const db = mongoose.connection.db;

    // 1. Clean clusters
    const clustersCol = db.collection("cluster_test_v2");
    const clusterResult = await clustersCol.updateMany(
      { category: { $regex: /^world$/i } },
      { $set: { locations: [] } }
    );
    console.log(`✓ Cleared locations on ${clusterResult.modifiedCount} world news clusters in cluster_test_v2`);

    // 2. Clean raw articles
    const articlesCol = db.collection("test_v2");
    const articleResult = await articlesCol.updateMany(
      { category: { $regex: /^world$/i } },
      { $set: { locations: [] } }
    );
    console.log(`✓ Cleared locations on ${articleResult.modifiedCount} world news articles in test_v2`);

    console.log("\nAll world news documents have been cleaned of location tags.");
    process.exit(0);
  } catch (err) {
    console.error("Error cleaning world locations:", err);
    process.exit(1);
  }
}

cleanWorldLocations();
