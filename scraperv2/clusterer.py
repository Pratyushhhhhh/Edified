import hashlib
import json
import re
from datetime import datetime, timezone
import numpy as np
from pymongo import MongoClient, UpdateOne
from sentence_transformers import SentenceTransformer
from sklearn.cluster import HDBSCAN
from sklearn.metrics.pairwise import cosine_distances

from config import (
    log, MONGO_URI, DB_NAME, COL_RAW_ARTICLES, COL_CLUSTERS,
    EMBEDDING_MODEL, HDBSCAN_MIN_CLUSTER_SIZE, HDBSCAN_MIN_SAMPLES,
    BAD_IMAGE_DOMAINS,
)


# ═══════════════════════════════════════════════════════════════════════════════
#  HELPERS
# ═══════════════════════════════════════════════════════════════════════════════

def is_valid_image(url: str) -> bool:
    if not url or not isinstance(url, str) or not url.startswith("http"):
        return False
    return not any(bad in url for bad in BAD_IMAGE_DOMAINS)


def pick_best_image(articles: list) -> str:
    """Return first valid image from any article in the cluster."""
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


def extract_source_name(article: dict) -> str:
    s = article.get("source_name") or article.get("source") or article.get("outlet") or ""
    if s:
        return str(s).strip()
    url = article.get("url") or article.get("real_url") or ""
    m = re.search(r"(?:https?://)?(?:www\.)?([^/.]+)", url)
    return m.group(1).capitalize() if m else "Unknown"


def cluster_fingerprint(articles: list) -> str:
    """Generate a stable ID based on the sorted titles of the articles in the cluster."""
    hashes = sorted(a.get("title_hash") or a.get("title", "") for a in articles)
    return hashlib.md5(json.dumps(hashes).encode()).hexdigest()


# ═══════════════════════════════════════════════════════════════════════════════
#  MAIN
# ═══════════════════════════════════════════════════════════════════════════════

import urllib.parse

def get_placeholder_image(source_name: str) -> str:
    """Generate a clean, branded placeholder image using the source name."""
    if not source_name:
        return "https://placehold.co/800x450/1a1a2e/e2e2e2?text=News"
    encoded_name = urllib.parse.quote(source_name)
    return f"https://placehold.co/800x450/1a1a2e/e2e2e2?text={encoded_name}"

def run():
    log.info("Connecting to MongoDB...")
    client = MongoClient(MONGO_URI)
    db = client[DB_NAME]
    raw_col     = db[COL_RAW_ARTICLES]
    cluster_col = db[COL_CLUSTERS]

    # Load articles
    raw_articles = list(raw_col.find())
    total = len(raw_articles)
    if not total:
        log.warning("No articles found — nothing to cluster.")
        return
    log.info(f"Loaded {total} articles from {COL_RAW_ARTICLES}")

    # Build embedding input: title + snippet of content for richer context
    articles_to_embed = []
    
    for a in raw_articles:
        if "embedding" in a and isinstance(a["embedding"], list) and len(a["embedding"]) > 0:
            pass # already embedded
        else:
            articles_to_embed.append(a)

    log.info(f"Articles with cached embeddings: {total - len(articles_to_embed)}")
    log.info(f"Articles needing new embeddings: {len(articles_to_embed)}")

    if articles_to_embed:
        texts = []
        for a in articles_to_embed:
            title = a.get("title", "")
            content = a.get("fullContent", "")[:200]
            snippet = a.get("snippet", "")[:100] if not content else ""
            texts.append(f"{title}. {content or snippet}")

        # Generate embeddings
        log.info(f"Loading model: {EMBEDDING_MODEL}")
        model = SentenceTransformer(EMBEDDING_MODEL)
        log.info("Generating embeddings...")
        new_embeddings = model.encode(texts, show_progress_bar=True, normalize_embeddings=True)

        # Save to DB and update the dictionaries in memory
        log.info("Saving new embeddings to MongoDB...")
        bulk_operations = []
        for idx, a in enumerate(articles_to_embed):
            emb_list = [float(x) for x in new_embeddings[idx]]
            a["embedding"] = emb_list
            bulk_operations.append(UpdateOne({"_id": a["_id"]}, {"$set": {"embedding": emb_list}}))

        if bulk_operations:
            raw_col.bulk_write(bulk_operations)

    # Reconstruct the full list of embeddings aligned with raw_articles
    embeddings = []
    for a in raw_articles:
        embeddings.append(a["embedding"])
    
    embeddings = np.array(embeddings, dtype=np.float32)

    # Compute cosine distance matrix for HDBSCAN
    log.info("Computing cosine distance matrix...")
    dist_matrix = cosine_distances(embeddings)

    # Cluster
    log.info(f"Clustering with HDBSCAN (min_cluster_size={HDBSCAN_MIN_CLUSTER_SIZE}, min_samples={HDBSCAN_MIN_SAMPLES})...")
    clusterer = HDBSCAN(
        min_cluster_size=HDBSCAN_MIN_CLUSTER_SIZE,
        min_samples=HDBSCAN_MIN_SAMPLES,
        metric="precomputed",
    )
    labels = clusterer.fit_predict(dist_matrix)

    unique_labels = set(labels) - {-1}
    outlier_count = labels.tolist().count(-1)
    log.info(f"Found {len(unique_labels)} clusters, {outlier_count} outliers")

    # Group articles by cluster
    clusters_map = {}
    for idx, cluster_id in enumerate(labels):
        if cluster_id == -1:
            continue
        if cluster_id not in clusters_map:
            clusters_map[cluster_id] = []
        article = dict(raw_articles[idx])
        article["_id"] = str(article["_id"])
        clusters_map[cluster_id].append(article)

    # Also create singleton clusters for outliers (these go to Blindspots)
    outlier_articles = []
    for idx, cluster_id in enumerate(labels):
        if cluster_id == -1:
            article = dict(raw_articles[idx])
            article["_id"] = str(article["_id"])
            outlier_articles.append(article)

    # Build cluster documents
    final_clusters = []
    clusters_with_image = 0
    clusters_without_image = 0

    for c_id, articles in clusters_map.items():
        # Deduplicate identical articles within the cluster
        seen_titles = set()
        deduped = []
        for a in articles:
            th = a.get("title_hash") or a.get("title", "").strip().lower()
            if th not in seen_titles:
                seen_titles.add(th)
                deduped.append(a)
        articles = deduped

        # Sort by date (newest first)
        articles.sort(key=lambda x: x.get("publishedAt", ""), reverse=True)
        lead = articles[0]

        best_image = pick_best_image(articles)
        if best_image:
            clusters_with_image += 1
        else:
            clusters_without_image += 1
            best_image = get_placeholder_image(extract_source_name(lead))

        cluster_doc = {
            "headline":         lead.get("title", ""),
            "summary":          [],
            "imageUrl":         best_image,
            "category":         lead.get("category", "General"),
            "tags":             list(set(t for a in articles for t in a.get("tags", []))),
            "articles":         articles,
            "articleCount":     len(articles),
            "coverSource":      extract_source_name(lead),
            "biasDistribution": generate_bias_distribution(articles),
            "isActive":         True,
            "latestPublishedAt": lead.get("publishedAt", ""),
            "createdAt":        datetime.now(timezone.utc),
            "updatedAt":        datetime.now(timezone.utc),
        }
        final_clusters.append(cluster_doc)

    # Create singleton clusters for outliers
    for article in outlier_articles:
        img = ""
        for field in ("imageUrl", "top_image"):
            candidate = article.get(field, "")
            if is_valid_image(candidate):
                img = candidate
                break
        if not img:
            img = get_placeholder_image(extract_source_name(article))

        cluster_doc = {
            "headline":         article.get("title", ""),
            "summary":          [],
            "imageUrl":         img,
            "category":         article.get("category", "General"),
            "tags":             article.get("tags", []),
            "articles":         [article],
            "articleCount":     1,
            "coverSource":      extract_source_name(article),
            "biasDistribution": generate_bias_distribution([article]),
            "isActive":         True,
            "latestPublishedAt": article.get("publishedAt", ""),
            "createdAt":        datetime.now(timezone.utc),
            "updatedAt":        datetime.now(timezone.utc),
        }
        final_clusters.append(cluster_doc)

    # ─────────────────────────────────────────────────────────────────────────────
    #  DATABASE UPSERT
    # ─────────────────────────────────────────────────────────────────────────────
    log.info(f"Writing {len(final_clusters)} clusters to {COL_CLUSTERS} (upserting)...")
    
    ops = []
    seen_fps = set()

    for cluster_doc in final_clusters:
        fp = cluster_fingerprint(cluster_doc["articles"])
        seen_fps.add(fp)
        cluster_doc["clusterFingerprint"] = fp

        ops.append(UpdateOne(
            {"clusterFingerprint": fp},
            {
                "$setOnInsert": {
                    "summary": [],
                    "generatedHeadline": "",
                    "summaryModel": "",
                    "createdAt": datetime.now(timezone.utc),
                    "clusterFingerprint": fp,
                },
                "$set": {
                    "headline":         cluster_doc["headline"],
                    "imageUrl":         cluster_doc["imageUrl"],
                    "category":         cluster_doc["category"],
                    "tags":             cluster_doc["tags"],
                    "articles":         cluster_doc["articles"],
                    "articleCount":     cluster_doc["articleCount"],
                    "coverSource":      cluster_doc["coverSource"],
                    "biasDistribution": cluster_doc["biasDistribution"],
                    "isActive":         True,
                    "updatedAt":        datetime.now(timezone.utc),
                    "latestPublishedAt": cluster_doc["latestPublishedAt"],
                }
            },
            upsert=True,
        ))

    if ops:
        result = cluster_col.bulk_write(ops)
        log.info(f"Upsert result: {result.upserted_count} new, {result.modified_count} modified.")

    # Soft-delete clusters not seen in this run (they dissolved or changed significantly)
    del_result = cluster_col.update_many(
        {"clusterFingerprint": {"$nin": list(seen_fps)}},
        {"$set": {"isActive": False}}
    )
    log.info(f"Soft-deleted {del_result.modified_count} stale clusters.")

    # Report
    multi = sum(1 for c in final_clusters if len(c["articles"]) >= 2)
    single = sum(1 for c in final_clusters if len(c["articles"]) == 1)
    log.info(f"\n{'─' * 50}")
    log.info(f"Multi-article clusters : {multi}")
    log.info(f"Singleton clusters     : {single} (Blindspots)")
    log.info(f"Clusters with images   : {clusters_with_image}")
    log.info(f"Clusters w/ placeholder: {clusters_without_image}")
    log.info(f"Outlier articles       : {outlier_count}")
    log.info(f"Total in DB            : {cluster_col.count_documents({})}")
    log.info("Done.")


if __name__ == "__main__":
    run()
