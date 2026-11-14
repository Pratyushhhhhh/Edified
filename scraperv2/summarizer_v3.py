"""
scraperv2/summarizer_v3.py
──────────────────────────
Synthesizes news clusters into 3 factual, balanced, multi-perspective points
using Google Gemini and OpenRouter APIs with automatic failover.

Structure of 3 points:
  POINT 1 — Mainstream Narrative
  POINT 2 — Alternative Perspectives & Diverging Narratives
  POINT 3 — Verified Hard Facts
"""

import os
import re
import time
import json
import argparse
import threading
from datetime import datetime, timezone
from pathlib import Path

import requests
from pymongo import MongoClient
from langdetect import detect, LangDetectException

from config import (
    log, MONGO_URI, DB_NAME, COL_CLUSTERS,
    OPENROUTER_API_KEY, GEMINI_API_KEY,
    MAX_ARTICLES_FOR_SUMMARY,
)

# ─────────────────────────────────────────────────────────────────────────────
#  CONSTANTS & MODELS
# ─────────────────────────────────────────────────────────────────────────────

SLEEP_BETWEEN_CALLS = 4.0      # Safe for free tier RPM
WORDS_PER_ARTICLE   = 180      # Truncate each article to ~180 words (saves 40% tokens per article)
MAX_ARTICLES_PER_CLUSTER = 5   # Top 5 most informative articles are plenty for 3 points
DEFAULT_TOP_CLUSTERS = 100     # Summarize only top 100 multi-source clusters
MIN_ARTICLES_TO_SUMMARIZE = 2  # Only clusters with >= 2 sources need multi-source synthesis
CHECKPOINT_FILE     = Path(__file__).resolve().parent / "summarizer_checkpoint.json"

# Gemini models to try (Google AI Studio)
GEMINI_MODELS = [
    os.getenv("GEMINI_MODEL", "gemini-3.8-flash"),
    "gemini-3.5-flash-lite",
    "gemini-2.5-flash",
]

# OpenRouter models to try
OPENROUTER_MODELS = [
    os.getenv("OPENROUTER_MODEL", "openrouter/free"),
    "meta-llama/llama-3.3-70b-instruct:free",
    "google/gemini-2.0-flash-lite-preview-02-05:free",
]


# ─────────────────────────────────────────────────────────────────────────────
#  CHECKPOINT
# ─────────────────────────────────────────────────────────────────────────────

def load_checkpoint() -> set:
    """Load set of already-completed cluster IDs from disk."""
    if CHECKPOINT_FILE.exists():
        try:
            data = json.loads(CHECKPOINT_FILE.read_text())
            ids = set(data.get("completed_ids", []))
            log.info(f"Checkpoint loaded: {len(ids)} clusters already done")
            return ids
        except Exception:
            return set()
    return set()


def save_checkpoint(completed_ids: set):
    """Persist completed cluster IDs. Called after every successful cluster."""
    CHECKPOINT_FILE.write_text(json.dumps({
        "completed_ids": list(completed_ids),
        "last_updated": datetime.now(timezone.utc).isoformat(),
    }, indent=2))


# ─────────────────────────────────────────────────────────────────────────────
#  LANGUAGE DETECTION
# ─────────────────────────────────────────────────────────────────────────────

def detect_language(text: str) -> str:
    try:
        return detect(text[:500])
    except LangDetectException:
        return "en"


# ─────────────────────────────────────────────────────────────────────────────
#  CONTENT EXTRACTION
# ─────────────────────────────────────────────────────────────────────────────

def get_article_text(article: dict) -> str:
    content = article.get("fullContent", "").strip()
    if content and len(content) > 50:
        return content
    meta = article.get("summary_meta", "").strip()
    if meta and len(meta) > 30:
        return meta
    return article.get("snippet", "").strip()


def truncate_to_words(text: str, max_words: int) -> str:
    """Keep first max_words words of text."""
    words = text.split()
    if len(words) <= max_words:
        return text
    return " ".join(words[:max_words]) + "..."


def extract_source_name(article: dict) -> str:
    source = (
        article.get("source_name")
        or article.get("source")
        or article.get("outlet")
        or article.get("domain")
        or ""
    )
    if source:
        return str(source).strip()

    url = article.get("url") or article.get("real_url") or article.get("link") or ""
    if url:
        match = re.search(r"(?:https?://)?(?:www\.)?([^/\.]+)", url)
        if match:
            return match.group(1).capitalize()

    return "Unknown"


def prepare_articles_for_prompt(cluster: dict) -> list:
    """Extract and prepare article content for the prompt (capped to save tokens)."""
    articles = cluster.get("articles", [])
    prepared = []

    for art in articles[:MAX_ARTICLES_PER_CLUSTER]:
        text = get_article_text(art)
        if not text or len(text) < 30:
            continue
        prepared.append({
            "source": extract_source_name(art),
            "text": text,
        })

    return prepared


# ─────────────────────────────────────────────────────────────────────────────
#  PROMPT BUILDER
# ─────────────────────────────────────────────────────────────────────────────

def build_prompt(headline: str, articles: list) -> str:
    article_blocks = []
    for i, art in enumerate(articles, 1):
        source = art.get("source", f"Source {i}")
        text   = truncate_to_words(art.get("text", ""), WORDS_PER_ARTICLE)
        if text:
            article_blocks.append(f"[ARTICLE {i} — {source}]\n{text}")

    articles_str = "\n\n".join(article_blocks)

    prompt = f"""You are an expert multi-source news analyst and factual summarizer.

You are given {len(articles)} news articles from different media outlets covering the same news event. Your task is to synthesize them into a concise, accurate, balanced, and information-dense summary.

Headline: {headline}

{articles_str}

---

Generate EXACTLY 3 condensed points using the following structure:

POINT 1 — Mainstream Narrative:
In 2 to 3 concise, tightly edited sentences (under 60 words), identify and summarize the central event and consensus narrative emerging across major outlets. Highlight key developments and agreements without fluff or repetition.

POINT 2 — Alternative Perspectives & Diverging Narratives:
In 2 to 3 concise, tightly edited sentences (under 60 words), highlight key dissenting viewpoints, alternative angles, or criticisms reported by other outlets or stakeholders. If there are no divergent angles, provide the single most significant secondary development.

POINT 3 — Verified Hard Facts:
In 2 to 3 concise, tightly edited sentences (under 60 words), present objective verified details (dates, locations, numbers, statistics, official statements, and confirmed actions). Exclude opinions, allegations, or speculation.

---

STRICT RULES:

1. Produce EXACTLY 3 points, following the specified headings.
2. CONDENSED LENGTH (HALF SIZE): Keep each point strictly between 35 and 65 words (2 to 3 compact sentences). Do NOT write long paragraphs. Cut all filler and verbose phrasing.
3. Each point must be a single coherent compact paragraph, not a list of sub-points.
4. At the end of each point, include the article numbers that support its content:
   (Articles: 1, 3, 5)
5. Cite ONLY article numbers that actually support the statements in that particular point.
6. Do not assume that an article supports a claim merely because it covers the same event.
7. Synthesize information across sources instead of summarizing each article independently.
8. Attribute controversial claims, allegations, opinions, and opposing viewpoints to the specific outlet or stakeholder reporting them.
9. Never present an allegation, prediction, or unverified claim as an established fact.
10. If sources contradict each other, explicitly mention the disagreement in a concise sentence.
11. Do not introduce external information, assumptions, or facts that are absent from the supplied articles.
12. Avoid sensationalism, loaded language, unnecessary repetition, and unsupported conclusions.
13. If the articles are in different languages, produce the summary entirely in English.
14. If there is no meaningful alternative perspective, use Point 2 to explain the most significant secondary development. Do not invent opposing narratives.
15. Do not add any introduction, conclusion, disclaimer, or text outside the three points.

Return only the three requested points."""

    return prompt


# ─────────────────────────────────────────────────────────────────────────────
#  OPENROUTER CALLER
# ─────────────────────────────────────────────────────────────────────────────

def _call_openrouter(prompt: str) -> str:
    if not OPENROUTER_API_KEY:
        raise ValueError("OPENROUTER_API_KEY not set")

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY.strip()}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:5000",
        "X-Title": "The Edified News Summarizer",
    }

    last_error = None
    for model_name in OPENROUTER_MODELS:
        payload = {
            "model": model_name,
            "messages": [
                {"role": "user", "content": prompt}
            ],
            "max_tokens": 500,
            "temperature": 0.2,
        }

        try:
            resp = requests.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers=headers,
                json=payload,
                timeout=60,
            )

            if resp.status_code == 200:
                data = resp.json()
                choices = data.get("choices", [])
                if choices:
                    content = choices[0]["message"]["content"].strip()
                    log.info(f"    OpenRouter ({model_name}) OK")
                    return content

            log.warning(f"    OpenRouter {model_name} error {resp.status_code}: {resp.text[:150]}")
            last_error = resp.text
        except requests.exceptions.RequestException as e:
            last_error = e

    raise RuntimeError(f"OpenRouter failed across models: {last_error}")


# ─────────────────────────────────────────────────────────────────────────────
#  GEMINI CALLER
# ─────────────────────────────────────────────────────────────────────────────

def _call_gemini(prompt: str) -> str:
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY not set")

    clean_key = GEMINI_API_KEY.strip()
    headers = {
        "Content-Type": "application/json",
        "x-goog-api-key": clean_key,
    }
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "maxOutputTokens": 500,
            "temperature": 0.2,
        },
    }

    last_error = None
    for model_name in GEMINI_MODELS:
        url = (
            f"https://generativelanguage.googleapis.com/v1beta/models/"
            f"{model_name}:generateContent?key={clean_key}"
        )

        try:
            resp = requests.post(url, headers=headers, json=payload, timeout=60)

            if resp.status_code == 200:
                data = resp.json()
                candidates = data.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    if parts:
                        text = parts[0].get("text", "").strip()
                        log.info(f"    Gemini ({model_name}) OK")
                        return text

            log.warning(f"    Gemini {model_name} error {resp.status_code}: {resp.text[:150]}")
            last_error = resp.text
        except requests.exceptions.RequestException as e:
            last_error = e

    raise RuntimeError(f"Gemini failed across models: {last_error}")


# ─────────────────────────────────────────────────────────────────────────────
#  UNIFIED CALLER — Gemini + OpenRouter Failover
# ─────────────────────────────────────────────────────────────────────────────

def call_llm(prompt: str) -> tuple[str, str]:
    """
    Calls Gemini as primary, falling back to OpenRouter (or vice versa).
    Returns (raw_text, model_used).
    """
    # 1. Try Gemini
    if GEMINI_API_KEY:
        try:
            text = _call_gemini(prompt)
            if text:
                time.sleep(SLEEP_BETWEEN_CALLS)
                return text, "gemini"
        except Exception as e:
            log.warning(f"  Gemini attempt failed ({e}) → trying OpenRouter...")

    # 2. Try OpenRouter
    if OPENROUTER_API_KEY:
        try:
            text = _call_openrouter(prompt)
            if text:
                time.sleep(SLEEP_BETWEEN_CALLS)
                return text, "openrouter"
        except Exception as e:
            log.warning(f"  OpenRouter attempt failed ({e})")

    raise RuntimeError("Both Gemini and OpenRouter failed to generate a summary.")


# ─────────────────────────────────────────────────────────────────────────────
#  RESPONSE PARSER
# ─────────────────────────────────────────────────────────────────────────────

def parse_three_points(text: str) -> list:
    """Parse LLM output into up to 3 clean point strings."""
    points = []

    # Primary: split on POINT N with heading label
    segments = re.split(r"POINT\s+\d+\s*[—\-–:]\s*[^:\n]*:\s*", text, flags=re.IGNORECASE)
    segments = [s.strip() for s in segments if s.strip() and len(s.strip()) > 30]

    if len(segments) >= 2:
        for seg in segments[:3]:
            cleaned = re.sub(r"^[^\n:]+:\s*\n?", "", seg, count=1).strip()
            if not cleaned:
                cleaned = seg.strip()
            if len(cleaned) > 30:
                points.append(cleaned)

    # Fallback 1: split on generic POINT N
    if len(points) < 2:
        segments = re.split(r"POINT\s+\d+\s*[—\-–:]?", text, flags=re.IGNORECASE)
        segments = [s.strip() for s in segments if s.strip() and len(s.strip()) > 30]
        for seg in segments[:3]:
            cleaned = re.sub(r"^[^\n:]+:\s*\n?", "", seg, count=1).strip()
            if len(cleaned) > 30:
                points.append(cleaned)

    # Fallback 2: paragraph splits
    if len(points) < 2:
        paragraphs = [p.strip() for p in text.split("\n\n") if len(p.strip()) > 50]
        points = paragraphs[:3]

    if not points:
        points = [text[:1000].strip()]

    return points[:3]


# ─────────────────────────────────────────────────────────────────────────────
#  MAIN RUNNER
# ─────────────────────────────────────────────────────────────────────────────

def run(top_n: int = DEFAULT_TOP_CLUSTERS, min_articles: int = MIN_ARTICLES_TO_SUMMARIZE, process_all: bool = False, force: bool = False):
    log.info("=== Summarizer v3 (Gemini + OpenRouter) starting ===")

    if not GEMINI_API_KEY and not OPENROUTER_API_KEY:
        log.error("Neither GEMINI_API_KEY nor OPENROUTER_API_KEY is set!")
        return

    log.info("Connecting to MongoDB...")
    mongo_client = MongoClient(MONGO_URI)
    cluster_col = mongo_client[DB_NAME][COL_CLUSTERS]

    # Token-saving query: Focus on top clusters with multi-source coverage
    projection = {"_id": 1, "headline": 1, "articles": 1, "summary": 1, "articleCount": 1, "latestPublishedAt": 1}
    sort_fields = [("articleCount", -1), ("latestPublishedAt", -1)]

    if process_all:
        log.info("Mode: Processing ALL clusters (unfiltered)...")
        clusters = list(cluster_col.find({}, projection).sort(sort_fields))
    else:
        log.info(f"Mode: Token-saving strategy active! Fetching top {top_n} clusters with >= {min_articles} articles...")
        query = {
            "$or": [
                {"articleCount": {"$gte": min_articles}},
                {"articles.1": {"$exists": True}}  # Has at least 2 articles in array
            ]
        }
        cursor = cluster_col.find(query, projection).sort(sort_fields)
        if top_n > 0:
            cursor = cursor.limit(top_n)
        clusters = list(cursor)

    total = len(clusters)
    log.info(f"Selected {total} candidate clusters for summarization")

    completed_ids = load_checkpoint()

    def already_done(c):
        if force:
            return False
        if str(c["_id"]) in completed_ids:
            return True
        existing = c.get("summary", [])
        return isinstance(existing, list) and len(existing) >= 3

    pending = [c for c in clusters if not already_done(c)]
    db_skipped = sum(1 for c in clusters if isinstance(c.get("summary"), list) and len(c.get("summary", [])) >= 3)
    if force:
        log.info(f"Force mode active: re-summarizing all {len(pending)} selected clusters with condensed prompt.")
    else:
        log.info(f"Pending: {len(pending)} | Checkpoint: {len(completed_ids)} | Already summarized in DB: {db_skipped}")

    if not pending:
        log.info("All selected clusters already summarized. Delete summarizer_checkpoint.json or pass --force / increase --top.")
        return

    success = failed = skipped = 0
    start_time = time.time()

    for i, cluster in enumerate(pending, 1):
        headline = cluster.get("headline", "Unknown")
        count = cluster.get("articleCount") or len(cluster.get("articles", []))
        log.info(f"\n[{i}/{len(pending)}] (Articles: {count}) {headline[:70]}")

        articles = prepare_articles_for_prompt(cluster)

        if not articles:
            log.warning("  → No content, skipping")
            skipped += 1
            completed_ids.add(str(cluster["_id"]))
            save_checkpoint(completed_ids)
            continue

        lang = detect_language(articles[0]["text"])
        log.info(f"  → Prepared {len(articles)} articles (capped at {MAX_ARTICLES_PER_CLUSTER}), lang: {lang}")

        prompt = build_prompt(headline, articles)

        try:
            raw_response, model_used = call_llm(prompt)
        except Exception as e:
            log.error(f"  → LLM call failed: {e}")
            failed += 1
            continue

        if not raw_response:
            log.warning("  → Empty LLM response")
            failed += 1
            continue

        points = parse_three_points(raw_response)
        log.info(f"  → Parsed {len(points)} points (via {model_used})")
        for j, p in enumerate(points, 1):
            log.info(f"     P{j}: {p[:90]}...")

        cluster_col.update_one(
            {"_id": cluster["_id"]},
            {"$set": {
                "summary":      points,
                "summaryRaw":   raw_response,
                "summaryModel": model_used,
                "updatedAt":    datetime.now(timezone.utc),
            }},
        )

        completed_ids.add(str(cluster["_id"]))
        save_checkpoint(completed_ids)
        success += 1

        if i % 25 == 0:
            elapsed = time.time() - start_time
            rate = i / elapsed * 60
            eta_min = (len(pending) - i) / max(rate, 0.1)
            log.info(f"\n  ── Progress: {i}/{len(pending)} | {rate:.1f}/min | ETA: {eta_min:.0f} min ──")

    elapsed_total = time.time() - start_time
    log.info(f"\n{'═' * 50}")
    log.info(f"Success       : {success}")
    log.info(f"Skipped       : {skipped}")
    log.info(f"Failed        : {failed}")
    log.info(f"Total Selected: {total}")
    log.info(f"Time elapsed  : {elapsed_total/60:.1f} min")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Summarize top news clusters with Gemini & OpenRouter")
    parser.add_argument("--top", type=int, default=DEFAULT_TOP_CLUSTERS, help=f"Number of top clusters to summarize (default: {DEFAULT_TOP_CLUSTERS})")
    parser.add_argument("--min-articles", type=int, default=MIN_ARTICLES_TO_SUMMARIZE, help=f"Minimum articles in cluster (default: {MIN_ARTICLES_TO_SUMMARIZE})")
    parser.add_argument("--all", action="store_true", help="Process all clusters regardless of article count or rank")
    parser.add_argument("--force", action="store_true", help="Force re-summarize clusters even if already summarized")
    args = parser.parse_args()

    run(top_n=args.top, min_articles=args.min_articles, process_all=args.all, force=args.force)
