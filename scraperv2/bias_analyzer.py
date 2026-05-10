

import sys
import torch
from pymongo import MongoClient, UpdateOne
from transformers import AutoTokenizer, AutoModelForSequenceClassification

from config import (
    log, MONGO_URI, DB_NAME, COL_CLUSTERS, COL_RAW_ARTICLES,
    BIAS_MODEL_NAME, BIAS_TOKENIZER_NAME, BIAS_BATCH_SIZE,
)


# ═══════════════════════════════════════════════════════════════════════════════
#  HELPERS
# ═══════════════════════════════════════════════════════════════════════════════

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


def score_to_label(score: float) -> str:
    if score < -0.33:
        return "left"
    elif score < -0.1:
        return "center-left"
    elif score <= 0.1:
        return "center"
    elif score <= 0.33:
        return "center-right"
    else:
        return "right"


# ═══════════════════════════════════════════════════════════════════════════════
#  MAIN
# ═══════════════════════════════════════════════════════════════════════════════

def run():
    log.info("Connecting to MongoDB...")
    client = MongoClient(MONGO_URI)
    db = client[DB_NAME]
    cluster_col = db[COL_CLUSTERS]
    raw_col = db[COL_RAW_ARTICLES]

    clusters = list(cluster_col.find({}))
    if not clusters:
        log.warning("No clusters found.")
        return

    log.info(f"Loaded {len(clusters)} clusters")

    # Load model
    log.info(f"Loading {BIAS_MODEL_NAME}...")
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    log.info(f"Device: {device}")

    tokenizer = AutoTokenizer.from_pretrained(BIAS_TOKENIZER_NAME)
    model = AutoModelForSequenceClassification.from_pretrained(BIAS_MODEL_NAME)
    model.to(device)
    model.eval()

    total_articles = 0

    for i, cluster in enumerate(clusters, 1):
        headline = cluster.get("headline", "Unknown")
        log.info(f"[{i}/{len(clusters)}] {headline[:55]}")

        articles = cluster.get("articles", [])
        updated_articles = []

        # Prepare batch
        batch_texts = []
        batch_indices = []

        for j, art in enumerate(articles):
            if "biasScore" in art and "biasLabel" in art:
                # Already computed and cached
                updated_articles.append(art)
                continue

            # Use title + content for richer context
            title = art.get("title", "")
            content = art.get("fullContent", "").strip()[:400]
            if not content:
                content = art.get("snippet", "").strip()[:200]

            text = f"{title}. {content}" if content else title
            if not text.strip():
                updated_articles.append(art)
                continue

            batch_texts.append(text)
            batch_indices.append(j)
            updated_articles.append(art)   # placeholder — will be updated

        if not batch_texts:
            cluster_col.update_one(
                {"_id": cluster["_id"]},
                {"$set": {"articles": updated_articles, "biasDistribution": generate_bias_distribution(updated_articles)}},
            )
            continue

        bulk_raw_ops = []

        # Process in batches
        for start in range(0, len(batch_texts), BIAS_BATCH_SIZE):
            end = min(start + BIAS_BATCH_SIZE, len(batch_texts))
            chunk_texts = batch_texts[start:end]
            chunk_indices = batch_indices[start:end]

            inputs = tokenizer(
                chunk_texts,
                return_tensors="pt",
                truncation=True,
                max_length=512,
                padding=True,
            ).to(device)

            with torch.no_grad():
                outputs = model(**inputs)
                probs = outputs.logits.softmax(dim=-1)

            for k, idx in enumerate(chunk_indices):
                p = probs[k].tolist()
                # [0]=left, [1]=center, [2]=right
                score = round(p[2] - p[0], 3)
                label = score_to_label(score)

                # Find the article in updated_articles by matching index
                for art in updated_articles:
                    if art.get("title") == articles[idx].get("title"):
                        art["biasScore"] = score
                        art["biasLabel"] = label
                        
                        bulk_raw_ops.append(
                            UpdateOne(
                                {"title_hash": art.get("title_hash")},
                                {"$set": {"biasScore": score, "biasLabel": label}}
                            )
                        )
                        break

                total_articles += 1

        # Save cached scores to raw collection
        if bulk_raw_ops:
            raw_col.bulk_write(bulk_raw_ops)

        # Update cluster
        new_dist = generate_bias_distribution(updated_articles)
        cluster_col.update_one(
            {"_id": cluster["_id"]},
            {"$set": {"articles": updated_articles, "biasDistribution": new_dist}},
        )

    log.info(f"\n{'─' * 50}")
    log.info(f"✓ Evaluated {total_articles} articles across {len(clusters)} clusters")


if __name__ == "__main__":
    run()
