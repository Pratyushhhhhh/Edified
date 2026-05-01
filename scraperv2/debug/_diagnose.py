"""Comparison diagnostic: raw_news_data (v1) vs test_v2 (v2) and clusters vs cluster_test_v2."""
import json
from pymongo import MongoClient

CONNECTION_STRING = "mongodb+srv://pratyushbansal05_db_user:edi123@newscluster0.jenvf5c.mongodb.net/?retryWrites=true&w=majority"
c = MongoClient(CONNECTION_STRING)
db = c["news_aggregator"]

def analyze_collection(name, col):
    total = col.count_documents({})
    with_img = col.count_documents({"imageUrl": {"$ne": ""}})
    no_content = col.count_documents({"fullContent": ""})

    # Duplicate titles
    pipeline = [
        {"$group": {"_id": "$title", "count": {"$sum": 1}}},
        {"$match": {"count": {"$gt": 1}}},
    ]
    dupes = list(col.aggregate(pipeline))
    
    # Source distribution (top 10)
    src_pipeline = [
        {"$group": {"_id": "$source_name", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 10},
    ]
    sources = list(col.aggregate(src_pipeline))

    # Category distribution
    cat_pipeline = [
        {"$group": {"_id": "$category", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
    ]
    categories = list(col.aggregate(cat_pipeline))

    print(f"\n{'=' * 50}")
    print(f"  {name}")
    print(f"{'=' * 50}")
    print(f"  Total articles:       {total}")
    print(f"  With images:          {with_img} ({with_img*100//max(total,1)}%)")
    print(f"  Missing fullContent:  {no_content} ({no_content*100//max(total,1)}%)")
    print(f"  Duplicate titles:     {len(dupes)}")
    print(f"\n  Top sources:")
    for s in sources:
        print(f"    {s['_id']:30s} {s['count']}")
    print(f"\n  Categories:")
    for cat in categories:
        print(f"    {str(cat['_id']):20s} {cat['count']}")


def analyze_clusters(name, col):
    total = col.count_documents({})
    with_summary = col.count_documents({"summary": {"$ne": []}})
    
    # Article count distribution
    pipeline = [
        {"$project": {"count": {"$size": "$articles"}}},
        {"$group": {"_id": "$count", "clusters": {"$sum": 1}}},
        {"$sort": {"_id": 1}},
    ]
    dist = list(col.aggregate(pipeline))

    # Image status
    placeholder = col.count_documents({"imageUrl": {"$regex": "placehold"}})
    real_img = total - placeholder

    # Bias distribution totals
    bias_pipeline = [
        {"$group": {
            "_id": None,
            "left": {"$sum": "$biasDistribution.left"},
            "centerLeft": {"$sum": "$biasDistribution.centerLeft"},
            "center": {"$sum": "$biasDistribution.center"},
            "centerRight": {"$sum": "$biasDistribution.centerRight"},
            "right": {"$sum": "$biasDistribution.right"},
        }}
    ]
    bias = list(col.aggregate(bias_pipeline))

    print(f"\n{'=' * 50}")
    print(f"  {name}")
    print(f"{'=' * 50}")
    print(f"  Total clusters:       {total}")
    print(f"  With summaries:       {with_summary}")
    print(f"  With real images:     {real_img}")
    print(f"  With placeholders:    {placeholder}")
    print(f"\n  Cluster size distribution:")
    for d in dist:
        label = "Blindspots" if d['_id'] <= 2 else ""
        print(f"    {d['_id']} articles: {d['clusters']} clusters  {label}")
    if bias:
        b = bias[0]
        print(f"\n  Bias totals:")
        print(f"    Left:         {b.get('left', 0)}")
        print(f"    Center-Left:  {b.get('centerLeft', 0)}")
        print(f"    Center:       {b.get('center', 0)}")
        print(f"    Center-Right: {b.get('centerRight', 0)}")
        print(f"    Right:        {b.get('right', 0)}")


print("\n" + "#" * 60)
print("  SCRAPERV1 vs SCRAPERV2 — COMPARISON")
print("#" * 60)

analyze_collection("RAW ARTICLES (v1: raw_news_data)", db["raw_news_data"])
analyze_collection("RAW ARTICLES (v2: test_v2)", db["test_v2"])

analyze_clusters("CLUSTERS (v1: clusters)", db["clusters"])
analyze_clusters("CLUSTERS (v2: cluster_test_v2)", db["cluster_test_v2"])

print("\n" + "#" * 60)
print("  DONE")
print("#" * 60)
