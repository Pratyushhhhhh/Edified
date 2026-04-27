"""
scraperv2/summarizer_v3.py
──────────────────────────
Groq-powered cluster summarization with Gemini fallback.

Key changes from v2:
  - Groq (llama-3.3-70b) replaces BART for English → far better quality
  - Gemini Flash 2.5 as fallback when Groq hits daily limit
  - Non-English clusters → Groq directly (multilingual, no Qwen needed)
  - Structured 3-point output with article attribution per point
  - Checkpoint file → resume from crash without re-processing
  - Token-aware truncation: 300 words/article × 10 articles = safe context
  - Rate-limit-aware: tracks Groq daily budget, switches to Gemini automatically
  - Single-threaded: Groq free tier is 30 RPM — threading makes 429s worse

Flow:
  1. Load checkpoint (skip already-done clusters)
  2. For each cluster, collect stored article content (no re-scraping)
  3. Build structured prompt with article source labels
  4. Call Groq (primary) → Gemini (fallback) → log failure
  5. Parse 3-point structured response
  6. Save to MongoDB + update checkpoint
"""

import re
import time
import json
import threading
from datetime import datetime, timezone
from pathlib import Path

import requests
from pymongo import MongoClient
from langdetect import detect, LangDetectException

from config import (
    log, MONGO_URI, DB_NAME, COL_CLUSTERS,
    GROQ_API_KEY, GEMINI_API_KEY,
    MAX_ARTICLES_FOR_SUMMARY,
)

# ─────────────────────────────────────────────────────────────────────────────
#  CONSTANTS
# ─────────────────────────────────────────────────────────────────────────────

GROQ_RPM_SLEEP    = 12.0    # safe for 6K TPM models (~1000 tok/call = 5 calls/min max)
GROQ_DAILY_LIMIT  = 950     # real limit 1000, leave 50 buffer
GEMINI_RPM_SLEEP  = 5.0     # 12 RPM safe (real limit 15 RPM)
WORDS_PER_ARTICLE = 300     # truncate each article to this many words
CHECKPOINT_FILE   = Path("summarizer_checkpoint.json")

GROQ_MODEL   = "llama-3.3-70b-versatile"  # confirmed available in org limits
GEMINI_MODEL = "gemini-2.5-flash"


# ─────────────────────────────────────────────────────────────────────────────
#  CHECKPOINT
# ─────────────────────────────────────────────────────────────────────────────

def load_checkpoint() -> set:
    """Load set of already-completed cluster IDs from disk."""
    if CHECKPOINT_FILE.exists():
        data = json.loads(CHECKPOINT_FILE.read_text())
        ids = set(data.get("completed_ids", []))
        log.info(f"Checkpoint loaded: {len(ids)} clusters already done")
        return ids
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


# ─────────────────────────────────────────────────────────────────────────────
#  SOURCE EXTRACTION
# ─────────────────────────────────────────────────────────────────────────────

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
    """Extract and prepare article content for the prompt."""
    articles = cluster.get("articles", [])
    prepared = []

    for art in articles[:MAX_ARTICLES_FOR_SUMMARY]:
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
#  Token math:
#    10 articles × 300 words × ~1.3 tokens/word ≈ 3900 input tokens
#    + template ~200 tokens + output ~600 tokens = ~4700 total
#    Groq llama-3.3-70b: 6000 TPM → safe ✓
# ─────────────────────────────────────────────────────────────────────────────

def build_prompt(headline: str, articles: list) -> str:
    article_blocks = []
    for i, art in enumerate(articles, 1):
        source = art.get("source", f"Source {i}")
        text   = truncate_to_words(art.get("text", ""), WORDS_PER_ARTICLE)
        if text:
            article_blocks.append(f"[ARTICLE {i} — {source}]\n{text}")

    articles_str = "\n\n".join(article_blocks)

    prompt = f"""You are a factual news summarizer. Below are {len(articles)} articles from different outlets covering the same news story.

Headline: {headline}

{articles_str}

---

Produce EXACTLY 3 points. Each point must be at least 50 words. Follow this format precisely:

POINT 1 — Main angle:
Write what the main event/development is. At the end, in parentheses, list which article numbers cover this angle: (Articles: 1, 3, 5)

POINT 2 — Different perspective or secondary angle:
Write a different viewpoint, additional context, or angle that some outlets emphasize. At the end: (Articles: 2, 4)

POINT 3 — Hard facts only:
List only verified facts: specific numbers, dates, names, statistics, official statements. No opinions. At the end: (Articles: 1, 2, 3, 4, 5)

Rules:
- Each point must be at least 50 words
- Do not add any text before POINT 1 or after POINT 3
- Do not use bullet sub-points within a point
- If articles are in a non-English language, respond in the same language
- Only cite article numbers that actually discuss that angle"""

    return prompt


# ─────────────────────────────────────────────────────────────────────────────
#  GROQ API
# ─────────────────────────────────────────────────────────────────────────────

class GroqRateLimitError(Exception):
    pass

class GroqDailyLimitReached(Exception):
    pass

_groq_calls_today = 0
_groq_lock = threading.Lock()


def _call_groq(prompt: str) -> str:
    global _groq_calls_today

    with _groq_lock:
        if _groq_calls_today >= GROQ_DAILY_LIMIT:
            raise GroqDailyLimitReached("Groq daily budget exhausted")
        _groq_calls_today += 1
        current_count = _groq_calls_today

    if not GROQ_API_KEY:
        raise ValueError("GROQ_API_KEY not set")

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": GROQ_MODEL,
        "messages": [
            {
                "role": "system",
                "content": "You are a factual news summarizer. Follow the output format exactly."
            },
            {"role": "user", "content": prompt}
        ],
        "max_tokens": 600,
        "temperature": 0.2,
        "top_p": 0.9,
    }

    for attempt in range(3):
        try:
            resp = requests.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers=headers,
                json=payload,
                timeout=60,
            )

            if resp.status_code == 429:
                retry_after = int(resp.headers.get("retry-after", 60))
                # If the wait is long (>30s), don't block — let Gemini handle this cluster
                if retry_after > 30:
                    log.warning(f"    Groq 429 — wait {retry_after}s is too long, handing off to Gemini")
                    raise GroqRateLimitError(f"Groq rate-limited ({retry_after}s wait)")
                log.warning(f"    Groq 429 — waiting {retry_after}s (attempt {attempt+1}/3)")
                time.sleep(retry_after)
                continue

            if resp.status_code == 413:
                log.warning("    Groq 413 — prompt too large")
                raise ValueError("Prompt too large")

            if resp.status_code != 200:
                log.warning(f"    Groq error {resp.status_code}: {resp.text[:200]}")
                time.sleep(10)
                continue

            data = resp.json()
            text = data["choices"][0]["message"]["content"].strip()
            log.info(f"    Groq call #{current_count} OK ({data['usage']['total_tokens']} tokens)")
            return text

        except requests.Timeout:
            log.warning(f"    Groq timeout (attempt {attempt+1})")
            time.sleep(15)

    raise GroqRateLimitError("Groq failed after 3 attempts")


# ─────────────────────────────────────────────────────────────────────────────
#  GEMINI FALLBACK
# ─────────────────────────────────────────────────────────────────────────────

def _call_gemini(prompt: str) -> str:
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY not set")

    url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}"
    )
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "maxOutputTokens": 600,
            "temperature": 0.2,
        },
    }

    for attempt in range(3):
        try:
            resp = requests.post(url, json=payload, timeout=60)

            if resp.status_code == 429:
                wait = int(resp.headers.get("retry-after", 60))
                log.warning(f"    Gemini 429 — waiting {wait}s")
                time.sleep(wait)
                continue

            if resp.status_code != 200:
                log.warning(f"    Gemini error {resp.status_code}: {resp.text[:200]}")
                time.sleep(10)
                continue

            data = resp.json()
            candidates = data.get("candidates", [])
            if not candidates:
                log.warning("    Gemini returned no candidates")
                return ""
            text = candidates[0]["content"]["parts"][0]["text"].strip()
            log.info("    Gemini fallback OK")
            return text

        except requests.Timeout:
            log.warning(f"    Gemini timeout (attempt {attempt+1})")
            time.sleep(15)

    return ""


# ─────────────────────────────────────────────────────────────────────────────
#  UNIFIED CALLER — Groq → Gemini automatic fallback
# ─────────────────────────────────────────────────────────────────────────────

_using_gemini_fallback = False


def call_llm(prompt: str) -> str:
    global _using_gemini_fallback

    if not _using_gemini_fallback:
        try:
            result = _call_groq(prompt)
            time.sleep(GROQ_RPM_SLEEP)
            return result
        except GroqDailyLimitReached:
            log.warning("★ Groq daily limit reached — switching to Gemini for rest of session")
            _using_gemini_fallback = True
        except GroqRateLimitError as e:
            # Groq is in a cooling period — use Gemini for THIS cluster only, then retry Groq next time
            log.warning(f"    {e} — using Gemini for this cluster (Groq will retry next)")
            result = _call_gemini(prompt)
            time.sleep(GEMINI_RPM_SLEEP)
            return result

    # Permanent Gemini fallback (daily limit exhausted)
    result = _call_gemini(prompt)
    time.sleep(GEMINI_RPM_SLEEP)
    return result


# ─────────────────────────────────────────────────────────────────────────────
#  RESPONSE PARSER
# ─────────────────────────────────────────────────────────────────────────────

def parse_three_points(text: str) -> list:
    """Parse LLM output into up to 3 point strings."""
    points = []

    # Primary: split on POINT N pattern
    segments = re.split(r"POINT\s+\d+\s*[—\-–:]", text, flags=re.IGNORECASE)
    segments = [s.strip() for s in segments if s.strip() and len(s.strip()) > 30]

    if len(segments) >= 2:
        for seg in segments[:3]:
            # Strip section label if it got pulled in
            cleaned = re.sub(r"^[^\n:]+:\s*\n?", "", seg, count=1).strip()
            if not cleaned:
                cleaned = seg.strip()
            if len(cleaned) > 30:
                points.append(cleaned)

    # Fallback: paragraph splits
    if len(points) < 2:
        paragraphs = [p.strip() for p in text.split("\n\n") if len(p.strip()) > 50]
        points = paragraphs[:3]

    # Last resort: sentence grouping
    if len(points) < 2:
        sentences = re.split(r"(?<=[.!?])\s+", text.strip())
        sentences = [s.strip() for s in sentences if len(s.strip()) > 30]
        if len(sentences) >= 2:
            chunk = max(1, len(sentences) // 3)
            points = [
                " ".join(sentences[:chunk]),
                " ".join(sentences[chunk:chunk*2]),
                " ".join(sentences[chunk*2:]),
            ]
            points = [p for p in points if p]

    if not points:
        points = [text[:1000].strip()]

    return points[:3]


# ─────────────────────────────────────────────────────────────────────────────
#  MAIN — single-threaded (Groq free tier: 30 RPM, 4s sleep = 15 RPM safe)
# ─────────────────────────────────────────────────────────────────────────────

def run():
    log.info("=== Summarizer v3 (Groq + Gemini fallback) starting ===")

    if not GROQ_API_KEY:
        log.error("GROQ_API_KEY not set in config.py!")
        return
    if not GEMINI_API_KEY:
        log.warning("GEMINI_API_KEY not set — no fallback if Groq daily limit hits")

    log.info("Connecting to MongoDB...")
    mongo_client = MongoClient(MONGO_URI)
    cluster_col = mongo_client[DB_NAME][COL_CLUSTERS]

    clusters = list(cluster_col.find({}, {"_id": 1, "headline": 1, "articles": 1, "summary": 1}))
    total = len(clusters)
    log.info(f"Found {total} clusters in {COL_CLUSTERS}")

    completed_ids = load_checkpoint()

    # Skip clusters that EITHER are in the checkpoint OR already have 3 summary points in DB
    def already_done(c):
        if str(c["_id"]) in completed_ids:
            return True
        existing = c.get("summary", [])
        return isinstance(existing, list) and len(existing) >= 3

    pending = [c for c in clusters if not already_done(c)]
    db_skipped = sum(1 for c in clusters if isinstance(c.get("summary"), list) and len(c.get("summary", [])) >= 3)
    log.info(f"Pending: {len(pending)} | Checkpoint: {len(completed_ids)} | DB already summarized: {db_skipped}")

    if not pending:
        log.info("All clusters already summarized. Delete summarizer_checkpoint.json to re-run.")
        return

    success = failed = skipped = 0
    start_time = time.time()

    for i, cluster in enumerate(pending, 1):
        headline = cluster.get("headline", "Unknown")
        log.info(f"\n[{i}/{len(pending)}] {headline[:70]}")

        articles = prepare_articles_for_prompt(cluster)

        if not articles:
            log.warning("  → No content, skipping")
            skipped += 1
            completed_ids.add(str(cluster["_id"]))
            save_checkpoint(completed_ids)
            continue

        lang = detect_language(articles[0]["text"])
        log.info(f"  → {len(articles)} articles, lang: {lang}")

        prompt = build_prompt(headline, articles)

        try:
            raw_response = call_llm(prompt)
        except Exception as e:
            log.error(f"  → Both APIs failed: {e}")
            failed += 1
            continue

        if not raw_response:
            log.warning("  → Empty LLM response")
            failed += 1
            continue

        points = parse_three_points(raw_response)
        log.info(f"  → Parsed {len(points)} points")
        for j, p in enumerate(points, 1):
            log.info(f"     P{j}: {p[:90]}...")

        cluster_col.update_one(
            {"_id": cluster["_id"]},
            {"$set": {
                "summary":      points,
                "summaryRaw":   raw_response,
                "summaryModel": "gemini" if _using_gemini_fallback else "groq",
                "updatedAt":    datetime.now(timezone.utc),
            }},
        )

        completed_ids.add(str(cluster["_id"]))
        save_checkpoint(completed_ids)
        success += 1

        if i % 50 == 0:
            elapsed = time.time() - start_time
            rate = i / elapsed * 60
            eta_min = (len(pending) - i) / max(rate, 0.1)
            log.info(f"\n  ── Progress: {i}/{len(pending)} | {rate:.1f}/min | ETA: {eta_min:.0f} min ──")

    elapsed_total = time.time() - start_time
    log.info(f"\n{'═' * 50}")
    log.info(f"Success  : {success}")
    log.info(f"Skipped  : {skipped}")
    log.info(f"Failed   : {failed}")
    log.info(f"Total    : {total}")
    log.info(f"Groq calls used : {_groq_calls_today} / {GROQ_DAILY_LIMIT}")
    log.info(f"Time elapsed    : {elapsed_total/60:.1f} min")
    log.info(f"Gemini fallback : {'Yes' if _using_gemini_fallback else 'No'}")


if __name__ == "__main__":
    run()
