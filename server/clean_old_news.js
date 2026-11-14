/**
 * server/clean_old_news.js
 * ─────────────────────────
 * Deletes all articles and story clusters published before November 1, 2026.
 *
 * Checks both `cluster_test_v2` (story clusters) and `test_v2` (raw articles).
 * Safely parses Date objects, ISO strings, and RFC 2822 strings.
 *
 * Usage:
 *   cd server
 *   node clean_old_news.js
 */

const mongoose = require("mongoose");
require("dotenv").config();

// Cutoff: November 1, 2026 00:00:00 UTC
const CUTOFF_DATE = new Date("2026-11-01T00:00:00.000Z");

function parseDateSafely(val) {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

async function cleanOldNews() {
  try {
    console.log("Connecting to MongoDB Atlas...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected ✓");
    console.log(`Target: Deleting all news older than ${CUTOFF_DATE.toISOString()} (Before November 2026)\n`);

    const db = mongoose.connection.db;

    // ── 1. Clean `cluster_test_v2` (Story clusters) ───────────────────────────
    const clustersCol = db.collection("cluster_test_v2");
    const clusterCursor = clustersCol.find({});
    const clusterIdsToDelete = [];

    while (await clusterCursor.hasNext()) {
      const doc = await clusterCursor.next();
      
      let docDate = parseDateSafely(doc.latestPublishedAt);

      // If latestPublishedAt couldn't be parsed, check articles inside
      if (!docDate && doc.articles && doc.articles.length > 0) {
        const articleDates = doc.articles
          .map((a) => parseDateSafely(a.publishedAt))
          .filter((d) => d !== null);
        if (articleDates.length > 0) {
          docDate = new Date(Math.max(...articleDates));
        }
      }

      // Fall back to createdAt
      if (!docDate && doc.createdAt) {
        docDate = parseDateSafely(doc.createdAt);
      }

      if (docDate && docDate < CUTOFF_DATE) {
        clusterIdsToDelete.push(doc._id);
      }
    }

    console.log(`Found ${clusterIdsToDelete.length} clusters published before November 2026.`);
    if (clusterIdsToDelete.length > 0) {
      const resClusters = await clustersCol.deleteMany({ _id: { $in: clusterIdsToDelete } });
      console.log(`✓ Deleted ${resClusters.deletedCount} old clusters from 'cluster_test_v2'.`);
    }

    // ── 2. Clean `test_v2` (Raw articles) ─────────────────────────────────────
    const articlesCol = db.collection("test_v2");
    const articleCursor = articlesCol.find({});
    const articleIdsToDelete = [];

    while (await articleCursor.hasNext()) {
      const doc = await articleCursor.next();
      let docDate = parseDateSafely(doc.publishedAt);
      if (!docDate && doc.createdAt) {
        docDate = parseDateSafely(doc.createdAt);
      }

      if (docDate && docDate < CUTOFF_DATE) {
        articleIdsToDelete.push(doc._id);
      }
    }

    console.log(`Found ${articleIdsToDelete.length} raw articles published before November 2026.`);
    if (articleIdsToDelete.length > 0) {
      const resArticles = await articlesCol.deleteMany({ _id: { $in: articleIdsToDelete } });
      console.log(`✓ Deleted ${resArticles.deletedCount} old raw articles from 'test_v2'.`);
    }

    // ── 3. Summary ────────────────────────────────────────────────────────────
    console.log("\n========================================");
    console.log(" Cleanup Complete!");
    console.log(" Your database now only contains news from November 2026 onwards.");
    console.log("========================================");

    process.exit(0);
  } catch (err) {
    console.error("Error during cleanup:", err);
    process.exit(1);
  }
}

cleanOldNews();

