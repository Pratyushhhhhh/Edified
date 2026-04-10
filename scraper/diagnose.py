"""
diagnose_images.py
------------------
Shows which sources have missing/empty imageUrl fields
so you know exactly where the collection gap is.
"""

from pymongo import MongoClient
from collections import defaultdict

CONNECTION_STRING = "mongodb+srv://pratyushbansal05_db_user:edi123@newscluster0.jenvf5c.mongodb.net/?retryWrites=true&w=majority"

def run():
    client = MongoClient(CONNECTION_STRING)
    col = client["news_aggregator"]["raw_news_data"]

    all_docs = list(col.find({}, {"source_name": 1, "imageUrl": 1, "top_image": 1}))

    stats = defaultdict(lambda: {"total": 0, "has_image": 0, "no_image": 0})

    for doc in all_docs:
        source = doc.get("source_name", "Unknown")
        img = doc.get("imageUrl", "") or doc.get("top_image", "") or ""
        stats[source]["total"] += 1
        if img and img.startswith("http") and "googleusercontent" not in img and "news.google.com" not in img:
            stats[source]["has_image"] += 1
        else:
            stats[source]["no_image"] += 1

    print(f"\n{'Source':<35} {'Total':>6} {'Has Image':>10} {'No Image':>10} {'Coverage':>10}")
    print("─" * 75)

    # Sort by no_image count descending
    for source, s in sorted(stats.items(), key=lambda x: x[1]["no_image"], reverse=True):
        pct = (s["has_image"] / s["total"] * 100) if s["total"] else 0
        flag = " ← FIX" if pct < 50 else ""
        print(f"{source:<35} {s['total']:>6} {s['has_image']:>10} {s['no_image']:>10} {pct:>9.0f}%{flag}")

    print("─" * 75)
    total     = len(all_docs)
    has_image = sum(s["has_image"] for s in stats.values())
    print(f"{'TOTAL':<35} {total:>6} {has_image:>10} {total-has_image:>10} {has_image/total*100:>9.0f}%")

if __name__ == "__main__":
    run()