
import uuid
from datetime import datetime
from pymongo import MongoClient
from sentence_transformers import SentenceTransformer
from sklearn.cluster import HDBSCAN
import numpy as np

CONNECTION_STRING = "mongodb+srv://pratyushbansal05_db_user:edi123@newscluster0.jenvf5c.mongodb.net/?retryWrites=true&w=majority"
DB_NAME = "news_aggregator"

BAD_IMAGE_SIGNALS = [
    "lh3.googleusercontent.com",
    "news.google.com",
    "gstatic.com",
    "google.com/s2",
]


def is_valid_image(url: str) -> bool:
    """Returns True only if url looks like a real article image."""
    if not url or not isinstance(url, str):
        return False
    url = url.strip()
    if not url.startswith("http"):
        return False
    return not any(bad in url for bad in BAD_IMAGE_SIGNALS)


def pick_best_image(articles: list) -> str:
    """
    Go through the articles list and return the first valid imageUrl.
    Falls back to top_image if imageUrl is missing.
    Returns empty string if nothing valid is found.
    """
    for article in articles:
        for field in ("imageUrl", "top_image"):
            img = article.get(field, "")
            if is_valid_image(img):
                return img
    return ""


def generate_bias_distribution(articles: list) -> dict:
    dist = {"left": 0, "centerLeft": 0, "center": 0, "centerRight": 0, "right": 0}
    for art in articles:
        label = art.get("biasLabel", "center").lower()
        if "center" in label and "left" in label:
            dist["centerLeft"] += 1
        elif "center" in label and "right" in label:
            dist["centerRight"] += 1
        elif "left" in label:
            dist["left"] += 1
        elif "right" in label:
            dist["right"] += 1
        else:
            dist["center"] += 1
    return dist


def run():
    #Connect 
    print("Connecting to MongoDB...")
    client = MongoClient(CONNECTION_STRING)
    db = client[DB_NAME]
    raw_col     = db["raw_news_data"]
    cluster_col = db["clusters"]

    #Load articles
    raw_articles = list(raw_col.find())
    total = len(raw_articles)
    if not total:
        print("No articles found in raw_news_data.")
        return
    print(f"Loaded {total} articles from raw_news_data.")

    #Embed titles
    print("Generating embeddings...")
    titles = [a.get("title", "") for a in raw_articles]
    model = SentenceTransformer("sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")
    embeddings = model.encode(titles, show_progress_bar=True)

    #Cluster
    print("Clustering with HDBSCAN...")
    clusterer = HDBSCAN(min_cluster_size=2, metric="euclidean")
    labels = clusterer.fit_predict(embeddings)

    unique_labels = set(labels) - {-1}
    print(f"Found {len(unique_labels)} clusters ({labels.tolist().count(-1)} outliers ignored).")

    #Group articles by cluster label
    clusters_map = {}
    for idx, cluster_id in enumerate(labels):
        if cluster_id == -1:
            continue
        if cluster_id not in clusters_map:
            clusters_map[cluster_id] = []
        article = dict(raw_articles[idx])
        article["_id"] = str(article["_id"])
        clusters_map[cluster_id].append(article)

    #Build cluster documents
    final_clusters = []
    skipped_no_image = 0

    for c_id, articles in clusters_map.items():
        # Sort by date so the newest article is first
        articles.sort(key=lambda x: x.get("publishedAt", ""), reverse=True)
        lead = articles[0]

        # Find a valid image from any article in the cluster
        best_image = pick_best_image(articles)

        if not best_image:
            skipped_no_image += 1
            print(f"  Skipping cluster {c_id} ({len(articles)} articles) — no valid image found")
            continue

        cluster_doc = {
            "headline":         lead.get("title", ""),
            "summary":          [],
            "imageUrl":         best_image,
            "category":         lead.get("category", "general"),
            "tags":             list(set(t for a in articles for t in a.get("tags", []))),
            "articles":         articles,
            "coverSource":      lead.get("source_name", ""),
            "biasDistribution": generate_bias_distribution(articles),
            "isActive":         True,
            "latestPublishedAt": lead.get("publishedAt", ""),
            "createdAt":        datetime.utcnow(),
            "updatedAt":        datetime.utcnow(),
        }
        final_clusters.append(cluster_doc)
    
    # Clear old clusters and insert new ones 
    print(f"\nClearing old clusters...")
    cluster_col.delete_many({})
    print(f"Deleted all existing clusters.")

    if final_clusters:
        cluster_col.insert_many(final_clusters)
        print(f"\n✓ Inserted {len(final_clusters)} clusters into MongoDB.")
    else:
        print("No valid clusters to insert.")

    #  Summary
    print(f"\n{'─' * 50}")
    print(f"Total clusters built    : {len(final_clusters)}")
    print(f"Skipped (no valid image): {skipped_no_image}")
    print(f"Outlier articles ignored: {labels.tolist().count(-1)}")
    print(f"Clusters in DB now      : {cluster_col.count_documents({})}")
    print("Done.")


if __name__ == "__main__":
    run()