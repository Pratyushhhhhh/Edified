"""
scraperv2/cleanup_clusters.py
────────────────────────────
Refined Cleanup Script:
- Targets clusters with placeholder images (placehold.co).
- Deletes them ONLY if they have fewer than 3 articles.
"""

import os
from pathlib import Path
from dotenv import load_dotenv
from pymongo import MongoClient
from config import log, MONGO_URI, DB_NAME, COL_CLUSTERS

# Configuration
DELETE_PLACEHOLDERS_IF_LESS_THAN = 3  # Deletes clusters with placeholders if articles < 3

def cleanup():
    log.info(f"=== Starting Targeted Placeholder Cleanup ===")
    log.info(f"Criteria: Image contains 'placehold.co' AND Article Count < {DELETE_PLACEHOLDERS_IF_LESS_THAN}")
    
    client = MongoClient(MONGO_URI)
    db = client[DB_NAME]
    cluster_col = db[COL_CLUSTERS]
    
    total_clusters = cluster_col.count_documents({})
    log.info(f"Found {total_clusters} total clusters in {COL_CLUSTERS}")
    
    # Fetch clusters
    clusters = list(cluster_col.find({}, {"_id": 1, "headline": 1, "articles": 1, "imageUrl": 1}))
    
    to_delete = []
    
    for cluster in clusters:
        cluster_id = cluster["_id"]
        headline = cluster.get("headline", "No Headline")
        img_url = cluster.get("imageUrl") or ""
        articles = cluster.get("articles", [])
        num_articles = len(articles)
        
        # Target: Placeholders with low article counts
        if "placehold.co" in img_url and num_articles < DELETE_PLACEHOLDERS_IF_LESS_THAN:
            log.info(f"  [MATCH] '{headline[:50]}...' - Placeholder with {num_articles} articles")
            to_delete.append(cluster_id)

    if not to_delete:
        log.info("No clusters match the cleanup criteria.")
        return

    log.info(f"\nFound {len(to_delete)} clusters to remove.")
    confirm = input(f"Confirm deletion of {len(to_delete)} clusters? (y/n): ")
    
    if confirm.lower() == 'y':
        result = cluster_col.delete_many({"_id": {"$in": to_delete}})
        log.info(f"Successfully deleted {result.deleted_count} clusters.")
    else:
        log.info("Cleanup cancelled.")

if __name__ == "__main__":
    cleanup()
