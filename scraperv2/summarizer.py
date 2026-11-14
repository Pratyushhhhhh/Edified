"""
scraperv2/summarizer.py
───────────────────────
Language-aware cluster summarization.

Flow:
  1. For each cluster, collect stored article content (no re-scraping)
  2. Detect language of the combined text
  3. English → BART (facebook/bart-large-cnn) via HF Inference API
  4. Non-English → Qwen2.5-72B-Instruct via InferenceClient chat
  5. Parse into 3 bullet points and update cluster in DB

Improvements over v1:
  - Uses stored fullContent — never re-downloads articles
  - Language detection prevents wasted BART calls on Hindi text
  - Token-aware truncation for BART
  - Operates on cluster_test_v2
"""

import re
import time
import requests
import itertools
import threading
from datetime import datetime, timezone
from concurrent.futures import ThreadPoolExecutor, as_completed

from pymongo import MongoClient
from langdetect import detect, LangDetectException

from config import (
    log, MONGO_URI, DB_NAME, COL_CLUSTERS,
    HF_TOKENS, HF_BART_URL,
    MAX_ARTICLES_FOR_SUMMARY, BART_MAX_INPUT_CHARS,
    SUMMARIZER_THREADS, DELAY_BETWEEN_API_CALLS,
)

token_cycle = itertools.cycle(HF_TOKENS)
token_lock = threading.Lock()

def get_next_token():
    with token_lock:
        return next(token_cycle)


# ═══════════════════════════════════════════════════════════════════════════════
#  LANGUAGE DETECTION
# ═══════════════════════════════════════════════════════════════════════════════

def detect_language(text: str) -> str:
    """Detect the primary language of the text. Returns ISO 639-1 code."""
    try:
        return detect(text[:500])
    except LangDetectException:
        return "en"


# ═══════════════════════════════════════════════════════════════════════════════
#  CONTENT EXTRACTION (from stored data only — no HTTP)
# ═══════════════════════════════════════════════════════════════════════════════

def get_article_text(article: dict) -> str:
    """Get article text from stored fields. No scraping."""
    content = article.get("fullContent", "").strip()
    if content and len(content) > 50:
        return content

    meta = article.get("summary_meta", "").strip()
    if meta and len(meta) > 30:
        return meta

    snippet = article.get("snippet", "").strip()
    return snippet


def combine_articles(headline: str, contents: list, max_chars: int) -> str:
    """Combine article texts into a single block, respecting char limit."""
    parts = [t.strip() for t in contents if t.strip()]
    if not parts:
        return ""

    combined = f"{headline}. " + " ".join(parts)
    return combined[:max_chars]


# ═══════════════════════════════════════════════════════════════════════════════
#  BART SUMMARIZER (English)
# ═══════════════════════════════════════════════════════════════════════════════

def _call_bart(text: str, token: str) -> str:
    """Direct HTTP call to BART via HF Inference router."""
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }
    payload = {
        "inputs": text,
        "parameters": {
            "max_length": 250,
            "min_length": 100,
            "do_sample": False,
        },
    }

    for attempt in range(3):
        try:
            resp = requests.post(HF_BART_URL, headers=headers, json=payload, timeout=180)

            if resp.status_code == 503:
                wait = 30 if attempt == 0 else 60
                log.warning(f"    Model loading, waiting {wait}s...")
                time.sleep(wait)
                continue

            if resp.status_code == 429:
                log.warning("    Rate limited, waiting 60s...")
                time.sleep(60)
                continue

            if resp.status_code != 200:
                log.warning(f"    BART error {resp.status_code}: {resp.text[:150]}")
                return ""

            result = resp.json()
            if isinstance(result, list) and result:
                return result[0].get("summary_text", "").strip()
            elif isinstance(result, dict):
                return result.get("summary_text", "").strip()

        except requests.exceptions.Timeout:
            log.warning(f"    Timeout (attempt {attempt + 1})")
            time.sleep(10)
        except Exception as e:
            log.error(f"    BART request error: {e}")

    return ""


# ═══════════════════════════════════════════════════════════════════════════════
#  QWEN SUMMARIZER (Non-English / fallback)
# ═══════════════════════════════════════════════════════════════════════════════

def _call_qwen(text: str, token: str) -> str:
    """Use Qwen2.5-72B-Instruct via InferenceClient for multilingual text."""
    try:
        from huggingface_hub import InferenceClient
        client = InferenceClient(api_key=token)
        messages = [
            {
                "role": "system",
                "content": (
                    "You are a news summarizer. Generate a detailed, factual summary of the provided news. "
                    "Output exactly 2 detailed sentences. "
                    "Do not add opinions, speculation, or formatting like bullet points."
                ),
            },
            {"role": "user", "content": f"Summarize this news in exactly 2 detailed sentences:\n\n{text}"},
        ]
        result = client.chat_completion(
            messages=messages,
            model="Qwen/Qwen2.5-72B-Instruct",
            max_tokens=250,
        )
        summary = result.choices[0].message.content
        if summary:
            return summary.strip()
    except ImportError:
        log.error("    huggingface_hub not installed")
    except Exception as e:
        log.error(f"    Qwen error: {e}")
    return ""


# ═══════════════════════════════════════════════════════════════════════════════
#  SUMMARY PARSER
# ═══════════════════════════════════════════════════════════════════════════════

def split_into_points(summary_text: str) -> list:
    """Split summary into up to 2 detailed bullet points."""
    if not summary_text:
        return []

    # If Qwen returned bullet-point format or newlines
    lines = [l.strip().lstrip("- •*").strip() for l in summary_text.split("\n") if l.strip()]
    lines = [l for l in lines if len(l) > 20]
    if len(lines) >= 2:
        return lines[:2]

    # BART returns continuous prose — split on sentences
    sentences = re.split(r"(?<=[.!?])\s+", summary_text.strip())
    points = [s.strip() for s in sentences if len(s.strip()) > 20]
    return points[:2]


# ═══════════════════════════════════════════════════════════════════════════════
#  MAIN
# ═══════════════════════════════════════════════════════════════════════════════

def run():
    log.info("Connecting to MongoDB...")
    client = MongoClient(MONGO_URI)
    cluster_col = client[DB_NAME][COL_CLUSTERS]

    clusters = list(cluster_col.find({}, {"_id": 1, "headline": 1, "articles": 1}))
    total = len(clusters)
    log.info(f"Summarizing {total} clusters in {COL_CLUSTERS}...")

    success = failed = skipped = 0

    def process_cluster(i, cluster):
        headline = cluster.get("headline", "Unknown")
        articles = cluster.get("articles", [])

        # Collect content from stored articles (no HTTP scraping)
        contents = []
        for art in articles[:MAX_ARTICLES_FOR_SUMMARY]:
            text = get_article_text(art)
            if text:
                contents.append(text)

        if not contents:
            return i, False, "No content", headline

        # Combine and detect language
        combined = combine_articles(headline, contents, BART_MAX_INPUT_CHARS)
        if not combined:
            return i, False, "No combined content", headline

        lang = detect_language(combined)
        token = get_next_token()

        # Route to appropriate model
        if lang == "en":
            raw_summary = _call_bart(combined, token)
            if not raw_summary:
                raw_summary = _call_qwen(combined, token)
        else:
            # Non-English → go straight to Qwen (BART will fail)
            raw_summary = _call_qwen(combined, token)

        if not raw_summary:
            time.sleep(DELAY_BETWEEN_API_CALLS)
            return i, False, "API failed", headline

        # Parse and save
        summary = split_into_points(raw_summary)
        if not summary:
            summary = [raw_summary[:500].strip()]

        cluster_col.update_one(
            {"_id": cluster["_id"]},
            {"$set": {"summary": summary, "updatedAt": datetime.now(timezone.utc)}},
        )

        time.sleep(DELAY_BETWEEN_API_CALLS)
        return i, True, summary, headline

    with ThreadPoolExecutor(max_workers=SUMMARIZER_THREADS) as executor:
        futures = []
        for i, cluster in enumerate(clusters, 1):
            futures.append(executor.submit(process_cluster, i, cluster))

        for future in as_completed(futures):
            i, success_flag, result, headline = future.result()
            if success_flag:
                success += 1
                log.info(f"[{i}/{total}] {headline[:65]} -> ✓ Saved {len(result)} points")
            else:
                if result in ("No content", "No combined content"):
                    skipped += 1
                else:
                    failed += 1
                log.warning(f"[{i}/{total}] {headline[:65]} -> {result}")

    log.info(f"\n{'─' * 50}")
    log.info(f"Success : {success}")
    log.info(f"Skipped : {skipped}")
    log.info(f"Failed  : {failed}")
    log.info(f"Total   : {total}")


if __name__ == "__main__":
    run()
