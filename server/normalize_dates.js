/**
 * server/normalize_dates.js
 * ──────────────────────────
 * One-time utility script to convert all string dates (RFC 2822 / strings)
 * in MongoDB `cluster_test_v2` into standard BSON Date objects.
 *
 * This allows MongoDB to sort stories by newest-first with 100% precision!
 *
 * Run:
 *   cd server
 *   node normalize_dates.js
 */

const mongoose = require("mongoose");
require("dotenv").config();

async function run() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected ✓");

    const collection = mongoose.connection.db.collection("cluster_test_v2");
    const cursor = collection.find({});

    let updated = 0;
    let total = 0;

    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      total++;

      let validDate = null;

      // 1. Try existing latestPublishedAt
      if (doc.latestPublishedAt) {
        const d = new Date(doc.latestPublishedAt);
        if (!isNaN(d.getTime())) validDate = d;
      }

      // 2. Fall back to max date across articles
      if (!validDate && doc.articles && doc.articles.length > 0) {
        const dates = doc.articles
          .map((a) => new Date(a.publishedAt))
          .filter((d) => !isNaN(d.getTime()));
        if (dates.length > 0) {
          validDate = new Date(Math.max(...dates));
        }
      }

      // 3. Fall back to createdAt
      if (!validDate && doc.createdAt) {
        const d = new Date(doc.createdAt);
        if (!isNaN(d.getTime())) validDate = d;
      }

      // 4. Default to current time
      if (!validDate) {
        validDate = new Date();
      }

      // Update document with real Date object
      await collection.updateOne(
        { _id: doc._id },
        {
          $set: {
            latestPublishedAt: validDate,
          },
        }
      );
      updated++;
    }

    console.log(`✓ Processed ${total} documents. Updated ${updated} stories to native Date objects.`);
    process.exit(0);
  } catch (err) {
    console.error("Error normalizing dates:", err);
    process.exit(1);
  }
}

run();

