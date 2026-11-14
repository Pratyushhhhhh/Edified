"""
scraperv2/clean_old_news.py
────────────────────────────
Deletes all news articles and clusters published before November 1, 2026.
Safely parses RFC 2822, ISO strings, and BSON dates.

Usage:
  python scraperv2/clean_old_news.py
"""

import os
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from pymongo import MongoClient
from dotenv import load_dotenv
from pathlib import Path

# Load env
load_dotenv(Path(__file__).parent / ".env")

MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DB_NAME", "news_aggregator")

# Cutoff: November 1, 2026 UTC
CUTOFF_DATE = datetime(2026, 11, 1, 0, 0, 0, tzinfo=timezone.utc)


def parse_date(val):
    if not val:
        return None
    if isinstance(val, datetime):
        return val if val.tzinfo else val.replace(tzinfo=timezone.utc)
    if isinstance(val, str):
        try:
            dt = parsedate_to_datetime(val)
            return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
        except Exception:
            try:
                dt = datetime.fromisoformat(val.replace("Z", "+00:00"))
                return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
            except Exception:
                return None
    return None


def run():
    print(f"Connecting to MongoDB: {DB_NAME}...")
    client = MongoClient(MONGO_URI)
    db = client[DB_NAME]

    clusters_col = db["cluster_test_v2"]
    articles_col = db["test_v2"]

    # 1. Clean clusters
    cluster_ids_to_del = []
    for doc in clusters_col.find({}, {"latestPublishedAt": 1, "articles.publishedAt": 1, "createdAt": 1}):
        d = parse_date(doc.get("latestPublishedAt"))
        if not d:
            arts = doc.get("articles", [])
            dates = [parse_date(a.get("publishedAt")) for a in arts]
            dates = [x for x in dates if x]
            if dates:
                d = max(dates)
        if not d and doc.get("createdAt"):
            d = parse_date(doc.get("createdAt"))

        if d and d < CUTOFF_DATE:
            cluster_ids_to_del.append(doc["_id"])

    print(f"Found {len(cluster_ids_to_del)} clusters before November 2026.")
    if cluster_ids_to_del:
        res = clusters_col.delete_many({"_id": {"$in": cluster_ids_to_del}})
        print(f"✓ Deleted {res.deleted_count} clusters from 'cluster_test_v2'.")

    # 2. Clean raw articles
    article_ids_to_del = []
    for doc in articles_col.find({}, {"publishedAt": 1, "createdAt": 1}):
        d = parse_date(doc.get("publishedAt"))
        if not d and doc.get("createdAt"):
            d = parse_date(doc.get("createdAt"))

        if d and d < CUTOFF_DATE:
            article_ids_to_del.append(doc["_id"])

    print(f"Found {len(article_ids_to_del)} raw articles before November 2026.")
    if article_ids_to_del:
        res = articles_col.delete_many({"_id": {"$in": article_ids_to_del}})
        print(f"✓ Deleted {res.deleted_count} raw articles from 'test_v2'.")

    print("\n✓ Database cleanup completed successfully!")
    client.close()


if __name__ == "__main__":
    run()

